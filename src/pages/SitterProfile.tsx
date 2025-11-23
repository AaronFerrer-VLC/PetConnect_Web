// src/pages/SitterProfile.tsx
import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import StarRating from "../components/StarRating";
import BookingWidget from "../components/BookingWidget";
import ReviewForm from "../components/ReviewForm";
import Button from "../components/Button";
import { getSitter, getSitterReviews, getMe, BookingsAPI, ServicesAPI, MessagesAPI } from "../lib/api";

export default function SitterProfile() {
  const { id } = useParams<{ id: string }>();
  const { search } = useLocation();
  const nav = useNavigate();

  const [data, setData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [me, setMe] = useState<any>(null);

  // carga perfil + reseñas + servicios públicos
useEffect(() => {
  let alive = true;
  (async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [p, r, s, user] = await Promise.all([
        getSitter(id),
        getSitterReviews(id),
        ServicesAPI.bySitter(id),
        getMe(),
      ]);
      if (!alive) return;
      setData(p);
      setReviews(r);
      setServices(s.filter((x: any) => x.enabled !== false));
      setMe(user);
    } catch (e) {
      if (alive) {
        setData(null);         // mostrará "No encontrado"
        setReviews([]);
        setServices([]);
      }
      console.error(e);
    } finally {
      if (alive) setLoading(false);
    }
  })();
  return () => { alive = false; };
}, [id]);

  // validar ?booking=<id> para mostrar ReviewForm
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      const q = new URLSearchParams(search);
      const bid = q.get("booking");
      if (!bid) return;
      try {
        const [me, b] = await Promise.all([getMe(), BookingsAPI.get(bid)]);
        if (!me) return;
        if (b.owner_id !== me.id) return;
        if (b.status !== "completed") return;
        if (b.caretaker_id !== id) return;
        if (mounted) setReviewBookingId(bid);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [search, id]);

  if (loading) return <div className="p-6">Cargando…</div>;
  if (!data) return <div className="p-6">No encontrado</div>;

  const blocked = new Set<string>(data?.availability?.blocked_dates || []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        <img src={(data.photos && data.photos[0]) || "/placeholder-avatar.png"} className="w-32 h-32 rounded-2xl object-cover" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{data.name}</h1>
          <div className="text-slate-500">{data.city}</div>
          <StarRating value={data.rating_avg} count={data.rating_count} />
          <p className="mt-3 text-slate-300">{data.bio}</p>
          <div className="mt-3 text-sm text-slate-400">Acepta tamaños: {(data.accepts_sizes || []).join(", ") || "—"}</div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-3">Servicios</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {services.length === 0 ? (
          <div className="text-slate-400">Este cuidador aún no ha publicado servicios.</div>
        ) : (
          services.map((s: any) => (
            <div key={s.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="font-medium capitalize">{s.type}</div>
              <div className="text-sm text-slate-400">{s.description}</div>
              <div className="mt-2 font-semibold">{s.price} €</div>
            </div>
          ))
        )}
      </div>
      {Array.isArray(data.gallery) && data.gallery.length > 0 && (
  <>
    <h2 className="text-xl font-semibold mt-8 mb-3">Fotos</h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {data.gallery.map((src: string) => (
        <img key={src} src={src} className="w-full h-36 object-cover rounded-xl" />
      ))}
    </div>
  </>
)}

      <h2 className="text-xl font-semibold mt-8 mb-3">Calendario</h2>
      <div className="grid grid-cols-7 gap-1 max-w-md">
        {Array.from({ length: 31 })
          .map((_, i) => i + 1)
          .map((d) => {
            const today = new Date();
            const iso = new Date(today.getFullYear(), today.getMonth(), d);
            if (iso.getMonth() !== today.getMonth()) return null;
            const k = iso.toISOString().slice(0, 10);
            const isBlocked = blocked.has(k);
            return (
              <div
                key={k}
                className={`h-10 rounded-md text-sm grid place-items-center border ${
                  isBlocked ? "bg-slate-300 dark:bg-slate-700" : "bg-white dark:bg-slate-900"
                }`}
                title={k}
              >
                {d}
              </div>
            );
          })}
      </div>

      {me && me.id !== data.id && (
        <div className="mt-6 mb-4">
          <Button
            variant="brand"
            onClick={async () => {
              // Crear o encontrar thread_id
              const threadId = [me.id, data.id].sort().join("_");
              // Crear mensaje inicial o redirigir a mensajes
              try {
                // Verificar si ya existe conversación
                const threads = await MessagesAPI.listThreads();
                const existingThread = threads.find((t) => t.thread_id === threadId);
                if (existingThread) {
                  nav("/messages");
                } else {
                  // Crear mensaje inicial vacío para iniciar thread
                  await MessagesAPI.create({
                    thread_id: threadId,
                    sender_id: me.id,
                    receiver_id: data.id,
                    body: "Hola, me interesa tu servicio",
                  });
                  nav("/messages");
                }
              } catch (error) {
                console.error(error);
                nav("/messages");
              }
            }}
          >
            💬 Enviar mensaje
          </Button>
        </div>
      )}

      <h2 className="text-xl font-semibold mt-8 mb-3">Reservar</h2>
      <div className="max-w-md">
        <BookingWidget sitterId={data.id} services={services} availability={data.availability} sitterName={data.name} />
      </div>

      {reviewBookingId && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Valora a {data.name}</h3>
          <ReviewForm
            bookingId={reviewBookingId}
            sitterId={data.id}
            onCreated={() => {
              setReviewBookingId(null);
            }}
          />
        </div>
      )}

      <h2 className="text-xl font-semibold mt-8 mb-3">Reseñas</h2>
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="text-slate-400">Aún no hay reseñas.</div>
        ) : (
          reviews.map((r: any) => (
            <div key={r.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">{r.author}</div>
                <StarRating value={r.rating} size="sm" />
              </div>
              <div className="text-sm text-slate-300 mt-2">{r.comment}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
