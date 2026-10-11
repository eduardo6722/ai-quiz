import { normalizeGitHubBlobUrl } from "./github-blob";

describe("normalizeGitHubBlobUrl", () => {
  it("rewrites a GitHub blob URL to raw.githubusercontent.com", () => {
    expect(
      normalizeGitHubBlobUrl("https://github.com/expressjs/express/blob/master/Readme.md"),
    ).toBe("https://raw.githubusercontent.com/expressjs/express/master/Readme.md");
  });

  it("leaves gist and other non-blob GitHub URLs unchanged", () => {
    const gist = "https://gist.github.com/user/abc123";
    const repoRoot = "https://github.com/expressjs/express";
    expect(normalizeGitHubBlobUrl(gist)).toBe(gist);
    expect(normalizeGitHubBlobUrl(repoRoot)).toBe(repoRoot);
  });

  it("leaves malformed blob-like paths unchanged", () => {
    const missingRepo = "https://github.com/expressjs/blob/master/Readme.md";
    const notGithub = "https://gitlab.com/group/project/blob/main/README.md";
    expect(normalizeGitHubBlobUrl(missingRepo)).toBe(missingRepo);
    expect(normalizeGitHubBlobUrl(notGithub)).toBe(notGithub);
  });
});
