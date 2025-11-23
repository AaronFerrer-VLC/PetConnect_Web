import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import { AvailabilityAPI } from "../lib/api";

type YM = { year: number; month: number }; 
type Availability = { user?: any };
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function fmtISODate(d: Date) { return d.toISOString().slice(0, 10); } 
function sameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
const WEEK_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const KEY_FOR_DOW = ["sun","mon","tue","wed","thu","fri","sat"] as const;

export default function Availability({ user }: Availability) {
  const [loading, setLoading] = useState(true);
  const [maxPets, setMaxPets] = useState<number>(1);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [weeklyOpen, setWeeklyOpen] = useState<Record<string, boolean>>(
    { sun:true, mon:true, tue:true, wed:true, thu:true, fri:true, sat:true }
  );

  const [cursor, setCursor] = useState<Date>(startOfMonth(new Date()));
  const today = new Date();

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const av = await AvailabilityAPI.get();
        if (!alive) return;
        setMaxPets(av.max_pets);
        setBlocked(av.blocked_dates || []);
        setWeeklyOpen(av.weekly_open || { sun:true, mon:true, tue:true, wed:true, thu:true, fri:true, sat:true });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const last = endOfMonth(cursor);
    const start = new Date(first);
    const offset = (first.getDay() + 6) % 7;
    start.setDate(first.getDate() - offset);

    const arr: { date: Date; inMonth: boolean; iso: string }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      arr.push({ date: d, inMonth: d >= first && d <= last, iso: fmtISODate(d) });
    }
    return arr;
  }, [cursor]);

  const isBlocked = (d: Date, iso: string) => {
    if (blocked.includes(iso)) return true;
    const key = KEY_FOR_DOW[d.getDay()];
    return weeklyOpen[key] === false;
  };

  const toggleDay = async (iso: string, d: Date) => {
    try {
      if (blocked.includes(iso)) {
        const next = await AvailabilityAPI.unblockDates([iso]);
        setBlocked(next.blocked_dates);
      } else {
        const next = await AvailabilityAPI.blockDates([iso]);
        setBlocked(next.blocked_dates);
      }
    } catch (e: any) {
      alert(e?.message || "No se pudo actualizar el día.");
    }
  };

  const changeWeekday = async (idx: number, value: boolean) => {
    const key = KEY_FOR_DOW[idx];
    try {
      await AvailabilityAPI.setWeeklyOpen({ [key]: value });
      setWeeklyOpen((w) => ({ ...w, [key]: value }));
    } catch (e: any) {
      alert(e?.message || "No se pudo actualizar la disponibilidad semanal.");
    }
  };

  const saveMaxPets = async () => {
    try {
      const v = Math.max(1, Number(maxPets) || 1);
      await AvailabilityAPI.setMaxPets(v);
      setMaxPets(v);
      alert("Capacidad actualizada.");
    } catch (e: any) {
      alert(e?.message || "No se pudo actualizar la capacidad.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Calendario y disponibilidad</h1>
        <p className="text-sm text-slate-500">Haz clic en un día para bloquearlo/desbloquearlo. Configura también tu patrón semanal.</p>
      </div>

      {/* Layout: panel izquierdo (controles) + calendario */}
      <div className="grid md:grid-cols-[280px,1fr] gap-6">
        {/* Panel lateral */}
        <aside className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
          <div className="mb-4">
            <div className="text-sm text-slate-500 mb-1">Capacidad (nº de mascotas)</div>
            <div className="flex items-center gap-2">
              <input
                className="border rounded px-2 py-1 w-20"
                type="number" min={1}
                value={maxPets}
                onChange={(e) => setMaxPets(Number(e.target.value))}
              />
              <Button size="sm" onClick={saveMaxPets}>Guardar</Button>
            </div>
          </div>

          <div className="mt-6">
            <div className="font-medium mb-2">Disponibilidad semanal</div>
            <div className="space-y-2">
              {WEEK_LABELS.map((lbl, i) => (
                <label key={lbl} className="flex items-center justify-between gap-2">
                  <span>{lbl}</span>
                  <input
                    type="checkbox"
                    checked={weeklyOpen[KEY_FOR_DOW[i]] !== false}
                    onChange={(e) => changeWeekday(i, e.target.checked)}
                  />
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Calendario */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
          {/* Header mes */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-semibold">
              {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="soft" onClick={() => setCursor(new Date())}>Hoy</Button>
              <Button variant="outline" onClick={() => setCursor(addMonths(cursor, -1))}>◀</Button>
              <Button variant="outline" onClick={() => setCursor(addMonths(cursor, +1))}>▶</Button>
            </div>
          </div>

          {/* Cabecera semana */}
          <div className="grid grid-cols-7 text-xs text-slate-500 mb-1">
            {WEEK_LABELS.map((d) => (
              <div key={d} className="p-2">{d}</div>
            ))}
          </div>

          {/* Celdas */}
          {loading ? (
            <div className="p-6">Cargando calendario…</div>
          ) : (
            <div className="grid grid-cols-7 gap-[1px] bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden">
              {cells.map(({ date, inMonth, iso }) => {
                const blockedHere = isBlocked(date, iso);
                const isToday = sameDay(date, today);
                return (
                  <button
                    key={iso}
                    onClick={() => toggleDay(iso, date)}
                    className={[
                      "relative h-24 text-left p-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                      inMonth ? "" : "opacity-40",
                      blockedHere ? "bg-slate-100 dark:bg-slate-800 line-through" : "",
                    ].join(" ")}
                    title={iso}
                  >
                    <div className="text-xs font-medium flex items-center justify-between">
                      <span>{date.getDate()}</span>
                      {isToday && <span className="text-[10px] px-1 py-0.5 rounded bg-blue-100 text-blue-800">hoy</span>}
                    </div>

                    {/* Indicador bloqueado */}
                    {blockedHere && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 opacity-30 bg-slate-300 dark:bg-slate-700" />
                        <div className="absolute left-1 right-1 top-1 bottom-1 border-t border-b border-slate-400/60 rotate-45 origin-center" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="text-xs text-slate-500 mt-3">
            Consejo: si un día de la semana está desmarcado en el panel izquierdo, aparecerá tachado por defecto. 
            Puedes bloquear manualmente días concretos aunque ese día de la semana esté marcado como disponible.
          </div>
        </section>
      </div>
    </div>
  );
}
