// src/pages/Dashboard.tsx
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { ServicesAPI, PetsAPI, BookingsAPI } from "../lib/api";

export default function Dashboard({ user }: { user?: any }) {
  const nav = useNavigate();
  const isCaretaker = !!user?.is_caretaker;

  const [counts, setCounts] = useState({ services: 0, pets: 0, bookings: 0, pending: 0 });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [svc, pets, bks] = await Promise.allSettled([
          ServicesAPI.list(),
          PetsAPI.list(),
          BookingsAPI.listMine(),
        ]);

        const services = svc.status === "fulfilled" ? svc.value.length : 0;
        const petsCount = pets.status === "fulfilled" ? pets.value.length : 0;
        const bookings = bks.status === "fulfilled" ? bks.value.length : 0;
        const pending =
          bks.status === "fulfilled" ? bks.value.filter((x: any) => x.status === "pending").length : 0;

        if (alive) setCounts({ services, pets: petsCount, bookings, pending });
      } catch {
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Cabecera */}
<header className="flex items-center gap-4 mb-6">
  <img
    src={user?.photo || user?.image || "/placeholder-avatar.png"} // compat: image -> photo
    className="w-14 h-14 rounded-xl object-cover bg-slate-200 dark:bg-slate-800"
  />
  <div className="flex-1">
    <h1 className="text-xl font-semibold">Hola{user?.name ? `, ${user.name}` : ""}</h1>
    <p className="text-sm text-slate-500">
      {isCaretaker ? "Panel del cuidador" : "Panel del dueño de mascota"}
    </p>
  </div>
  <div className="flex gap-2">
    <Button variant="outline" onClick={() => nav("/profile")}>Editar perfil</Button>
    <Button variant="outline" onClick={() => nav("/search")}>Buscar cuidadores</Button>
  </div>
</header>

      {/* Resumen */}
      <section className="grid sm:grid-cols-3 gap-4 mb-8">
        {isCaretaker ? (
          <>
            <Stat title="Servicios publicados" value={counts.services} />
            <Stat title="Reservas" value={counts.bookings} />
            <Stat title="Pendientes" value={counts.pending} />
          </>
        ) : (
          <>
            <Stat title="Tus mascotas" value={counts.pets} />
            <Stat title="Reservas" value={counts.bookings} />
            <Stat title="Pendientes" value={counts.pending} />
          </>
        )}
      </section>

      {/* Acciones por rol */}
      {isCaretaker ? (
        <section className="grid md:grid-cols-2 gap-4">
          <Card
            title="Calendario y disponibilidad"
            desc="Bloquea fechas, activa o desactiva servicios."
            actions={
              <>
                <Button onClick={() => nav("/availability")}>Abrir calendario</Button>
                <Button variant="outline" onClick={() => nav("/bookings")}>Ver reservas</Button>
              </>
            }
          />
          <Card
            title="Gestionar servicios"
            desc="Publica tus servicios y define precios."
            actions={<Button onClick={() => nav("/services")}>Gestionar servicios</Button>}
          />
        </section>
      ) : (
        <section className="grid md:grid-cols-2 gap-4">
          <Card
            title="Tus mascotas"
            desc="Añade fichas, fotos y cuidados."
            actions={<Button onClick={() => nav("/pets")}>Abrir mascotas</Button>}
          />
          <Card
            title="Tus reservas"
            desc="Crea y consulta tus reservas."
            actions={<Button onClick={() => nav("/bookings")}>Ver reservas</Button>}
          />
        </section>
      )}
    </div>
  );
}

/* ---------- auxiliares UI ---------- */

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{Number.isFinite(value) ? value : "—"}</div>
    </div>
  );
}

function Card({ title, desc, actions }: { title: string; desc: string; actions: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 flex flex-col gap-3">
      <div>
        <div className="text-lg font-semibold">{title}</div>
        <div className="text-sm text-slate-500">{desc}</div>
      </div>
      <div className="flex gap-2 mt-2">{actions}</div>
    </div>
  );
}
