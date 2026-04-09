import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "rounded-2xl border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-1))] shadow-[var(--shadow-1)] dark:border-gray-700 dark:bg-gray-800",
      className
    )}
    {...props}
  />
);

export default Card;
