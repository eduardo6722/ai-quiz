import { cn } from "../lib/cn";

export function Progress({
  value,
  className,
  "aria-label": ariaLabel,
}: {
  value: number;
  className?: string;
  "aria-label"?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-sage", className)}
    >
      <div className="h-full bg-primary transition-all motion-reduce:transition-none" style={{ width: `${clamped}%` }} />
    </div>
  );
}
