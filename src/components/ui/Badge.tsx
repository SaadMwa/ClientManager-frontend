import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type BadgeTone = "success" | "warning" | "neutral";

const toneStyles: Record<BadgeTone, string> = {
  success:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800",
  warning:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800",
  neutral:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const Badge = ({ tone = "neutral", className, ...props }: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
      toneStyles[tone],
      className
    )}
    {...props}
  />
);

export default Badge;
