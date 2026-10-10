import type { Metadata } from "next";
import type { ReactNode } from "react";
import { env } from "../env";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Quiz Generator",
  description: "Local workspace for generating quizzes from Markdown sources.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  void env;
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
