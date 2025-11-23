// src/pages/Bookings.tsx
import { useEffect, useMemo, useState } from "react";
import {
  BookingsAPI,
  ServicesAPI,
  PetsAPI,
  searchSitters,
  getMe,
  PaymentsAPI,
  type Booking,
  type BookingStatus,
  type Service,
  type SitterCard,
} from "../lib/api";
import ReviewForm from "../components/ReviewForm";
import PaymentCheckout from "../components/PaymentCheckout";
import ReportForm from "../components/ReportForm";
import ReportsTimeline from "../components/ReportsTimeline";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";

export default function BookingsPage() {
  const [meId, setMeId] = useState<string | null>(null);
  const [mustLogin, setMustLogin] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [sitters, setSitters] = useState<SitterCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const [form, setForm] = useState({ caretaker_id: "", service_id: "", pet_id: "", start: "", end: "" });

  const toast = useToast();
  const nav = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const me = await getMe().catch(() => null);
        if (!me) {
          setMustLogin(true);
          return;
        }
        setMeId(me.id);

        const [mine, svc, myPets, sitterCards] = await Promise.all([
          BookingsAPI.listMine(), // requiere auth
          ServicesAPI.list(),
          PetsAPI.list(),         // normalmente requiere auth
          searchSitters({}),      // público
        ]);
        if (!alive) return;
        setBookings(mine);
        setServices(svc);
        setPets(myPets);
        setSitters(sitterCards);
      } catch (e: any) {
        if (String(e?.message || "").startsWith("401")) setMustLogin(true);
        else console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // ⛔️ guard de login SIEMPRE antes del return principal (no dentro de JSX)
  if (mustLogin) {
    return (
      <div className="max-w-xl mx-auto p-4">
        <h2 className="text-lg font-semibold mb-2">Reservas</h2>
        <p className="text-sm text-slate-300 mb-3">Necesitas iniciar sesión para ver y crear tus reservas.</p>
        <Link to="/login?next=/bookings" className="inline-block px-3 py-2 rounded bg-white text-black">
          Entrar
        </Link>
      </div>
    );
  }

  // opciones de cuidadores
  const sitterMap = useMemo(() => {
    const m = new Map<string, SitterCard>();
    sitters.forEach(s => m.set(s.id, s));
    return m;
  }, [sitters]);

  // servicios del cuidador seleccionado
  const servicesForCaretaker = useMemo(
    () => services.filter(s => !form.caretaker_id || s.caretaker_id === form.caretaker_id),
    [services, form.caretaker_id]
  );

  // helpers UI
  const labelOfService = (id: string) => {
    const s = services.find(x => x.id === id) as any;
    if (!s) return idShort(id);
    return `${capitalize(s.type)} · €${s.price}`;
  };
  const nameOfSitter = (id: string) => sitterMap.get(id)?.name ?? idShort(id);

  // Cambiar estado (solo cuidador) + toast “Valorar ahora”
  const updateStatus = async (id: string, status: BookingStatus) => {
    try {
      const updated = await BookingsAPI.updateStatus(id, status);
      setBookings(prev => prev.map(b => (b.id === id ? updated : b)));
      if (status === "completed") {
        toast({
          message: "Reserva completada ✔ ¿Quieres valorar al cuidador?",
          actionLabel: "Valorar ahora",
          onAction: () => nav(`/sitters/${updated.caretaker_id}?booking=${updated.id}`),
        });
      }
    } catch (e: any) {
      alert(e?.message || "No se pudo actualizar el estado");
    }
  };

  // Crear reserva
  const create = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!meId) {
    alert("Tu sesión aún no está lista. Vuelve a intentarlo en un instante.");
    return;
  }

  if (!form.caretaker_id || !form.service_id || !form.pet_id || !form.start || !form.end) {
    alert("Rellena cuidador, servicio, mascota y fechas.");
    return;
  }

  const startISO = new Date(form.start).toISOString();
  const endISO = new Date(form.end).toISOString();
  if (new Date(endISO) <= new Date(startISO)) {
    alert("La fecha fin debe ser posterior al inicio.");
    return;
  }

  try {
    const b = await BookingsAPI.create({
      // owner_id se toma del token en el backend, no se envía
      caretaker_id: form.caretaker_id,
      service_id: form.service_id,
      pet_id: form.pet_id,
      start: startISO,
      end: endISO,
    });
    setBookings(prev => [b, ...prev]);
    setForm({ caretaker_id: "", service_id: "", pet_id: "", start: "", end: "" });
    alert("Reserva creada. Pendiente de aceptación.");
  } catch (e: any) {
    alert(e?.message || "No se pudo crear la reserva");
  }
};

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-lg font-semibold mb-4">Reservas</h2>

      {/* Formulario de creación */}
      <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-6">
        <select className="border p-2 rounded col-span-2" value={form.caretaker_id}
                onChange={e => setForm({ ...form, caretaker_id: e.target.value, service_id: "" })}>
          <option value="">Selecciona cuidador/a</option>
          {sitters.map(c => (
            <option key={c.id} value={c.id}>{c.name}{c.city ? ` — ${c.city}` : ""}</option>
          ))}
        </select>

        <select className="border p-2 rounded col-span-2" value={form.service_id}
                onChange={e => setForm({ ...form, service_id: e.target.value })} disabled={!form.caretaker_id}>
          <option value="">{form.caretaker_id ? "Servicio" : "Elige cuidador"}</option>
          {servicesForCaretaker.map((s: any) => (
            <option key={s.id} value={s.id}>{capitalize(s.type)} · €{s.price}</option>
          ))}
        </select>

        <select className="border p-2 rounded col-span-2" value={form.pet_id}
                onChange={e => setForm({ ...form, pet_id: e.target.value })}>
          <option value="">Tu mascota</option>
          {pets.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <input className="border p-2 rounded col-span-3" type="datetime-local" value={form.start}
               onChange={e => setForm({ ...form, start: e.target.value })} />
        <input className="border p-2 rounded col-span-3" type="datetime-local" value={form.end}
               onChange={e => setForm({ ...form, end: e.target.value })} />
        <Button variant="brand" type="submit" fullWidth className="col-span-6">Crear reserva</Button>
      </form>

      {/* Listado */}
      {loading ? <div>Cargando…</div> : (
        <div className="space-y-2">
          {bookings.length === 0 ? (
            <div className="text-slate-400">No tienes reservas.</div>
          ) : (
            bookings.map(b => (
              <div key={b.id} className="border border-white/10 rounded p-3 bg-white/5">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {labelOfService(b.service_id)} • <StatusBadge status={b.status} />
                  </div>

                  {/* Acciones del cuidador */}
                  {meId && meId === b.caretaker_id && (
                    <div className="flex gap-2">
                      {b.status === "pending" && (
                        <>
                          <Button size="sm" variant="brand" onClick={() => updateStatus(b.id, "accepted")}>Aceptar</Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, "rejected")}>Rechazar</Button>
                        </>
                      )}
                      {b.status === "accepted" && (
                        <>
                          <Button size="sm" variant="brand" onClick={() => {
                            setSelectedBooking(b);
                            setShowReportModal(true);
                          }}>📷 Enviar reporte</Button>
                          <Button size="sm" variant="soft" onClick={() => updateStatus(b.id, "completed")}>Completar</Button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-sm">
                  Dueño: {b.owner_id === meId ? "Tú" : idShort(b.owner_id)} — Cuidador: {nameOfSitter(b.caretaker_id)}
                </div>
                <div className="text-xs text-gray-300">
                  {new Date(b.start).toLocaleString()} → {new Date(b.end).toLocaleString()}
                </div>
                {b.total_price && (
                  <div className="text-sm font-medium mt-1">
                    Precio total: €{b.total_price.toFixed(2)}
                  </div>
                )}

                {/* Reportes del servicio */}
                {(b.status === "accepted" || b.status === "completed") && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <h4 className="text-sm font-medium mb-2">Reportes del servicio</h4>
                    <ReportsTimeline
                      bookingId={b.id}
                      isCaretaker={meId === b.caretaker_id}
                    />
                  </div>
                )}

                {/* El dueño puede pagar cuando está aceptada */}
                {meId && meId === b.owner_id && b.status === "accepted" && (
                  <PaymentButton
                    booking={b}
                    onPay={() => {
                      setSelectedBooking(b);
                      setShowPaymentModal(true);
                    }}
                  />
                )}

                {/* El dueño puede reseñar cuando está completed */}
                {meId && meId === b.owner_id && b.status === "completed" && (
                  <div className="mt-3">
                    <ReviewForm bookingId={b.id} sitterId={b.caretaker_id}
                      onCreated={() => alert("¡Reseña enviada! Gracias por tu valoración.")} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de pago */}
      {showPaymentModal && selectedBooking && (
        <Modal
          title="Procesar Pago"
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedBooking(null);
          }}
        >
          <PaymentCheckout
            bookingId={selectedBooking.id}
            amount={selectedBooking.total_price || 0}
            onSuccess={(payment) => {
              setShowPaymentModal(false);
              setSelectedBooking(null);
              // Recargar reservas
              BookingsAPI.listMine().then(setBookings).catch(console.error);
              toast({ message: "¡Pago procesado exitosamente!" });
            }}
            onCancel={() => {
              setShowPaymentModal(false);
              setSelectedBooking(null);
            }}
          />
        </Modal>
      )}

      {/* Modal de reporte */}
      {showReportModal && selectedBooking && (
        <Modal
          title="Enviar Reporte"
          onClose={() => {
            setShowReportModal(false);
            setSelectedBooking(null);
          }}
        >
          <ReportForm
            bookingId={selectedBooking.id}
            onReportCreated={(report) => {
              setShowReportModal(false);
              setSelectedBooking(null);
              // Recargar reservas para actualizar reportes
              BookingsAPI.listMine().then(setBookings).catch(console.error);
              toast({ message: "¡Reporte enviado!" });
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const base = "inline-block px-2 py-0.5 rounded text-xs font-medium";
  const cls = {
    pending: "bg-yellow-200 text-yellow-900",
    accepted: "bg-blue-200 text-blue-900",
    rejected: "bg-red-200 text-red-900",
    completed: "bg-green-200 text-green-900",
  }[status];
  return <span className={`${base} ${cls}`}>{status}</span>;
}

function PaymentButton({ booking, onPay }: { booking: Booking; onPay: () => void }) {
  const [hasPayment, setHasPayment] = useState<boolean | null>(null);
  
  useEffect(() => {
    PaymentsAPI.getByBooking(booking.id)
      .then((p) => setHasPayment(!!p))
      .catch(() => setHasPayment(false));
  }, [booking.id]);

  if (hasPayment === null) {
    return <div className="mt-3 text-xs text-slate-400">Verificando pago...</div>;
  }
  
  if (hasPayment) {
    return <div className="mt-3 text-xs text-emerald-500">✓ Pago completado</div>;
  }

  return (
    <div className="mt-3">
      <Button size="sm" variant="brand" onClick={onPay}>
        Pagar ahora
      </Button>
    </div>
  );
}

// utils
function idShort(id: string) { return id?.slice(0, 6) || "—"; }
function capitalize(x: string) { return x.charAt(0).toUpperCase() + x.slice(1).replace("_", " "); }