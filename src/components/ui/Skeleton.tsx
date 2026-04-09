import type{ HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

const Skeleton = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "animate-pulse rounded-xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200",
      className
    )}
    {...props}
  />
);

export default Skeleton;
