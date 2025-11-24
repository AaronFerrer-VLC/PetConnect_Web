// src/pages/SitterProfile.tsx
import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import StarRating from "../components/StarRating";
import BookingWidget from "../components/BookingWidget";
import ReviewForm from "../components/ReviewForm";
import Button from "../components/Button";
import { getSitter, getSitterReviews, getMe, BookingsAPI, ServicesAPI, MessagesAPI, ReviewsAPI } from "../lib/api";

export default function SitterProfile() {
  const { id } = useParams<{ id: string }>();
  const { search } = useLocation();
  const nav = useNavigate();

  const [data, setData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [ownerReviews, setOwnerReviews] = useState<any[]>([]);
  const [showAllSitterReviews, setShowAllSitterReviews] = useState(false);
  const [showAllOwnerReviews, setShowAllOwnerReviews] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [me, setMe] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  // Función para recargar reseñas
  const reloadReviews = async () => {
    if (!id) return;
    try {
      const [sitterData, ownerData] = await Promise.all([
        getSitterReviews(id).catch(() => []),
        ReviewsAPI.listByOwner(id).catch(() => []),
      ]);
      setReviews(sitterData);
      setOwnerReviews(ownerData);
    } catch (error) {
      console.error("Error reloading reviews:", error);
    }
  };

  // carga perfil + reseñas + servicios públicos
useEffect(() => {
  let alive = true;
  (async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Intentar cargar datos (algunos pueden fallar si no hay auth, pero getSitter y reviews son públicos)
      const [p, r, ownerR, s, user] = await Promise.allSettled([
        getSitter(id),
        getSitterReviews(id),
        ReviewsAPI.listByOwner(id).catch(() => []), // Reseñas como dueño
        ServicesAPI.bySitter(id).catch(() => []), // Si falla, devolver array vacío
        getMe().catch(() => null), // Si no hay auth, devolver null
      ]);
      
      const sitter = p.status === "fulfilled" ? p.value : null;
      const reviewsData = r.status === "fulfilled" ? r.value : [];
      const ownerReviewsData = ownerR.status === "fulfilled" ? ownerR.value : [];
      const servicesData = s.status === "fulfilled" ? s.value : [];
      const userData = user.status === "fulfilled" ? user.value : null;
      
      if (!alive) return;
      
      if (!sitter) {
        // Si no se pudo obtener el sitter, verificar el error
        if (p.status === "rejected") {
          const errorMsg = String(p.reason?.message || p.reason);
          if (errorMsg.includes("401") || errorMsg.includes("autenticación") || errorMsg.includes("Token")) {
            setNeedsAuth(true);
          }
          setError(errorMsg);
        }
        setData(null);
        setReviews([]);
        setServices([]);
        return;
      }
      
      setData(sitter);
      setReviews(reviewsData);
      setOwnerReviews(ownerReviewsData);
      setServices(servicesData.filter((x: any) => x.enabled !== false));
      setMe(userData);
    } catch (e: any) {
      if (alive) {
        const errorMsg = e?.message || String(e);
        setError(errorMsg);
        // Verificar si es error de autenticación
        if (errorMsg.includes("401") || errorMsg.includes("autenticación") || errorMsg.includes("Token")) {
          setNeedsAuth(true);
        }
        setData(null);
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
  
  if (!data) {
    // Si hay error de autenticación, mostrar mensaje amigable
    if (needsAuth || error?.includes("401") || error?.includes("autenticación")) {
      return (
        <div className="max-w-2xl mx-auto p-6 text-center">
          <h1 className="text-2xl font-semibold mb-4">Inicia sesión para ver este perfil</h1>
          <p className="text-slate-400 mb-6">
            Necesitas tener una cuenta para ver los perfiles de los cuidadores y hacer reservas.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="brand" onClick={() => nav(`/login?next=${encodeURIComponent(window.location.pathname)}`)}>
              Iniciar sesión
            </Button>
            <Button variant="outline" onClick={() => nav(`/signup?next=${encodeURIComponent(window.location.pathname)}`)}>
              Crear cuenta
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold mb-2">Cuidador no encontrado</h1>
        <p className="text-slate-400 mb-4">El perfil que buscas no existe o ha sido eliminado.</p>
        <Button variant="outline" onClick={() => nav("/search")}>
          Volver a búsqueda
        </Button>
      </div>
    );
  }

  const blocked = new Set<string>(data?.availability?.blocked_dates || []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        <img src={data.photo || (data.gallery && data.gallery[0]) || "/placeholder-avatar.png"} className="w-32 h-32 rounded-2xl object-cover" />
            <div className="flex-1">
              <h1 className="text-2xl font-semibold">{data.name}</h1>
              <div className="text-slate-500">{data.city}</div>
              {data.address && (
                <div className="text-sm text-slate-400 mt-1">📍 {data.address}</div>
              )}
              <StarRating value={data.rating_avg} count={data.rating_count} />
              <p className="mt-3 text-slate-300">{data.bio || data.profile?.bio || ""}</p>
              <div className="mt-3 text-sm text-slate-400">Acepta tamaños: {(data.accepts_sizes || []).join(", ") || "—"}</div>
              {data.phone && (
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="text-sm font-medium text-emerald-400">📞 Teléfono de emergencia</div>
                  <div className="text-lg font-semibold text-emerald-300 mt-1">{data.phone}</div>
                  <div className="text-xs text-slate-400 mt-1">Visible porque has pagado una reserva con este cuidador</div>
                </div>
              )}
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
            reviewType="sitter"
            onCreated={async () => {
              setReviewBookingId(null);
              // Recargar reseñas para que se vean inmediatamente
              await reloadReviews();
            }}
          />
        </div>
      )}

      {/* Reseñas como cuidador */}
      <h2 className="text-xl font-semibold mt-8 mb-3">Reseñas como cuidador</h2>
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="text-slate-400">Aún no hay reseñas como cuidador.</div>
        ) : (
          <>
            {(showAllSitterReviews ? reviews : reviews.slice(0, 3)).map((r: any) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{r.author}</div>
                  <StarRating value={r.rating} size="sm" />
                </div>
                <div className="text-sm text-slate-300 mt-2">{r.comment}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {new Date(r.created_at || "").toLocaleDateString()}
                </div>
              </div>
            ))}
            {reviews.length > 3 && (
              <Button
                variant="outline"
                onClick={() => setShowAllSitterReviews(!showAllSitterReviews)}
                className="w-full"
              >
                {showAllSitterReviews ? "Ver menos" : `Ver más reseñas (${reviews.length - 3} más)`}
              </Button>
            )}
          </>
        )}
      </div>

      {/* Reseñas como dueño */}
      {ownerReviews.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mt-8 mb-3">Reseñas como dueño</h2>
          <div className="text-sm text-slate-400 mb-3">
            Reseñas que otros cuidadores han dejado sobre {data.name} como dueño de mascota.
          </div>
          <div className="space-y-3">
            {(showAllOwnerReviews ? ownerReviews : ownerReviews.slice(0, 3)).map((r: any) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{r.author}</div>
                  <StarRating value={r.rating} size="sm" />
                </div>
                <div className="text-sm text-slate-300 mt-2">{r.comment}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {new Date(r.created_at || "").toLocaleDateString()}
                </div>
              </div>
            ))}
            {ownerReviews.length > 3 && (
              <Button
                variant="outline"
                onClick={() => setShowAllOwnerReviews(!showAllOwnerReviews)}
                className="w-full"
              >
                {showAllOwnerReviews ? "Ver menos" : `Ver más reseñas (${ownerReviews.length - 3} más)`}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
