import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Alert({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" }) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border px-4 py-3 text-sm leading-relaxed",
        variant === "destructive"
          ? "border-destructive/40 bg-card text-destructive"
          : "border-border bg-sage text-foreground",
        className,
      )}
      {...props}
    />
  );
}
