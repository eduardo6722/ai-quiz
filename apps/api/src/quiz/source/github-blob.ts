const GITHUB_BLOB =
  /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/i;

export function normalizeGitHubBlobUrl(url: string): string {
  const match = url.match(GITHUB_BLOB);
  if (match === null) {
    return url;
  }
  return `https://raw.githubusercontent.com/${match[1]}/${match[2]}/${match[3]}`;
}
