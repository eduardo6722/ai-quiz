export type BrowserCorsOptions = {
  origin: string;
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
};

export function corsOptionsForOrigin(origin: string): BrowserCorsOptions {
  return {
    origin,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  };
}
