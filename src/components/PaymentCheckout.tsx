// src/components/PaymentCheckout.tsx
import { useState } from "react";
import Button from "./Button";
import { PaymentsAPI, type Payment } from "../lib/api";

interface Props {
  bookingId: string;
  amount: number;
  onSuccess: (payment: Payment) => void;
  onCancel: () => void;
}

export default function PaymentCheckout({ bookingId, amount, onSuccess, onCancel }: Props) {
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank_transfer">("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setStep("processing");

    try {
      // Crear pago
      const payment = await PaymentsAPI.create({
        booking_id: bookingId,
        amount,
        payment_method: paymentMethod,
      });

      // Simular procesamiento (2 segundos)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Procesar pago
      const processed = await PaymentsAPI.process(payment.id);
      setStep("success");
      
      setTimeout(() => {
        onSuccess(processed);
      }, 1500);
    } catch (error: any) {
      alert(error.message || "Error al procesar el pago");
      setProcessing(false);
      setStep("form");
    }
  };

  if (step === "processing") {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Procesando pago...</p>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2">¡Pago completado!</h3>
        <p className="text-slate-400">Tu reserva ha sido confirmada.</p>
      </div>
    );
  }

  const platformFee = Math.round(amount * 0.15 * 100) / 100;
  const total = amount;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-slate-800 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Subtotal</span>
          <span>€{amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Comisión de plataforma (15%)</span>
          <span>€{platformFee.toFixed(2)}</span>
        </div>
        <div className="border-t border-slate-700 pt-2 flex justify-between font-semibold">
          <span>Total</span>
          <span>€{total.toFixed(2)}</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Método de pago</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPaymentMethod("card")}
            className={`flex-1 p-3 rounded-lg border ${
              paymentMethod === "card"
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-slate-700"
            }`}
          >
            💳 Tarjeta
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("bank_transfer")}
            className={`flex-1 p-3 rounded-lg border ${
              paymentMethod === "bank_transfer"
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-slate-700"
            }`}
          >
            🏦 Transferencia
          </button>
        </div>
      </div>

      {paymentMethod === "card" && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Número de tarjeta</label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
              className="input w-full"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Vencimiento</label>
              <input
                type="text"
                placeholder="MM/AA"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CVC</label>
              <input
                type="text"
                placeholder="123"
                value={cardCVC}
                onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, "").slice(0, 3))}
                className="input w-full"
                required
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">💡 Demo: usa cualquier número (no se procesará realmente)</p>
        </div>
      )}

      {paymentMethod === "bank_transfer" && (
        <div className="bg-slate-800 rounded-lg p-4 text-sm text-slate-400">
          <p>En modo demo, la transferencia se procesa automáticamente.</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" variant="brand" disabled={processing} className="flex-1">
          {processing ? "Procesando..." : `Pagar €${total.toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
}

