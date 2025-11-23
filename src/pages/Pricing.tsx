import BillingButtons from "../components/BillingButtons";

export default function Pricing() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-8">Planes</h1>
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-700 p-6">
          <h2 className="text-xl font-semibold mb-2">Free</h2>
          <p className="text-sm text-slate-400 mb-4">Para dueños y cuidadores que empiezan.</p>
          <ul className="text-sm space-y-1 mb-6 list-disc pl-5">
            <li>Crear cuenta</li>
            <li>Gestionar mascotas y reservas</li>
            <li>Visibilidad básica</li>
          </ul>
          <div className="text-sm text-slate-400">Incluido por defecto</div>
        </div>

        <div className="rounded-2xl border border-emerald-600 p-6">
          <h2 className="text-xl font-semibold mb-2">Pro (Demo)</h2>
          <p className="text-sm text-slate-400 mb-4">Para cuidadores: calendario, disponibilidad y destacado.</p>
          <ul className="text-sm space-y-1 mb-6 list-disc pl-5">
            <li>Calendario y disponibilidad</li>
            <li>Prioridad en búsquedas</li>
            <li>Mejor conversión</li>
          </ul>
          <BillingButtons />
          <p className="text-xs text-slate-500 mt-3">Demo: activar/desactivar sin pago.</p>
        </div>
      </div>
    </div>
  );
}