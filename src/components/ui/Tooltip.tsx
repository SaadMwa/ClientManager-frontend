import type{ ReactNode } from "react";

interface TooltipProps {
  label: string;
  children: ReactNode;
}

const Tooltip = ({ label, children }: TooltipProps) => {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute -top-10 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-lg group-hover:block">
        {label}
      </span>
    </span>
  );
};

export default Tooltip;
