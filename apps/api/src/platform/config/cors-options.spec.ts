import { corsOptionsForOrigin } from "./cors-options";

describe("corsOptionsForOrigin", () => {
  it("allowlists the exact web origin and browser methods/headers", () => {
    const options = corsOptionsForOrigin("http://localhost:3000");
    expect(options.origin).toBe("http://localhost:3000");
    expect(options.methods).toEqual(["GET", "POST", "OPTIONS"]);
    expect(options.allowedHeaders).toEqual(["Content-Type", "Authorization"]);
    expect(options.credentials).toBe(false);
    expect(options.origin).not.toBe("*");
  });
});
