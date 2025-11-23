// src/components/NavBar.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { PawPrint, LogOut } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import BrandSelector from "./BrandSelector";

export default function NavBar({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b bg-brand text-on-brand">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link className="font-semibold flex items-center gap-2" to="/">
          <PawPrint size={20} /> PetConnect
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-3 text-sm">
          <Link to="/search" className="hover:underline">Buscar cuidadores</Link>
          {user && <Link to="/bookings" className="hover:underline">Reservas</Link>}
          <Link to="/pets" className="hover:underline">Mascotas</Link>
          {user?.is_caretaker && <Link to="/availability" className="hover:underline">Calendario</Link>}
          <Link to="/pricing" className="hover:underline">Pricing</Link>

          <BrandSelector />   {/* ⬅️ vuelve a la barra, compacto */}
          <ThemeToggle />

          {user ? (
            <>
              <span className="opacity-90 hidden lg:inline">Hola, {user.name}</span>
              <button
                className="px-3 py-1 rounded bg-white/15 hover:bg-white/25 border border-white/20"
                onClick={onLogout}
              >
                <LogOut className="inline mr-1" size={16}/>Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:underline">Entrar</Link>
              <Link to="/signup" className="hover:underline">Registro</Link>
            </>
          )}
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center gap-2">
          {/* para ahorrar espacio en móvil, solo icono compact */}
          <BrandSelector compact />
          <ThemeToggle />
          <button
            aria-label="Abrir menú"
            className="h-9 w-9 rounded-md bg-white/15 border border-white/20"
            onClick={() => setOpen(true)}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Drawer móvil */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-72 bg-brand text-on-brand p-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold">Menú</span>
              <button onClick={() => setOpen(false)} aria-label="Cerrar">✕</button>
            </div>
            <div className="flex flex-col gap-3 text-sm">
              <Link to="/search" onClick={()=>setOpen(false)}>Buscar cuidadores</Link>
              {user && <Link to="/bookings" onClick={()=>setOpen(false)}>Reservas</Link>}
              <Link to="/pets" onClick={()=>setOpen(false)}>Mascotas</Link>
              {user?.is_caretaker && <Link to="/availability" onClick={()=>setOpen(false)}>Calendario</Link>}
              <Link to="/pricing" onClick={()=>setOpen(false)}>Pricing</Link>

              <div className="h-px bg-white/20 my-2" />
              {/* Opciones de apariencia también dentro del drawer */}
              <div className="flex items-center justify-between">
                <span className="text-sm">Color de marca</span>
                <BrandSelector compact />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tema</span>
                <ThemeToggle />
              </div>

              <div className="h-px bg-white/20 my-2" />
              {user ? (
                <button className="text-left" onClick={onLogout}>
                  <LogOut className="inline mr-1" size={16}/>Salir
                </button>
              ) : (
                <>
                  <Link to="/login" onClick={()=>setOpen(false)}>Entrar</Link>
                  <Link to="/signup" onClick={()=>setOpen(false)}>Registro</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
