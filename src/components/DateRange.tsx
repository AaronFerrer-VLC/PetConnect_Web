// src/components/DateRange.tsx
type Props = {
  start?: string;
  end?: string;
  onChange: (start: string, end: string) => void;
  className?: string;
};
export default function DateRange({ start="", end="", onChange, className="" }: Props) {
  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      <input
        type="date"
        className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
        defaultValue={start}
        onBlur={(e) => onChange(e.target.value, end)}
      />
      <input
        type="date"
        className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
        defaultValue={end}
        onBlur={(e) => onChange(start, e.target.value)}
      />
    </div>
  );
}
