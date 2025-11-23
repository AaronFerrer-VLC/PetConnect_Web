// src/pages/Payments.tsx
import { useEffect, useState } from "react";
import { PaymentsAPI, type Payment } from "../lib/api";
import Button from "../components/Button";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setPayments(await PaymentsAPI.listMine());
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

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">Historial de Pagos</h1>

      {payments.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p>No tienes pagos registrados.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="bg-slate-800 rounded-lg p-4 border border-slate-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
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
                  <p className="text-xl font-semibold">€{payment.amount.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">
                    Comisión: €{payment.platform_fee.toFixed(2)}
                  </p>
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
                  <p className="text-slate-400">Pago al cuidador</p>
                  <p className="font-medium">€{payment.caretaker_payout.toFixed(2)}</p>
                </div>
              </div>

              {payment.status === "completed" && (
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
          ))}
        </div>
      )}
    </div>
  );
}

