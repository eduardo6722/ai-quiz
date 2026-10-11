import { isPublicIp } from "./public-ip";

describe("isPublicIp", () => {
  it.each([
    "127.0.0.1",
    "127.0.0.2",
    "0.0.0.0",
    "10.0.0.1",
    "10.255.255.255",
    "172.16.0.1",
    "172.31.255.1",
    "192.168.1.1",
    "169.254.0.1",
    "169.254.169.254",
    "224.0.0.1",
    "255.255.255.255",
  ])("rejects IPv4 %s", (address) => {
    expect(isPublicIp(address)).toBe(false);
  });

  it.each(["::", "::1", "fc00::1", "fd12:3456:789a:1::1", "fe80::1", "ff02::1"])(
    "rejects IPv6 %s",
    (address) => {
      expect(isPublicIp(address)).toBe(false);
    },
  );

  it("rejects IPv4-mapped loopback in dotted and hex form", () => {
    expect(isPublicIp("::ffff:127.0.0.1")).toBe(false);
    expect(isPublicIp("::ffff:7f00:1")).toBe(false);
    expect(isPublicIp("0:0:0:0:0:ffff:7f00:1")).toBe(false);
  });

  it("rejects IPv4-mapped private and link-local addresses, including hex", () => {
    expect(isPublicIp("::ffff:10.0.0.1")).toBe(false);
    expect(isPublicIp("::ffff:0a00:1")).toBe(false);
    expect(isPublicIp("::ffff:192.168.0.1")).toBe(false);
    expect(isPublicIp("::ffff:c0a8:1")).toBe(false);
    expect(isPublicIp("::ffff:169.254.169.254")).toBe(false);
    expect(isPublicIp("::ffff:a9fe:a9fe")).toBe(false);
  });

  it("accepts public IPv4 and IPv6 addresses", () => {
    expect(isPublicIp("8.8.8.8")).toBe(true);
    expect(isPublicIp("1.1.1.1")).toBe(true);
    expect(isPublicIp("2001:4860:4860::8888")).toBe(true);
    expect(isPublicIp("::ffff:8.8.8.8")).toBe(true);
    expect(isPublicIp("::ffff:0808:0808")).toBe(true);
  });
});
