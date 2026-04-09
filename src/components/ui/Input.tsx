import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-[rgb(var(--stroke-1))] bg-[rgb(var(--surface-1))] px-4 text-sm text-[rgb(var(--text-1))] placeholder:text-[rgb(var(--text-2))] shadow-sm outline-none transition focus:border-[rgb(var(--brand-2))] focus:ring-2 focus:ring-[rgba(56,116,255,0.2)]",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";

export default Input;
