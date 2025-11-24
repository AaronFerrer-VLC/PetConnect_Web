import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthAPI } from "./lib/api";
import Layout from "./components/Layout";

import Home from "./pages/Home";
import Search from "./pages/Search";
import SitterProfile from "./pages/SitterProfile";
import Pricing from "./pages/Pricing";
import Bookings from "./pages/Bookings";
import Pets from "./pages/Pets";
import Availability from "./pages/Availability";
import RequireAuth from "./components/RequireAuth";
import ServicesManager from "./pages/ServicesManager";
import Dashboard from "./pages/Dashboard";
import Button from "./components/Button";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Payments from "./pages/Payments";


/* Hook auth */
function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("token");
    (async () => {
      if (token) {
        try {
          setUser(await AuthAPI.me());
        } catch {
          localStorage.removeItem("token");
        }
      }
      setReady(true);
    })();
  }, []);
  return { user, setUser, ready };
}

/* Vistas de login/signup compactas */
function AuthLogin({ setUser }: { setUser: (u: any) => void }) {
  const nav = useNavigate();
  const [email, setEmail] = useState("ana@test.com");
  const [password, setPassword] = useState("abc12345");
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const { access_token } = await AuthAPI.login({ email, password });
      localStorage.setItem("token", access_token);
      setUser(await AuthAPI.me());
      nav("/dashboard");
    } catch (err: any) {
      setError(err.message || "No se pudo iniciar sesión");
    }
  };
  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Entrar</h2>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input className="input" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" placeholder="contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit">Entrar</Button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>
    </div>
  );
}

function toDataURL(file: File): Promise<string> {
  return new Promise((ok, ko) => {
    const fr = new FileReader();
    fr.onload = () => ok(String(fr.result));
    fr.onerror = ko;
    fr.readAsDataURL(file);
  });
}

function AuthSignup() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    city: "",
    is_caretaker: false,
    bio: "",
    photo: null as string | null,
    gallery: [] as string[],
    max_pets: 2,
    accepts_sizes: [] as string[],
    address: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);

  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const dataUrl = await toDataURL(file);
      setForm({ ...form, photo: dataUrl });
    }
  };

  const onGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const dataUrls = await Promise.all(Array.from(files).map(toDataURL));
      setForm({ ...form, gallery: [...form.gallery, ...dataUrls] });
    }
  };

  const removeGalleryImage = (index: number) => {
    setForm({ ...form, gallery: form.gallery.filter((_, i) => i !== index) });
  };

  const toggleSize = (size: string) => {
    const sizes = form.accepts_sizes.includes(size)
      ? form.accepts_sizes.filter(s => s !== size)
      : [...form.accepts_sizes, size];
    setForm({ ...form, accepts_sizes: sizes });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        password: form.password,
        city: form.city || undefined,
        is_caretaker: form.is_caretaker,
        bio: form.bio || undefined,
        photo: form.photo || undefined,
        gallery: form.gallery.length > 0 ? form.gallery : undefined,
      };
      
      if (form.is_caretaker) {
        payload.max_pets = form.max_pets;
        payload.accepts_sizes = form.accepts_sizes.length > 0 ? form.accepts_sizes : undefined;
        payload.address = form.address || undefined;
        payload.phone = form.phone || undefined;
      }
      
      await AuthAPI.signup(payload);
      alert("Cuenta creada exitosamente. Inicia sesión para continuar.");
      nav("/login");
    } catch (err: any) {
      alert(err.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6">Crear cuenta</h2>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {/* Información básica */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-lg font-semibold mb-3">Información básica</h3>
          <div className="flex flex-col gap-3">
            <input
              className="input"
              placeholder="Nombre completo *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="input"
              type="email"
              placeholder="Email *"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="Contraseña *"
              type="password"
              value={form.password}
              maxLength={72}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <p className="text-xs text-slate-500">Mín. 6, máx. 72 caracteres</p>
            <input
              className="input"
              placeholder="Ciudad"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <textarea
              className="input min-h-[100px]"
              placeholder="Biografía (opcional)"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
        </div>

        {/* Foto de perfil */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-lg font-semibold mb-3">Foto de perfil</h3>
          <div className="flex items-center gap-4">
            {form.photo && (
              <img src={form.photo} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-slate-300 dark:border-slate-700" />
            )}
            <label className="cursor-pointer">
              <span className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                {form.photo ? "Cambiar foto" : "Subir foto"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={onPhotoChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Galería */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-lg font-semibold mb-3">Galería de fotos</h3>
          {form.gallery.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {form.gallery.map((img, idx) => (
                <div key={idx} className="relative">
                  <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="cursor-pointer text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            Añadir fotos
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onGalleryChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Tipo de usuario */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <label className="flex items-center gap-2 text-sm mb-4">
            <input
              type="checkbox"
              checked={form.is_caretaker}
              onChange={(e) => setForm({ ...form, is_caretaker: e.target.checked })}
            />
            <span className="font-semibold">Soy cuidador/a</span>
          </label>

          {/* Campos específicos para cuidadores */}
          {form.is_caretaker && (
            <div className="mt-4 space-y-4 pl-6 border-l-2 border-slate-300 dark:border-slate-700">
              <div>
                <label className="block text-sm mb-2">Máximo de mascotas</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="input w-32"
                  value={form.max_pets}
                  onChange={(e) => setForm({ ...form, max_pets: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Tamaños que acepto</label>
                <div className="flex flex-wrap gap-2">
                  {["small", "medium", "large"].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        form.accepts_sizes.includes(size)
                          ? "bg-blue-600 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {size === "small" ? "Pequeño" : size === "medium" ? "Mediano" : "Grande"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Dirección</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Calle, número, barrio"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
                <p className="text-xs text-slate-500 mt-1">Para que los dueños sepan en qué zona estás</p>
              </div>
              <div>
                <label className="block text-sm mb-2">Teléfono de contacto</label>
                <input
                  type="tel"
                  className="input w-full"
                  placeholder="+34 600 000 000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Solo será visible para dueños que hayan pagado una reserva contigo (para emergencias)
                </p>
              </div>
            </div>
          )}
        </div>

        <Button type="submit" disabled={loading} variant="brand">
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>
    </div>
  );
}

export default function App() {
  const { user, setUser, ready } = useAuth();
  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };
  if (!ready) return <div className="p-4">Cargando…</div>;

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout user={user} onLogout={logout}>
        <Routes>
          <Route path="/" element={<Home user={user} />} />

          {/* Área de usuario (dashboard simple; protégelo si lo usas) */}
          <Route path="/dashboard" element={<RequireAuth><Dashboard user={user} /></RequireAuth>} />

          {/* Público */}
          <Route path="/search" element={<Search />} />
          <Route path="/sitters/:id" element={<SitterProfile />} />
          <Route path="/pricing" element={<Pricing />} />

          {/* Rutas protegidas */}
          <Route path="/bookings" element={<RequireAuth><Bookings /></RequireAuth>} />
          <Route path="/pets" element={<RequireAuth><Pets user={user} /></RequireAuth>} />
          <Route path="/availability" element={<RequireAuth><Availability user={user} /></RequireAuth>} />
          <Route path="/services" element={<RequireAuth><ServicesManager /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
          <Route path="/payments" element={<RequireAuth><Payments /></RequireAuth>} />

          {/* Auth */}
          <Route path="/login" element={<AuthLogin setUser={setUser} />} />
          <Route path="/signup" element={<AuthSignup />} />

          <Route path="*" element={<div className="p-4">Página no encontrada</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
