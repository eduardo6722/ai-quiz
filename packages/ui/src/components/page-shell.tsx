import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function PageShell({ className, children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <main
      className={cn("min-h-svh bg-background font-sans text-foreground antialiased", className)}
      {...props}
    >
      <div className="mx-auto w-full max-w-[1150px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">{children}</div>
    </main>
  );
}
