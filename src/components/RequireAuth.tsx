import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function RequireAuth({ children }: { children?: React.ReactNode }) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const loc = useLocation();
  if (!token) {
    const next = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return children ? <>{children}</> : <Outlet />;
}
