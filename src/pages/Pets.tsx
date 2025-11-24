// src/pages/Pets.tsx
import { useEffect, useState } from "react";
import Button from "../components/Button";
import { PetsAPI, ReviewsAPI } from "../lib/api";
import type { Pet } from "../lib/types";
import StarRating from "../components/StarRating";

export default function Pets({ user }: { user: any }) {
  const [list, setList] = useState<Pet[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [petReviews, setPetReviews] = useState<Record<string, any[]>>({});
  const [expandedPetReviews, setExpandedPetReviews] = useState<Record<string, boolean>>({});

  const empty: Pet = {
    id: "" as any,
    name: "",
    breed: "",
    age_years: null,
    weight_kg: null,
    sex: "unknown",
    photos: [],
    care_instructions: "",
    personality: "",
    needs: "",
    notes: "",
  };
  const [form, setForm] = useState<Pet>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const pets = await PetsAPI.listMine(); // Usar listMine para obtener solo las mascotas del usuario actual
        setList(pets);
        
        // Cargar reseñas para cada mascota
        const reviewsMap: Record<string, any[]> = {};
        for (const pet of pets) {
          try {
            const reviews = await ReviewsAPI.listByPet(pet.id);
            reviewsMap[pet.id] = reviews;
          } catch (e) {
            console.error(`Error loading reviews for pet ${pet.id}:`, e);
            reviewsMap[pet.id] = [];
          }
        }
        setPetReviews(reviewsMap);
      } catch {
        setList([]);
      }
    })();
  }, []);

  const onFile = async (files?: FileList | null) => {
    if (!files || !files.length) return;
    const to64 = (f: File) =>
      new Promise<string>((ok, ko) => {
        const fr = new FileReader();
        fr.onload = () => ok(String(fr.result));
        fr.onerror = ko;
        fr.readAsDataURL(f);
      });
    const arr: string[] = [];
    for (const f of Array.from(files)) arr.push(await to64(f));
    setForm((p) => ({ ...p, photos: [...(p.photos || []), ...arr] }));
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await saveEdit(e);
      return;
    }
    setSaving(true);
    setErr("");
    try {
      const payload = { ...form };
      delete (payload as any).id;
      const pet = await PetsAPI.create(payload);
      setList((prev) => [pet, ...prev]);
      setForm(empty);
      setOpen(false);
    } catch (e: any) {
      setErr(e.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (pet: Pet) => {
    setForm(pet);
    setEditingId(pet.id);
    setOpen(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setErr("");
    try {
      const payload = { ...form };
      delete (payload as any).id;
      const updated = await PetsAPI.update(editingId, payload);
      setList((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
      setForm(empty);
      setEditingId(null);
      setOpen(false);
    } catch (e: any) {
      setErr(e.message || "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar mascota?")) return;
    await PetsAPI.remove(id);
    setList((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Mis mascotas</h1>
        <Button onClick={() => { setForm(empty); setOpen(true); }}>Añadir mascota</Button>
      </div>

      {list.length === 0 ? (
        <div className="text-slate-500">Aún no tienes mascotas.</div>
      ) : (
        <ul className="grid md:grid-cols-2 gap-3">
          {list.map((p) => (
            <li key={p.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <img
                  src={p.photos?.[0] || "/placeholder-avatar.png"}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-slate-500">{p.breed || "—"}</div>
                </div>
                <div className="flex gap-2">
                  <button className="text-blue-500 text-sm" onClick={() => startEdit(p)}>Editar</button>
                  <button className="text-red-500 text-sm" onClick={() => remove(p.id)}>Eliminar</button>
                </div>
              </div>
              {(p.personality || p.care_instructions || p.needs) && (
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {p.personality && <div><span className="font-medium">Cómo es:</span> {p.personality}</div>}
                  {p.care_instructions && <div><span className="font-medium">Cuidados:</span> {p.care_instructions}</div>}
                  {p.needs && <div><span className="font-medium">Necesidades:</span> {p.needs}</div>}
                </div>
              )}
              {petReviews[p.id] && petReviews[p.id].length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-sm font-medium mb-2">Reseñas del cuidador</div>
                  <div className="space-y-2">
                    {(expandedPetReviews[p.id] ? petReviews[p.id] : petReviews[p.id].slice(0, 3)).map((review: any) => (
                      <div key={review.id} className="text-sm">
                        <div className="flex items-center gap-2">
                          <StarRating value={review.rating} size="sm" />
                          <span className="text-xs text-slate-400">
                            {new Date(review.created_at || "").toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-slate-500 mt-1">{review.comment}</p>
                        )}
                      </div>
                    ))}
                    {petReviews[p.id].length > 3 && (
                      <button
                        onClick={() => setExpandedPetReviews(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                        className="text-xs text-blue-500 hover:underline mt-2"
                      >
                        {expandedPetReviews[p.id] ? "Ver menos" : `Ver más reseñas (${petReviews[p.id].length - 3} más)`}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Modal simple (sin librería) */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="max-w-2xl w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">{editingId ? "Editar mascota" : "Nueva mascota"}</div>
              <button onClick={() => { setOpen(false); setForm(empty); setEditingId(null); }} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <form onSubmit={create} className="grid md:grid-cols-2 gap-3">
              <input className="input" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input className="input" placeholder="Raza" value={form.breed || ""} onChange={(e) => setForm({ ...form, breed: e.target.value })} />

              <input className="input" type="number" min={0} step={0.5} placeholder="Edad (años)" value={form.age_years ?? ""} onChange={(e) => setForm({ ...form, age_years: e.target.value ? Number(e.target.value) : null })} />
              <input className="input" type="number" min={0} step={0.1} placeholder="Peso (kg)" value={form.weight_kg ?? ""} onChange={(e) => setForm({ ...form, weight_kg: e.target.value ? Number(e.target.value) : null })} />

              <select className="input" value={form.sex || "unknown"} onChange={(e) => setForm({ ...form, sex: e.target.value as any })}>
                <option value="unknown">Sexo</option>
                <option value="M">Macho</option>
                <option value="F">Hembra</option>
              </select>

              <div className="md:col-span-2">
                <label className="text-sm block mb-1">Fotos</label>
                <input className="input w-full" type="file" accept="image/*" multiple onChange={(e) => onFile(e.target.files)} />
                {form.photos?.length ? (
                  <div className="flex gap-2 mt-2 overflow-x-auto">
                    {form.photos.map((src, i) => (
                      <img key={i} src={src} className="w-16 h-16 rounded-lg object-cover" />
                    ))}
                  </div>
                ) : null}
              </div>

              <textarea className="input md:col-span-2" placeholder="Cómo es (personalidad)" value={form.personality || ""} onChange={(e) => setForm({ ...form, personality: e.target.value })} />
              <textarea className="input md:col-span-2" placeholder="Cuidados" value={form.care_instructions || ""} onChange={(e) => setForm({ ...form, care_instructions: e.target.value })} />
              <textarea className="input md:col-span-2" placeholder="Necesidades" value={form.needs || ""} onChange={(e) => setForm({ ...form, needs: e.target.value })} />
              <textarea className="input md:col-span-2" placeholder="Notas" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

              {err && <div className="text-red-500 text-sm md:col-span-2">{err}</div>}
              <div className="md:col-span-2 flex items-center justify-end gap-2">
                <button type="button" className="h-10 px-3 rounded-lg border" onClick={() => setOpen(false)}>Cancelar</button>
                <Button disabled={saving} type="submit">{saving ? "Guardando…" : "Guardar"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
