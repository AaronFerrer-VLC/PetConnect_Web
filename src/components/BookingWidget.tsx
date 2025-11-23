import { useEffect, useMemo, useState } from "react";
import { BookingsAPI, PetsAPI, getMe, type Service } from "../lib/api";
import { useNavigate } from "react-router-dom";
import Button from "./Button";

type Props = {
  sitterId: string;
  services: Service[];
  availability?: { max_pets: number; blocked_dates: string[] };
  sitterName?: string;
};

export default function BookingWidget({ sitterId, services, availability, sitterName }: Props) {
  const nav = useNavigate();
  const [me, setMe] = useState<any | null>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [serviceId, setServiceId] = useState<string>(services[0]?.id ?? "");
  const [petId, setPetId] = useState<string>("");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const blocked = useMemo(() => new Set(availability?.blocked_dates ?? []), [availability]);

  useEffect(() => {
    (async () => {
      const user = await getMe();
      setMe(user);
      if (user) {
        try {
          const myPets = await PetsAPI.list();
          setPets(myPets);
          if (myPets[0]?.id) setPetId(myPets[0].id);
        } catch {
          setPets([]);
        }
      }
    })();
  }, []);

  if (!services?.length) return null;

  // No logueado → CTA a login
  if (!me) {
    return (
      <div className="rounded-2xl border border-slate-800 p-4">
        <div className="font-semibold mb-1">Reserva con {sitterName ?? "el cuidador"}</div>
        <p className="text-sm text-slate-400 mb-3">Inicia sesión para reservar.</p>
        <Button to ="/login" variant="outline">Entrar</Button>
      </div>
    );
  }

  // Evita reservarte a ti mismo
  if (me.id === sitterId) {
    return (
      <div className="rounded-2xl border border-slate-800 p-4">
        <div className="font-semibold mb-1">No puedes reservar tus propios servicios.</div>
      </div>
    );
  }

  // Validación simple de fecha bloqueada
  const isDateBlocked = (d: string) => blocked.has(d);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId || !petId || !start || !end) {
      alert("Completa servicio, mascota, fecha de inicio y fin.");
      return;
    }
    const startISO = new Date(start).toISOString();
    const endISO = new Date(end).toISOString();
    if (new Date(endISO) <= new Date(startISO)) {
      alert("La fecha de fin debe ser posterior a la de inicio.");
      return;
    }
    // bloqueadas
    const days = eachDay(new Date(start), new Date(end));
    for (const d of days) {
      const ymd = d.toISOString().slice(0, 10);
      if (isDateBlocked(ymd)) {
        alert(`El cuidador no está disponible el ${ymd}`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await BookingsAPI.create({
        caretaker_id: sitterId,
        service_id: serviceId,
        pet_id: petId,
        start: startISO,
        end: endISO,
      });
      alert("Reserva creada. Pendiente de aceptación.");
      nav("/bookings");
    } catch (e: any) {
      alert(e?.message || "No se pudo crear la reserva.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-800 p-4 space-y-3">
      <div className="font-semibold">Reservar con {sitterName ?? "cuidador"}</div>

      <label className="text-sm block">
        <span className="block mb-1 text-slate-400">Servicio</span>
        <select className="w-full border border-slate-700 bg-slate-900 p-2 rounded-xl"
                value={serviceId} onChange={e => setServiceId(e.target.value)}>
          {services.map(s => (
            <option key={s.id} value={s.id}>
              {capitalize(s.type)} — {s.price} €
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm block">
        <span className="block mb-1 text-slate-400">Tu mascota</span>
        <select className="w-full border border-slate-700 bg-slate-900 p-2 rounded-xl"
                value={petId} onChange={e => setPetId(e.target.value)}>
          {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="text-sm block">
          <span className="block mb-1 text-slate-400">Inicio</span>
          <input type="date" className="w-full border border-slate-700 bg-slate-900 p-2 rounded-xl"
                value={start} onChange={e => setStart(e.target.value)} />
        </label>
        <label className="text-sm block">
          <span className="block mb-1 text-slate-400">Fin</span>
          <input type="date" className="w-full border border-slate-700 bg-slate-900 p-2 rounded-xl"
                value={end} onChange={e => setEnd(e.target.value)} />
        </label>
      </div>

      {!!availability?.blocked_dates?.length && (
        <p className="text-xs text-slate-500">
          Fechas bloqueadas: {availability.blocked_dates.join(", ")}
        </p>
      )}

      <Button disabled={loading} type="submit" variant="brand">{loading ? "Creando..." : "Solicitar reserva"}</Button>
    </form>
  );
}

// utilidades locales
function eachDay(start: Date, end: Date): Date[] {
  const out: Date[] = [];
  const s = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
  const e = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));
  let cur = s;
  while (cur <= e) {
    out.push(new Date(cur));
    cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
  }
  return out;
}
function capitalize(x: string) { return x.charAt(0).toUpperCase() + x.slice(1).replace("_"," "); }