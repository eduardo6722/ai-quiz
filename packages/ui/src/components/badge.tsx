import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "success" | "danger" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium",
        tone === "success" && "bg-mint text-success",
        tone === "danger" && "bg-card text-destructive",
        tone === "neutral" && "bg-sage text-foreground",
        className,
      )}
      {...props}
    />
  );
}
