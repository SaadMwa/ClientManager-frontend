import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

const EmptyState = ({ title, description, action, className }: EmptyStateProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[rgb(var(--stroke-1))] bg-white/70 px-6 py-14 text-center",
        className
      )}
    >
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[rgba(56,116,255,0.12)] text-[rgb(var(--brand-2))]">
        <svg
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M12 2v7" />
          <path d="M9.5 9.5a4 4 0 1 0 5 0" />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-[rgb(var(--text-2))]">{description}</p>
      </div>
      {action}
    </div>
  );
};

export default EmptyState;
