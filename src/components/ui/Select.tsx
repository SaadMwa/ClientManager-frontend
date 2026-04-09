import { forwardRef } from "react";
import type {SelectHTMLAttributes} from 'react'
import { cn } from "../../utils/cn";

const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-1))] px-3 text-sm text-[rgb(var(--text-1))] shadow-sm outline-none transition focus:border-[rgb(var(--brand-2))] focus:ring-2 focus:ring-[rgba(56,116,255,0.2)]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);

Select.displayName = "Select";

export default Select;
