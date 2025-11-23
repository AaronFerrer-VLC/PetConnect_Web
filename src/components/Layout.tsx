import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PawPrint, LogOut, ChevronDown, Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import BrandSelector from "./BrandSelector";

type LayoutProps = {
  user?: any;
  onLogout: () => void;
  children: React.ReactNode;
};

export default function Layout({ user, onLogout, children }: LayoutProps) {
  const [openMenu, setOpenMenu] = useState(false);      // dropdown usuario (desktop)
  const [mobileOpen, setMobileOpen] = useState(false);  // panel móvil
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar el dropdown al hacer click fuera
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Cerrar panel móvil al cambiar tamaño a >= md
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isCaretaker = !!user?.is_caretaker;

  const DesktopLinks = (
    <>
      <Link to="/search" className="hover:underline">Buscar cuidadores</Link>
      <Link to="/pricing" className="hover:underline">Pricing</Link>
      <BrandSelector />
      <ThemeToggle />
      {!user ? (
        <>
          <Link to="/login" className="hover:underline">Entrar</Link>
          <Link to="/signup" className="hover:underline">Registro</Link>
        </>
      ) : (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpenMenu(v => !v)}
            className="flex items-center gap-2 px-2 h-9 rounded bg-white/10 hover:bg-white/15 border border-white/20"
            title="Cuenta"
          >
            <img
              src={user.photo || "/placeholder-avatar.png"}
              alt="avatar"
              className="w-6 h-6 rounded object-cover bg-white/30"
            />
            <span className="hidden sm:block max-w-[140px] truncate">
              {user.name || "Tu cuenta"}
            </span>
            <ChevronDown size={16} />
          </button>

          {openMenu && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-xl shadow-lg border"
              style={{
                backgroundColor: "var(--bg)",
                color: "var(--fg)",
                borderColor: "rgba(255,255,255,.15)",
              }}
            >
              <MenuItem to="/dashboard" label="Dashboard" onClick={() => setOpenMenu(false)} />
              <MenuItem to="/profile" label="Tu perfil" onClick={() => setOpenMenu(false)} />
              <MenuItem to="/messages" label="Bandeja de entrada" onClick={() => setOpenMenu(false)} />
              <MenuItem to="/bookings" label="Reservas" onClick={() => setOpenMenu(false)} />
              {isCaretaker && (
                <>
                  <MenuItem to="/availability" label="Calendario" onClick={() => setOpenMenu(false)} />
                  <MenuItem to="/services" label="Servicios" onClick={() => setOpenMenu(false)} />
                </>
              )}
              <MenuItem to="/pets" label="Mis mascotas" onClick={() => setOpenMenu(false)} />
              <div className="my-1" style={{ borderTop: "1px solid rgba(255,255,255,.15)" }} />
              <button
                onClick={() => {
                  setOpenMenu(false);
                  onLogout();
                }}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 rounded-b-xl"
              >
                <LogOut size={16} /> Salir
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--fg)" }}
    >
      {/* NAVBAR */}
      <nav
        className="sticky top-0 z-40 border-b"
        style={{ backgroundColor: "var(--brand)", color: "var(--on-brand)" }}
      >
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link className="font-semibold flex items-center gap-2" to="/">
            <PawPrint size={20} /> PetConnect
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            {DesktopLinks}
          </div>

          {/* Botón hamburguesa (móvil) */}
          <button
            className="md:hidden p-2 rounded hover:bg-white/15"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Abrir menú"
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Panel móvil */}
        {mobileOpen && (
          <div className="md:hidden border-t" style={{ borderColor: "rgba(255,255,255,.2)" }}>
            <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2 text-sm">
              <Link to="/search" className="py-2 hover:underline" onClick={() => setMobileOpen(false)}>
                Buscar cuidadores
              </Link>
              <Link to="/pricing" className="py-2 hover:underline" onClick={() => setMobileOpen(false)}>
                Pricing
              </Link>

              {/* Zona de controles */}
              <div className="flex items-center gap-3 py-2">
                <BrandSelector />
                <ThemeToggle />
              </div>

              {!user ? (
                <div className="flex gap-4 py-1">
                  <Link to="/login" className="hover:underline" onClick={() => setMobileOpen(false)}>Entrar</Link>
                  <Link to="/signup" className="hover:underline" onClick={() => setMobileOpen(false)}>Registro</Link>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 py-2">
                    <img
                      src={user.photo || "/placeholder-avatar.png"}
                      alt="avatar"
                      className="w-7 h-7 rounded object-cover bg-white/30"
                    />
                    <div className="font-medium truncate">{user.name || "Tu cuenta"}</div>
                  </div>

                  <MobileItem to="/dashboard" label="Dashboard" onClick={() => setMobileOpen(false)} />
                  <MobileItem to="/profile" label="Tu perfil" onClick={() => setMobileOpen(false)} />
                  <MobileItem to="/messages" label="Bandeja de entrada" onClick={() => setMobileOpen(false)} />
                  <MobileItem to="/bookings" label="Reservas" onClick={() => setMobileOpen(false)} />
                  {isCaretaker && (
                    <>
                      <MobileItem to="/availability" label="Calendario" onClick={() => setMobileOpen(false)} />
                      <MobileItem to="/services" label="Servicios" onClick={() => setMobileOpen(false)} />
                    </>
                  )}
                  <MobileItem to="/pets" label="Mis mascotas" onClick={() => setMobileOpen(false)} />

                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      onLogout();
                    }}
                    className="mt-2 w-full text-left px-3 py-2 rounded bg-white/10 hover:bg_white/15"
                    style={{ backgroundColor: "rgba(255,255,255,.10)" }}
                  >
                    <span className="inline-flex items-center gap-2">
                      <LogOut size={16} /> Salir
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* CONTENIDO */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>
      </main>

      {/* FOOTER */}
      <footer
        className="mt-auto border-t"
        style={{ backgroundColor: "var(--brand)", color: "var(--on-brand)" }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 text-sm flex items-center justify-between">
          <div>© {new Date().getFullYear()} PetConnect</div>
          <div className="opacity-90">Hecho con ❤️ para tu proyecto</div>
        </div>
      </footer>
    </div>
  );
}

function MenuItem({
  to,
  label,
  onClick,
}: {
  to: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-3 py-2 text-sm hover:bg-white/5"
      style={{ borderRadius: 12 }}
    >
      {label}
    </Link>
  );
}

function MobileItem({
  to,
  label,
  onClick,
}: {
  to: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-3 py-2 rounded hover:bg-white/10"
      style={{ backgroundColor: "transparent" }}
    >
      {label}
    </Link>
  );
}
