import { lookup as dnsLookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";

export type LookupResult = { address: string; family: 4 | 6 };

export type FetchGetResult = {
  status: number;
  headers: Record<string, string>;
  body: Buffer;
};

export type FetchGetOptions = {
  hostname: string;
  ip: string;
  path: string;
  port: number;
  timeoutMs: number;
  maxBytes: number;
};

export type FetchTransport = {
  lookup(host: string): Promise<LookupResult[]>;
  get(options: FetchGetOptions): Promise<FetchGetResult>;
};

export class FetchTimeoutError extends Error {
  constructor() {
    super("timeout");
    this.name = "FetchTimeoutError";
  }
}

export class FetchTooLargeError extends Error {
  constructor() {
    super("too large");
    this.name = "FetchTooLargeError";
  }
}

export function defaultFetchTransport(): FetchTransport {
  return {
    async lookup(host) {
      const records = await dnsLookup(host, { all: true, verbatim: true });
      return records.map((record) => ({
        address: record.address,
        family: record.family === 6 ? 6 : 4,
      }));
    },
    get(options) {
      return new Promise((resolve, reject) => {
        const req = httpsRequest(
          {
            host: options.ip,
            servername: options.hostname,
            port: options.port,
            path: options.path,
            method: "GET",
            headers: {
              Host: options.hostname,
              Accept: "text/plain, text/markdown, */*",
            },
            timeout: options.timeoutMs,
          },
          (res) => {
            const chunks: Buffer[] = [];
            let size = 0;
            res.on("data", (chunk: Buffer) => {
              size += chunk.length;
              if (size > options.maxBytes) {
                req.destroy();
                reject(new FetchTooLargeError());
                return;
              }
              chunks.push(chunk);
            });
            res.on("end", () => {
              const headers: Record<string, string> = {};
              for (const [key, value] of Object.entries(res.headers)) {
                if (typeof value === "string") {
                  headers[key.toLowerCase()] = value;
                } else if (Array.isArray(value)) {
                  headers[key.toLowerCase()] = value.join(", ");
                }
              }
              resolve({
                status: res.statusCode ?? 0,
                headers,
                body: Buffer.concat(chunks),
              });
            });
          },
        );
        req.on("timeout", () => {
          req.destroy();
          reject(new FetchTimeoutError());
        });
        req.on("error", reject);
        req.end();
      });
    },
  };
}
