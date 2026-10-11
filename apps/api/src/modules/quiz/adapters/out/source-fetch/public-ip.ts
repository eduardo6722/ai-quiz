import { isIP } from "node:net";

const IPV4_BLOCKED_CIDRS = [
  "0.0.0.0/8",
  "10.0.0.0/8",
  "127.0.0.0/8",
  "169.254.0.0/16",
  "172.16.0.0/12",
  "192.168.0.0/16",
  "224.0.0.0/4",
  "255.255.255.255/32",
] as const;

function ipv4ToInt(ip: string): number {
  const parts = ip.split(".").map((part) => Number(part));
  return ((parts[0]! << 24) | (parts[1]! << 16) | (parts[2]! << 8) | parts[3]!) >>> 0;
}

function ipv4InCidr(ip: string, cidr: string): boolean {
  const [base, bitsText] = cidr.split("/");
  const bits = Number(bitsText);
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base!) & mask);
}

function parseHextet(value: string): number | undefined {
  if (value.length === 0 || value.length > 4) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 16);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/** Expand an IPv6 literal into eight 16-bit hextets, including dotted IPv4 suffixes. */
function ipv6ToHextets(address: string): number[] | undefined {
  const lower = address.toLowerCase();
  let head = lower;
  let tail: number[] = [];
  const lastColon = lower.lastIndexOf(":");
  const after = lower.slice(lastColon + 1);
  if (isIP(after) === 4) {
    const parts = after.split(".").map((part) => Number(part));
    tail = [(parts[0]! << 8) | parts[1]!, (parts[2]! << 8) | parts[3]!];
    head = lower.slice(0, lastColon);
  }

  const halves = head.split("::");
  if (halves.length > 2) {
    return undefined;
  }
  const left = halves[0] === undefined || halves[0].length === 0 ? [] : halves[0].split(":");
  const right =
    halves.length === 1 || halves[1] === undefined || halves[1].length === 0 ? [] : halves[1].split(":");
  const missing = 8 - left.length - right.length - tail.length;
  if (missing < 0 || (halves.length === 1 && missing !== 0)) {
    return undefined;
  }
  const tokens = [...left, ...Array.from({ length: missing }, () => "0"), ...right];
  const hextets: number[] = [];
  for (const token of tokens) {
    const value = parseHextet(token);
    if (value === undefined) {
      return undefined;
    }
    hextets.push(value);
  }
  const result = [...hextets, ...tail];
  return result.length === 8 ? result : undefined;
}

function dottedFromHextets(high: number, low: number): string {
  return `${(high >> 8) & 0xff}.${high & 0xff}.${(low >> 8) & 0xff}.${low & 0xff}`;
}

/**
 * Unwrap IPv4-mapped (`::ffff:…`) and deprecated IPv4-compatible (`::x.x.x.x`)
 * forms, including hex `::ffff:7f00:1`. Native `::1` is left to the IPv6 checks.
 */
function embeddedIpv4(address: string): string | undefined {
  if (isIP(address) !== 6) {
    return undefined;
  }
  const hextets = ipv6ToHextets(address);
  if (hextets === undefined) {
    return undefined;
  }
  const prefix80Zero = hextets[0] === 0 && hextets[1] === 0 && hextets[2] === 0 && hextets[3] === 0 && hextets[4] === 0;
  if (!prefix80Zero) {
    return undefined;
  }
  const high = hextets[6];
  const low = hextets[7];
  if (high === undefined || low === undefined) {
    return undefined;
  }
  if (hextets[5] === 0xffff) {
    return dottedFromHextets(high, low);
  }
  if (hextets[5] === 0 && !(high === 0 && low === 1) && !(high === 0 && low === 0)) {
    return dottedFromHextets(high, low);
  }
  return undefined;
}

function firstIpv6Hextet(address: string): number | undefined {
  const hextets = ipv6ToHextets(address);
  return hextets?.[0];
}

export function isPublicIp(address: string): boolean {
  const embedded = embeddedIpv4(address);
  if (embedded !== undefined) {
    return isPublicIp(embedded);
  }

  if (isIP(address) === 4) {
    return !IPV4_BLOCKED_CIDRS.some((cidr) => ipv4InCidr(address, cidr));
  }

  if (isIP(address) === 6) {
    const lower = address.toLowerCase();
    if (lower === "::" || lower === "::1") {
      return false;
    }
    const hextet = firstIpv6Hextet(address);
    if (hextet === undefined) {
      return false;
    }
    if ((hextet & 0xfe00) === 0xfc00) {
      return false;
    }
    if ((hextet & 0xffc0) === 0xfe80) {
      return false;
    }
    if ((hextet & 0xff00) === 0xff00) {
      return false;
    }
    return true;
  }

  return false;
}
