// src/components/Pagination.tsx
type Props = {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
};
export default function Pagination({ page, pageSize, total, onChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const go = (p: number) => onChange(Math.min(totalPages, Math.max(1, p)));

  // Ventana corta de páginas
  const around = 2;
  const pages = [];
  for (let p = Math.max(1, page - around); p <= Math.min(totalPages, page + around); p++) pages.push(p);

  return (
    <div className="flex items-center gap-1 justify-center mt-4 text-sm">
      <button className="px-2 py-1 rounded border" onClick={() => go(1)} disabled={page === 1}>«</button>
      <button className="px-2 py-1 rounded border" onClick={() => go(page - 1)} disabled={page === 1}>‹</button>
      {pages[0] > 1 && <span className="px-2">…</span>}
      {pages.map(p => (
        <button
          key={p}
          className={`px-3 py-1 rounded border ${p===page ? "bg-brand text-white border-brand" : ""}`}
          onClick={() => go(p)}
        >{p}</button>
      ))}
      {pages[pages.length-1] < totalPages && <span className="px-2">…</span>}
      <button className="px-2 py-1 rounded border" onClick={() => go(page + 1)} disabled={page === totalPages}>›</button>
      <button className="px-2 py-1 rounded border" onClick={() => go(totalPages)} disabled={page === totalPages}>»</button>
    </div>
  );
}
