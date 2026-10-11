import type { Metadata } from "next";
import type { ReactNode } from "react";
import { env } from "../config/env";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Quiz Generator",
  description: "Generate a quiz from a topic and a Markdown source, then review your weighted score.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  void env;
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
