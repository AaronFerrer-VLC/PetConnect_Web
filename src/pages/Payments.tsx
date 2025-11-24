// src/pages/Payments.tsx
import { useEffect, useState } from "react";
import { PaymentsAPI, type Payment, getMe } from "../lib/api";
import Button from "../components/Button";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<{
    total_earnings: number;
    total_payments: number;
    total_platform_fee: number;
    pending_earnings: number;
    pending_count: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [paymentsData, userData] = await Promise.all([
          PaymentsAPI.listMine(),
          getMe().catch(() => null),
        ]);
        setPayments(paymentsData);
        setUser(userData);
        
        // Si es cuidador, cargar estadísticas
        if (userData?.is_caretaker) {
          try {
            const statsData = await PaymentsAPI.getCaretakerStats();
            setStats(statsData);
          } catch (error) {
            console.error("Error loading caretaker stats:", error);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRefund = async (paymentId: string) => {
    if (!confirm("¿Estás seguro de que quieres solicitar un reembolso?")) return;
    try {
      const refunded = await PaymentsAPI.refund(paymentId);
      setPayments((prev) => prev.map((p) => (p.id === paymentId ? refunded : p)));
      alert("Reembolso procesado (demo)");
    } catch (error: any) {
      alert(error.message || "Error al procesar reembolso");
    }
  };

  const getStatusColor = (status: Payment["status"]) => {
    const colors = {
      pending: "bg-yellow-500/20 text-yellow-500",
      processing: "bg-blue-500/20 text-blue-500",
      completed: "bg-emerald-500/20 text-emerald-500",
      failed: "bg-red-500/20 text-red-500",
      refunded: "bg-slate-500/20 text-slate-400",
    };
    return colors[status] || colors.pending;
  };

  const getStatusLabel = (status: Payment["status"]) => {
    const labels = {
      pending: "Pendiente",
      processing: "Procesando",
      completed: "Completado",
      failed: "Fallido",
      refunded: "Reembolsado",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center py-8">Cargando...</div>
      </div>
    );
  }

  // Filtrar pagos: como dueño (pagos enviados) o como cuidador (pagos recibidos)
  const paymentsAsOwner = payments.filter(p => p.owner_id === user?.id);
  const paymentsAsCaretaker = payments.filter(p => p.caretaker_id === user?.id);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">Historial de Pagos</h1>

      {/* Estadísticas del cuidador */}
      {user?.is_caretaker && stats && (
        <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-lg p-6 mb-6 border border-emerald-500/30">
          <h2 className="text-lg font-semibold mb-4">💰 Tus Ingresos como Cuidador</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Ganado</p>
              <p className="text-2xl font-bold text-emerald-400">€{stats.total_earnings.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Pagos Completados</p>
              <p className="text-2xl font-bold">{stats.total_payments}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-400">€{stats.pending_earnings.toFixed(2)}</p>
              <p className="text-xs text-slate-500">({stats.pending_count} pagos)</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Comisión Plataforma</p>
              <p className="text-2xl font-bold text-slate-400">€{stats.total_platform_fee.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs para separar pagos enviados y recibidos */}
      {user && (
        <div className="mb-6 flex gap-2 border-b border-slate-700">
          <button
            className={`px-4 py-2 font-medium ${
              paymentsAsCaretaker.length > 0 && paymentsAsOwner.length > 0
                ? "border-b-2 border-emerald-500"
                : ""
            }`}
          >
            {user.is_caretaker ? "Pagos Recibidos" : "Todos los Pagos"}
          </button>
        </div>
      )}

      {payments.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p>No tienes pagos registrados.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => {
            const isReceived = payment.caretaker_id === user?.id;
            const isSent = payment.owner_id === user?.id;
            
            return (
            <div
              key={payment.id}
              className={`bg-slate-800 rounded-lg p-4 border ${
                isReceived ? "border-emerald-500/30" : "border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {isReceived && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400">
                        💰 Recibido
                      </span>
                    )}
                    {isSent && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                        💸 Enviado
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusLabel(payment.status)}
                    </span>
                    {payment.transaction_id && (
                      <span className="text-xs text-slate-500">#{payment.transaction_id.slice(-8)}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">
                    Reserva: {payment.booking_id.slice(0, 8)}...
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(payment.created_at).toLocaleString("es-ES")}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-semibold ${isReceived ? "text-emerald-400" : ""}`}>
                    {isReceived ? "+" : ""}€{isReceived ? payment.caretaker_payout.toFixed(2) : payment.amount.toFixed(2)}
                  </p>
                  {isReceived && (
                    <p className="text-xs text-slate-400">
                      Total: €{payment.amount.toFixed(2)}
                    </p>
                  )}
                  {isSent && (
                    <p className="text-xs text-slate-400">
                      Comisión: €{payment.platform_fee.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-700 text-sm">
                <div>
                  <p className="text-slate-400">Método</p>
                  <p className="font-medium">
                    {payment.payment_method === "card" ? "💳 Tarjeta" : "🏦 Transferencia"}
                  </p>
                </div>
                <div>
                  {isReceived ? (
                    <>
                      <p className="text-slate-400">Tu ganancia</p>
                      <p className="font-medium text-emerald-400">€{payment.caretaker_payout.toFixed(2)}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-slate-400">Pago al cuidador</p>
                      <p className="font-medium">€{payment.caretaker_payout.toFixed(2)}</p>
                    </>
                  )}
                </div>
              </div>

              {payment.status === "completed" && isSent && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRefund(payment.id)}
                  >
                    Solicitar reembolso (demo)
                  </Button>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

