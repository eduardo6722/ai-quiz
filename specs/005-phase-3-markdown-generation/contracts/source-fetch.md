# Source fetch policy (server-only)

Outbound `MarkdownSourcePort.fetch(url)` on the product path. Not a public HTTP resource.

## Normalization

| Input | Resolved before DNS |
| ----- | ------------------- |
| `https://github.com/{owner}/{repo}/blob/{ref}/{path}` | `https://raw.githubusercontent.com/{owner}/{repo}/{ref}/{path}` |
| Any other `https` URL | Unchanged |

`originalUrl` is the client string. `resolvedUrl` is the URL of the successful GET (after rewrite and redirects).

## Destination

Each hop MUST:

- Use scheme `https` only
- Use port 443 (or omitted)
- Have no URL userinfo
- Resolve DNS to **only public** IPs (reject loopback, RFC1918, link-local including `169.254.169.254`, unique-local IPv6, unspecified, multicast, IPv4-mapped forms of the above)
- TLS-connect to a **pinned** public IP with SNI/Host of the hostname (no second, unvalidated DNS lookup)

Max **3** redirects. Re-run the full policy on `Location`. `http` Location → `SOURCE_UNSAFE_DESTINATION`.

## Limits

| Limit | Value | Code |
| ----- | ----- | ---- |
| Hop wait | 10 seconds | `SOURCE_TIMEOUT` |
| Body | 512 KiB | `SOURCE_TOO_LARGE` |
| Redirects | 3 | `SOURCE_FETCH_FAILED` when exceeded |

## Content-Type

Allow `text/markdown`, `text/x-markdown`, `text/plain` (parameters ignored).

After blob normalization, `raw.githubusercontent.com` MAY omit Content-Type if the body is valid UTF-8 text. Other missing types → `SOURCE_UNSUPPORTED_TYPE`.

## Body after success

UTF-8 decode, reject NULs, trim, strip HTML comments. Length after normalize ≥ 200 characters. SHA-256 hex checksum of persisted snapshot. Optional title from the first `# heading`.

Do not retry fetch failures. Do not follow to private IPs even if the first lookup was public.
