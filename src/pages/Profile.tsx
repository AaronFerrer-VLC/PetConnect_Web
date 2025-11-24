// src/pages/Profile.tsx
import { useEffect, useState } from "react";
import Button from "../components/Button";
import { AuthAPI, UsersAPI, ReviewsAPI } from "../lib/api";
import StarRating from "../components/StarRating";

function toDataURL(file: File) {
  return new Promise<string>((ok, ko) => {
    const fr = new FileReader();
    fr.onload = () => ok(String(fr.result));
    fr.onerror = ko;
    fr.readAsDataURL(file);
  });
}

export default function Profile() {
  const [me, setMe] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [ownerReviews, setOwnerReviews] = useState<any[]>([]);
  const [sitterReviews, setSitterReviews] = useState<any[]>([]);
  const [showAllOwnerReviews, setShowAllOwnerReviews] = useState(false);
  const [showAllSitterReviews, setShowAllSitterReviews] = useState(false);
  const [form, setForm] = useState<{
    name?: string;
    city?: string;
    bio?: string;
    photo?: string | null;
  }>({ name: "", city: "", bio: "", photo: null });

  useEffect(() => {
    (async () => {
      const u = await AuthAPI.me();
      setMe(u);
      // La biografía puede estar en u.bio o en u.profile.bio
      const bio = u.bio || u.profile?.bio || "";
      setForm({ 
        name: u.name, 
        city: u.city || "", 
        bio, 
        photo: u.photo || null,
        address: u.address || "",
        phone: u.phone || "",
      });
      
      // Cargar reseñas: como dueño (owner) y como cuidador (sitter)
      try {
        const [ownerRev, sitterRev] = await Promise.all([
          ReviewsAPI.listByOwner(u.id).catch(() => []),
          ReviewsAPI.listBySitter(u.id).catch(() => []),
        ]);
        setOwnerReviews(ownerRev);
        setSitterReviews(sitterRev);
      } catch (e) {
        console.error("Error loading reviews:", e);
      }
    })();
  }, []);

  const onAvatar = async (files?: FileList | null) => {
    if (!files?.[0]) return;
    const photo = await toDataURL(files[0]);
    setForm((f) => ({ ...f, photo }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await UsersAPI.updateMe({
        name: form.name,
        city: form.city,
        bio: form.bio,
        photo: form.photo || undefined,
        address: form.address || undefined,
        phone: form.phone || undefined,
      });
      setMe(updated);
      alert("Perfil actualizado.");
    } catch (e: any) {
      alert(e?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const addGallery = async (files?: FileList | null) => {
    if (!files || !files.length) return;
    const arr: string[] = [];
    for (const f of Array.from(files)) arr.push(await toDataURL(f));
    const gallery = await UsersAPI.addToGallery(arr);
    setMe((u: any) => ({ ...u, gallery }));
  };

  const remove = async (url: string) => {
    const gallery = await UsersAPI.removeFromGallery(url);
    setMe((u: any) => ({ ...u, gallery }));
  };

  if (!me) return <div className="p-4 sm:p-6">Cargando…</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h1 className="text-lg sm:text-xl font-semibold mb-4">Tu perfil</h1>

      {/* Formulario */}
      <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-6">
        {/* Avatar + selector (se apila en móvil) */}
        <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <img
            src={form.photo || "/placeholder-avatar.png"}
            className="w-20 h-20 sm:w-16 sm:h-16 rounded-xl object-cover bg-slate-200 dark:bg-slate-800"
            alt="Avatar"
          />
          <label className="text-sm">
            <div className="mb-1 font-medium">Avatar</div>
            <input
              className="input w-full max-w-xs"
              type="file"
              accept="image/*"
              onChange={(e) => onAvatar(e.target.files)}
            />
            <div className="text-xs opacity-70 mt-1">Usa una imagen cuadrada para mejor ajuste.</div>
          </label>
        </div>

        <input
          className="input w-full"
          placeholder="Nombre"
          value={form.name || ""}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="input w-full"
          placeholder="Ciudad"
          value={form.city || ""}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        />

        <textarea
          className="input w-full md:col-span-2"
          placeholder="Biografía"
          value={form.bio || ""}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          rows={4}
        />

        {me?.is_caretaker && (
          <>
            <input
              className="input w-full md:col-span-2"
              placeholder="Dirección (calle, número, barrio)"
              value={form.address || ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <input
              className="input w-full md:col-span-2"
              type="tel"
              placeholder="Teléfono de contacto (para emergencias)"
              value={form.phone || ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <p className="text-xs text-slate-500 md:col-span-2">
              El teléfono solo será visible para dueños que hayan pagado una reserva contigo.
            </p>
          </>
        )}

        <div className="md:col-span-2 flex justify-end">
          <Button disabled={saving} type="submit">
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>

      {/* Galería */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="font-semibold">Galería</div>
            <div className="text-sm text-slate-500">
              Añade fotos contigo y tus mascotas (públicas).
            </div>
          </div>
          <input
            className="input w-full sm:w-auto"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => addGallery(e.target.files)}
          />
        </div>

        {me.gallery?.length ? (
          <div
            className="
              grid gap-2 mt-3
              grid-cols-2
              sm:grid-cols-3
              md:grid-cols-4
              lg:grid-cols-5
            "
          >
            {me.gallery.map((src: string) => (
              <div key={src} className="relative group overflow-hidden rounded-lg">
                <img
                  src={src}
                  className="w-full h-28 sm:h-32 md:h-36 object-cover block"
                  alt="Foto de la galería"
                />
                <button
                  type="button"
                  onClick={() => remove(src)}
                  className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500 mt-2">Aún no has subido fotos.</div>
        )}
      </div>

      {/* Reseñas como dueño */}
      {ownerReviews.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 mt-6">
          <div className="font-semibold mb-3">Reseñas como dueño</div>
          <div className="text-sm text-slate-500 mb-3">
            Reseñas que los cuidadores han dejado sobre ti como dueño de mascota.
          </div>
          <div className="space-y-3">
            {(showAllOwnerReviews ? ownerReviews : ownerReviews.slice(0, 3)).map((r: any) => (
              <div key={r.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{r.author}</div>
                  <StarRating value={r.rating} size="sm" />
                </div>
                {r.comment && (
                  <div className="text-sm text-slate-300 mt-2">{r.comment}</div>
                )}
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
        </div>
      )}

      {/* Reseñas como cuidador */}
      {sitterReviews.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 mt-6">
          <div className="font-semibold mb-3">Reseñas como cuidador</div>
          <div className="text-sm text-slate-500 mb-3">
            Reseñas que los dueños han dejado sobre ti como cuidador.
          </div>
          <div className="space-y-3">
            {(showAllSitterReviews ? sitterReviews : sitterReviews.slice(0, 3)).map((r: any) => (
              <div key={r.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{r.author}</div>
                  <StarRating value={r.rating} size="sm" />
                </div>
                {r.comment && (
                  <div className="text-sm text-slate-300 mt-2">{r.comment}</div>
                )}
                <div className="text-xs text-slate-400 mt-1">
                  {new Date(r.created_at || "").toLocaleDateString()}
                </div>
              </div>
            ))}
            {sitterReviews.length > 3 && (
              <Button
                variant="outline"
                onClick={() => setShowAllSitterReviews(!showAllSitterReviews)}
                className="w-full"
              >
                {showAllSitterReviews ? "Ver menos" : `Ver más reseñas (${sitterReviews.length - 3} más)`}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

