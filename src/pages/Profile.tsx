// src/pages/Profile.tsx
import { useEffect, useState } from "react";
import Button from "../components/Button";
import { AuthAPI, UsersAPI } from "../lib/api";

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
      setForm({ name: u.name, city: u.city || "", bio: u.bio || "", photo: u.photo || null });
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
    </div>
  );
}

