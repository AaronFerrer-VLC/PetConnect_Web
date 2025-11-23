import { useEffect, useMemo, useState } from "react";
import ChipToggle from "./ChipToggle";
import Button from "./Button";

const SERVICE_OPTS = [
  { value: "boarding", label: "Alojamiento de mascotas" },
  { value: "house_sitting", label: "Cuidado a domicilio" },
  { value: "drop_in", label: "Visitas a domicilio" },
  { value: "daycare", label: "Guardería de día" },
  { value: "walking", label: "Paseo de perros" },
];

const SIZE_OPTS = [
  { value: "", label: "Cualquiera" },
  { value: "small", label: "0–7 kg" },
  { value: "medium", label: "7–18 kg" },
  { value: "large", label: "18–45 kg" },
  { value: "giant", label: "45+ kg" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  initialParams?: URLSearchParams | null;
  onApply: (qs: URLSearchParams) => void;
};

export default function SearchWizard({ open, onClose, initialParams, onApply }: Props) {
  const init = useMemo(() => initialParams ?? new URLSearchParams(), [initialParams]);
  const [type, setType] = useState(init.get("type") || "boarding");
  const [size, setSize] = useState(init.get("size") || "");
  const [city, setCity] = useState(init.get("city") || "Madrid");
  const [start, setStart] = useState(init.get("start") || "");
  const [end, setEnd] = useState(init.get("end") || "");

  useEffect(() => {
    if (!open) return;
    // resync si abres con otros params
    setType(init.get("type") || "boarding");
    setSize(init.get("size") || "");
    setCity(init.get("city") || "Madrid");
    setStart(init.get("start") || "");
    setEnd(init.get("end") || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const apply = () => {
    const qs = new URLSearchParams();
    if (type) qs.set("type", type);
    if (size) qs.set("size", size);
    if (city) qs.set("city", city);
    if (start) qs.set("start", start);
    if (end) qs.set("end", end);
    onApply(qs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Encuentra al cuidador ideal</h3>
            <button className="text-sm underline" onClick={onClose}>Cerrar</button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-slate-500 mb-1">¿Qué servicio necesitas?</div>
              <ChipToggle value={type} onChange={setType} options={SERVICE_OPTS} />
            </div>

            <div>
              <div className="text-sm text-slate-500 mb-1">Tamaño del perro</div>
              <ChipToggle value={size} onChange={setSize} options={SIZE_OPTS} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                className="h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
                placeholder="Ciudad (ej. Madrid)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <input
                type="date"
                className="h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
              <input
                type="date"
                className="h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="subtle" onClick={onClose}>Cancelar</Button>
              <Button onClick={apply}>Buscar</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
