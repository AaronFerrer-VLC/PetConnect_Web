// src/pages/Home.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ChipToggle from "../components/ChipToggle";
import Button from "../components/Button";

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

export default function Home({ user }: { user: any }) {
  const nav = useNavigate();
  const [type, setType] = useState("boarding");
  const [size, setSize] = useState("");
  const [city, setCity] = useState("Madrid");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const goSearch = () => {
    const qs = new URLSearchParams();
    if (type) qs.set("type", type);
    if (size) qs.set("size", size);
    if (city) qs.set("city", city);
    if (start) qs.set("start", start);
    if (end) qs.set("end", end);
    nav(`/search?${qs.toString()}`);
  };

  const isCaretaker = Boolean(user?.is_caretaker);
  const isLoggedIn = Boolean(user);

  return (
    <>
      {/* Hero + mini wizard */}
      <section
        className="relative overflow-hidden rounded-2xl"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1600&auto=format&fit=crop')",
          backgroundSize: "cover", backgroundPosition: "center", height: 420
        }}
      >
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white/90 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-4 md:p-6">
            <div className="text-sm mb-2">Estoy buscando un servicio para mi:</div>
            <ChipToggle value={type} onChange={setType} options={SERVICE_OPTS} />
            <div className="mt-4">
              <div className="text-sm mb-2">Tamaño del perro</div>
              <ChipToggle value={size} onChange={setSize} options={SIZE_OPTS} />
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr] gap-2">
              <input className="h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
                    placeholder="Ciudad (ej. Madrid)" value={city} onChange={(e) => setCity(e.target.value)} />
              <input type="date" className="h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
                    value={start} onChange={(e) => setStart(e.target.value)} />
              <input type="date" className="h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
                    value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div className="mt-4">
              <Button onClick={goSearch} className="w-full md:w-auto">Buscar</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Bloque de 3 pasos */}
      <section className="mt-10 grid sm:grid-cols-3 gap-4">
        {[
          { t: "1. Buscar", d: "Filtra por ciudad, servicio y fechas. Lee reseñas verificadas." },
          { t: "2. Reservar y pagar", d: "Reserva segura desde la web. Sin efectivo." },
          { t: "3. Relájate", d: "Recibe fotos y mensajes durante la estancia." },
        ].map((x) => (
          <div key={x.t} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="font-semibold">{x.t}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{x.d}</div>
          </div>
        ))}
      </section>

      {/* CTAs por rol */}
      <section className="mt-10 grid md:grid-cols-2 gap-4">
        {!isLoggedIn && (
          <>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="text-xl font-semibold mb-2">¿Eres cuidador/a?</div>
              <div className="text-slate-600 dark:text-slate-400">
                Crea tu perfil y activa el plan Pro (demo) para mejor visibilidad.
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => nav("/signup")}>Hazte cuidador</Button>
                <Button variant="outline" onClick={() => nav("/pricing")}>Ver planes</Button>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="text-xl font-semibold mb-2">¿Ya tienes cuenta?</div>
              <div className="text-slate-600 dark:text-slate-400">Entra para ver mascotas y reservas.</div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => nav("/login")}>Entrar</Button>
                <Button onClick={goSearch}>Buscar cuidadores</Button>
              </div>
            </div>
          </>
        )}

        {isLoggedIn && isCaretaker && (
          <>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="text-xl font-semibold mb-2">Configura tu disponibilidad</div>
              <div className="text-slate-600 dark:text-slate-400">Actualiza calendario y fechas bloqueadas.</div>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => nav("/availability")}>Calendario</Button>
                <Button variant="outline" onClick={() => nav("/bookings")}>Ver reservas</Button>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="text-xl font-semibold mb-2">Publica tus servicios</div>
              <div className="text-slate-600 dark:text-slate-400">Define precios y tipos de servicio.</div>
              <div className="mt-4"><Button onClick={() => nav("/services")}>Gestionar servicios</Button></div>
            </div>
          </>
        )}

        {isLoggedIn && !isCaretaker && (
          <>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="text-xl font-semibold mb-2">Gestiona tus mascotas</div>
              <div className="text-slate-600 dark:text-slate-400">Añade fichas y fotos de tus mascotas.</div>
              <div className="mt-4"><Button onClick={() => nav("/pets")}>Ir a Mascotas</Button></div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="text-xl font-semibold mb-2">Tus reservas</div>
              <div className="text-slate-600 dark:text-slate-400">Consulta el estado y deja reseñas.</div>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => nav("/bookings")}>Ver reservas</Button>
                <Button variant="outline" onClick={goSearch}>Buscar cuidadores</Button>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}

