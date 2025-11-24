type Props = { value?: number | null; size?: "sm" | "md"; count?: number };
export default function StarRating({ value = 0, size = "md", count }: Props) {
  const numValue = typeof value === "number" ? value : 0;
  const full = Math.floor(numValue);
  const hasHalf = numValue % 1 >= 0.5;
  const cls = size === "sm" ? "text-xs" : "text-sm";
  const starSize = size === "sm" ? "text-sm" : "text-lg";
  
  return (
    <div className={`inline-flex items-center gap-0.5 ${cls}`}>
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < full) {
          // Estrella completa (coloreada)
          return (
            <span key={i} className={`${starSize} text-yellow-400`}>★</span>
          );
        } else if (i === full && hasHalf) {
          // Media estrella
          return (
            <span key={i} className={`${starSize} text-yellow-400`}>★</span>
          );
        } else {
          // Estrella vacía (gris)
          return (
            <span key={i} className={`${starSize} text-slate-400`}>☆</span>
          );
        }
      })}
      {numValue > 0 ? (
        <span className="opacity-70 ml-1">
          ({numValue.toFixed(1)}{typeof count === "number" ? ` · ${count}` : ""})
        </span>
      ) : null}
    </div>
  );
}