import { cn } from "@/utils/cn";

export interface ProgressProps {
  /** 0-100. Omit for an indeterminate (animated) bar. */
  value?: number;
  className?: string;
}

function Progress({ value, className }: ProgressProps) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn(
          "h-full rounded-full bg-primary transition-all",
          value === undefined && "w-1/3 animate-pulse"
        )}
        style={value !== undefined ? { width: `${Math.min(100, Math.max(0, value))}%` } : undefined}
      />
    </div>
  );
}

export { Progress };
