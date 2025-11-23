type Props = { value?: number | null; size?: "sm" | "md"; count?: number };
export default function StarRating({ value = 0, size = "md", count }: Props) {
  const full = Math.round(value || 0);
  const cls = size === "sm" ? "text-xs" : "text-sm";
  return (
    <div className={`inline-flex items-center gap-1 ${cls}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < full ? "★" : "☆"}</span>
      ))}
      {value ? <span className="opacity-70">({value.toFixed(1)}{typeof count === "number" ? ` · ${count}` : ""})</span> : null}
    </div>
  );
}