// src/pages/ServicesManager.tsx
import { useEffect, useState } from "react";
import Button from "../components/Button";
import { ServicesAPI } from "../lib/api";
import type { Service, ServiceType } from "../lib/types";

const TYPES: { value: ServiceType; label: string }[] = [
  { value: "boarding", label: "Alojamiento" },
  { value: "daycare", label: "Guardería" },
  { value: "walking", label: "Paseo" },
  { value: "house_sitting", label: "Cuidado en casa" },
  { value: "drop_in", label: "Visitas a domicilio" },
];

export default function ServicesManager() {
  const [list, setList] = useState<Service[]>([]);
  const [form, setForm] = useState<{ type: ServiceType; price: number; description?: string }>({
    type: "boarding",
    price: 20,
    description: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setList(await ServicesAPI.list());
      } catch {
        setList([]);
      }
    })();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const s = await ServicesAPI.create(form);
      setList((prev) => [s, ...prev]);
      setForm({ type: "boarding", price: 20, description: "" });
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (id: string, enabled: boolean | undefined) => {
    const s = await ServicesAPI.toggle(id, !enabled);
    setList((prev) => prev.map((x) => (x.id === s.id ? s : x)));
  };

  const update = async (id: string, price: number, description?: string) => {
    const s = await ServicesAPI.update(id, { price, description });
    setList((prev) => prev.map((x) => (x.id === s.id ? s : x)));
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-3">Mis servicios</h1>

      <form onSubmit={create} className="grid md:grid-cols-4 gap-2 mb-4">
        <select
          className="input"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as ServiceType })}
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <input
          className="input"
          type="number"
          min={0}
          step={1}
          placeholder="€ precio"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
        />
        <input
          className="input md:col-span-1"
          placeholder="Descripción"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <Button disabled={saving} type="submit">Publicar</Button>
      </form>

      <ul className="space-y-2">
        {list.map((s) => {
          const label = TYPES.find((t) => t.value === s.type)?.label || s.type;
          return (
            <li key={s.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <div className="font-medium flex-1">{label}</div>
                <span className="text-sm">€ {s.price}</span>
                <button
                  className={`h-8 px-3 rounded-full border ${s.enabled ? "border-emerald-500 text-emerald-600" : "border-slate-400 text-slate-500"}`}
                  onClick={() => toggle(s.id, s.enabled)}
                  title={s.enabled ? "Desactivar" : "Activar"}
                >
                  {s.enabled ? "Activo" : "Inactivo"}
                </button>
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  className="input w-full"
                  placeholder="Descripción"
                  defaultValue={s.description || ""}
                  onBlur={(e) => update(s.id, s.price, e.target.value)}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
