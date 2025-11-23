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

function AuthSignup() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", city: "", is_caretaker: false });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await AuthAPI.signup(form);
    nav("/login");
  };
  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Registro</h2>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input className="input" placeholder="nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" placeholder="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" placeholder="contraseña" type="password" value={form.password} maxLength={72} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <p className="text-xs text-slate-500">Mín. 6, máx. 72 caracteres (límite bcrypt)</p>
        <input className="input" placeholder="ciudad (opcional)" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_caretaker} onChange={(e) => setForm({ ...form, is_caretaker: e.target.checked })} />
          Soy cuidador/a
        </label>
        <Button type="submit">Crear cuenta</Button>
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
