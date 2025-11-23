// src/components/SearchFilters.tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";

const FLAG_DEFS: { key: string; label: string }[] = [
  { key: "has_house",         label: "Tiene casa" },
  { key: "has_yard",          label: "Jardín vallado" },
  { key: "no_dogs_at_home",   label: "Sin perros en casa" },
  { key: "no_cats_at_home",   label: "Sin gatos en casa" },
  { key: "one_pet_only",      label: "Solo 1 mascota" },
  { key: "no_kids",           label: "Sin niños" },
  { key: "puppy_care",        label: "Cuida cachorros" },
  { key: "cat_care",          label: "Cuida gatos" },
  { key: "accepts_unspayed",  label: "Acepta no esterilizadas" },
  { key: "accepts_unneutered",label: "Acepta no castrados" },
];

export default function SearchFilters({ params }: { params: URLSearchParams }) {
  const nav = useNavigate();

  const activeCount = useMemo(
    () => FLAG_DEFS.reduce((n, f) => n + (params.get(f.key) === "1" ? 1 : 0), 0),
    [params]
  );

  const toggle = (key: string) => {
    const p = new URLSearchParams(params);
    if (p.get(key) === "1") p.delete(key); else p.set(key, "1");
    p.delete("page"); // reset paginación si la tienes
    nav(`/search?${p.toString()}`);
  };

  const reset = () => {
    const p = new URLSearchParams(params);
    FLAG_DEFS.forEach(f => p.delete(f.key));
    p.delete("page");
    nav(`/search?${p.toString()}`);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">Filtros <span className="text-slate-500">({activeCount})</span></div>
        {activeCount > 0 && (
          <button className="text-xs underline" onClick={reset}>Restablecer</button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {FLAG_DEFS.map(f => {
          const active = params.get(f.key) === "1";
          return (
            <Button
              key={f.key}
              variant="outline"
              size="sm"
              active={active}
              onClick={() => toggle(f.key)}
              title={f.label}
            >
              {f.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
