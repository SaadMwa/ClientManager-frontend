import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[rgb(var(--brand-2))] text-white hover:bg-[rgb(var(--brand-1))] shadow-sm",
  secondary:
    "bg-[rgb(var(--surface-2))] text-[rgb(var(--text-1))] hover:bg-white border border-[rgb(var(--stroke-1))]",
  outline:
    "border border-[rgb(var(--stroke-1))] text-[rgb(var(--text-1))] hover:border-[rgb(var(--brand-2))] hover:text-[rgb(var(--brand-2))]",
  ghost:
    "text-[rgb(var(--text-2))] hover:text-[rgb(var(--text-1))] hover:bg-[rgb(var(--surface-2))]",
  danger:
    "bg-[rgb(var(--danger))] text-white hover:bg-red-700 shadow-sm",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
  icon: "h-10 w-10 p-0",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = ({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand-2))] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
};

export default Button;
