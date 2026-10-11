import { hashAttemptToken, mintAttemptToken, parseBearerToken, tokenHashEquals } from "./attempt-token";

describe("attempt-token", () => {
  it("mints a base64url token and hashes it as SHA-256 hex", () => {
    const token = mintAttemptToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThanOrEqual(32);
    const hash = hashAttemptToken(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toBe(token);
  });

  it("compares hashes with a length-checked equality helper", () => {
    const hash = hashAttemptToken("secret-token");
    expect(tokenHashEquals(hash, hashAttemptToken("secret-token"))).toBe(true);
    expect(tokenHashEquals(hash, hashAttemptToken("other"))).toBe(false);
  });

  it("rejects missing or malformed Authorization headers", () => {
    expect(() => parseBearerToken(undefined)).toThrow();
    try {
      parseBearerToken(undefined);
    } catch (error) {
      expect(error).toMatchObject({ code: "UNAUTHORIZED_ATTEMPT" });
    }
    try {
      parseBearerToken("Basic abc");
    } catch (error) {
      expect(error).toMatchObject({ code: "UNAUTHORIZED_ATTEMPT" });
    }
    try {
      parseBearerToken("Bearer one two");
    } catch (error) {
      expect(error).toMatchObject({ code: "UNAUTHORIZED_ATTEMPT" });
    }
  });

  it("does not log plaintext tokens, Authorization headers, or hashes", () => {
    const log = jest.spyOn(console, "log").mockImplementation();
    const info = jest.spyOn(console, "info").mockImplementation();
    const error = jest.spyOn(console, "error").mockImplementation();
    const token = mintAttemptToken();
    hashAttemptToken(token);
    parseBearerToken(`Bearer ${token}`);
    expect(log).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    log.mockRestore();
    info.mockRestore();
    error.mockRestore();
  });
});
