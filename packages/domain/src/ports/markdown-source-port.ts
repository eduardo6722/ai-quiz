export type SourceSnapshot = {
  originalUrl: string;
  resolvedUrl: string;
  contentSnapshot: string;
  contentHash: string;
  title?: string;
  fetchedAt: Date;
};

export type MarkdownSourcePort = {
  fetch(url: string): Promise<SourceSnapshot>;
};
