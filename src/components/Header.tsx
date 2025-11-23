import { Link } from "react-router-dom";
import { PawPrint, Users, LogIn, LogOut } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import BrandSelector from "./BrandSelector";

export default function Header({ user, onLogout }: { user: any; onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-40 bg-brand text-on-brand shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link className="text-xl font-semibold flex items-center gap-2" to="/">
          <PawPrint size={20} /> PetConnect
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link to="/search" className="hover:underline">Buscar cuidadores</Link>
          <Link to="/services" className="hover:underline flex items-center gap-1"><Users size={16}/>Servicios</Link>
          {user && <Link to="/bookings" className="hover:underline">Reservas</Link>}
          <Link to="/pets" className="hover:underline">Mascotas</Link>
          {user?.is_caretaker && <Link to="/availability" className="hover:underline">Calendario</Link>}
          <Link to="/pricing" className="hover:underline">Pricing</Link>

          <div className="hidden sm:flex items-center gap-2">
            <BrandSelector compact />
            <ThemeToggle />
          </div>

          {user ? (
            <>
              <span className="opacity-90 hidden md:inline">Hola, {user.name}</span>
              <button
                className="px-3 py-1 rounded bg-white/15 hover:bg-white/25 border border-white/20"
                onClick={onLogout}
                title="Salir"
              >
                <LogOut className="inline mr-1" size={16}/>Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-1 rounded bg-white/15 hover:bg-white/25 border border-white/20 flex items-center gap-1" title="Entrar">
                <LogIn size={16}/> Entrar
              </Link>
              <Link to="/signup" className="hover:underline">Registro</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
