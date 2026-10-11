import { isIP } from "node:net";
import { ApplicationError } from "@ai-quiz/application";
import type { MarkdownSourcePort, SourceSnapshot } from "@ai-quiz/domain";
import {
  FetchTimeoutError,
  FetchTooLargeError,
  type FetchGetResult,
  type FetchTransport,
} from "./fetch-transport";
import { normalizeGitHubBlobUrl } from "./github-blob";
import { MIN_USABLE_CHARS, normalizeMarkdown, sha256Hex } from "./normalize-markdown";
import { isPublicIp } from "./public-ip";

const MAX_BYTES = 512 * 1024;
const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const ALLOWED_TYPES = new Set(["text/markdown", "text/x-markdown", "text/plain"]);

function mediaType(header: string | undefined): string | undefined {
  return header?.split(";")[0]?.trim().toLowerCase();
}

function isAllowedType(type: string | undefined, hostname: string): boolean {
  if (type !== undefined && ALLOWED_TYPES.has(type)) {
    return true;
  }
  return type === undefined && hostname === "raw.githubusercontent.com";
}

/** Node's URL.hostname keeps brackets on IPv6 literals. */
function hostnameOf(url: URL): string {
  const host = url.hostname;
  if (host.startsWith("[") && host.endsWith("]")) {
    return host.slice(1, -1);
  }
  return host;
}

export class HttpsMarkdownSourceAdapter implements MarkdownSourcePort {
  constructor(private readonly transport: FetchTransport) {}

  async fetch(url: string): Promise<SourceSnapshot> {
    const originalUrl = url;
    let current = this.parseHttpsUrl(url);
    current = new URL(normalizeGitHubBlobUrl(current.toString()));
    let redirects = 0;

    while (true) {
      this.assertSafeUrl(current);
      const hostname = hostnameOf(current);
      const ip = await this.resolvePublicIp(hostname);
      const result = await this.getPinned(current, hostname, ip);

      if (REDIRECT_STATUSES.has(result.status)) {
        if (redirects >= MAX_REDIRECTS) {
          throw new ApplicationError("SOURCE_FETCH_FAILED", "too many redirects");
        }
        const location = result.headers.location;
        if (location === undefined || location.length === 0) {
          throw new ApplicationError("SOURCE_FETCH_FAILED", "redirect missing location");
        }
        redirects += 1;
        current = new URL(location, current);
        continue;
      }

      if (result.status < 200 || result.status > 299) {
        throw new ApplicationError("SOURCE_FETCH_FAILED", "source fetch failed");
      }
      if (result.body.length > MAX_BYTES) {
        throw new ApplicationError("SOURCE_TOO_LARGE", "source exceeds 512 KiB");
      }
      if (!isAllowedType(mediaType(result.headers["content-type"]), hostnameOf(current))) {
        throw new ApplicationError("SOURCE_UNSUPPORTED_TYPE", "unsupported source content type");
      }

      const normalized = normalizeMarkdown(result.body);
      if (normalized.text.length < MIN_USABLE_CHARS) {
        throw new ApplicationError("SOURCE_UNUSABLE", "source is too short");
      }

      return {
        originalUrl,
        resolvedUrl: current.toString(),
        contentSnapshot: normalized.text,
        contentHash: sha256Hex(normalized.text),
        title: normalized.title,
        fetchedAt: new Date(),
      };
    }
  }

  private parseHttpsUrl(url: string): URL {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new ApplicationError("SOURCE_UNSAFE_DESTINATION", "source URL is invalid");
    }
    this.assertSafeUrl(parsed);
    return parsed;
  }

  private assertSafeUrl(parsed: URL): void {
    if (parsed.protocol !== "https:") {
      throw new ApplicationError("SOURCE_UNSAFE_DESTINATION", "only https sources are allowed");
    }
    if (parsed.username.length > 0 || parsed.password.length > 0) {
      throw new ApplicationError("SOURCE_UNSAFE_DESTINATION", "source URL must not include credentials");
    }
    if (parsed.port.length > 0 && parsed.port !== "443") {
      throw new ApplicationError("SOURCE_UNSAFE_DESTINATION", "only port 443 is allowed");
    }
    const hostname = hostnameOf(parsed);
    if (isIP(hostname) !== 0 && !isPublicIp(hostname)) {
      throw new ApplicationError("SOURCE_UNSAFE_DESTINATION", "source destination is not public");
    }
  }

  private async resolvePublicIp(hostname: string): Promise<string> {
    if (isIP(hostname) !== 0) {
      if (!isPublicIp(hostname)) {
        throw new ApplicationError("SOURCE_UNSAFE_DESTINATION", "source destination is not public");
      }
      return hostname;
    }
    let records;
    try {
      records = await this.transport.lookup(hostname);
    } catch {
      throw new ApplicationError("SOURCE_FETCH_FAILED", "source DNS lookup failed");
    }
    if (records.length === 0) {
      throw new ApplicationError("SOURCE_FETCH_FAILED", "source DNS lookup failed");
    }
    if (records.some((record) => !isPublicIp(record.address))) {
      throw new ApplicationError("SOURCE_UNSAFE_DESTINATION", "source destination is not public");
    }
    return records[0]!.address;
  }

  private async getPinned(current: URL, hostname: string, ip: string): Promise<FetchGetResult> {
    try {
      return await this.transport.get({
        hostname,
        ip,
        path: `${current.pathname}${current.search}`,
        port: 443,
        timeoutMs: TIMEOUT_MS,
        maxBytes: MAX_BYTES,
      });
    } catch (error) {
      if (error instanceof FetchTimeoutError) {
        throw new ApplicationError("SOURCE_TIMEOUT", "source fetch timed out");
      }
      if (error instanceof FetchTooLargeError) {
        throw new ApplicationError("SOURCE_TOO_LARGE", "source exceeds 512 KiB");
      }
      throw new ApplicationError("SOURCE_FETCH_FAILED", "source fetch failed");
    }
  }
}
