// src/components/SegmentedControl.tsx
import React from "react";

type Opt = { value: string; label: string };
type Props = {
  value: string;
  options: Opt[];
  onChange: (v: string) => void;
  size?: "sm" | "md";
  className?: string;
};
export default function SegmentedControl({ value, options, onChange, size="sm", className="" }: Props) {
  const h = size === "sm" ? "h-9 text-sm" : "h-10";
  return (
    <div className={`inline-flex rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 ${className}`}>
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            className={`${h} px-3 first:rounded-l-lg last:rounded-r-lg 
            ${active ? "bg-brand text-white" : "text-slate-700 dark:text-slate-200"} 
            hover:bg-brand/10 dark:hover:bg-brand/20 transition`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
