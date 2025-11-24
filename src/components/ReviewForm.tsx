// src/components/ReviewForm.tsx
import { useState } from "react";
import Button from "./Button";
import { ReviewsAPI } from "../lib/api";

export default function ReviewForm({
  bookingId,
  sitterId,
  ownerId,
  petId,
  reviewType = "sitter",
  onCreated,
}: {
  bookingId: string;
  sitterId?: string;
  ownerId?: string;
  petId?: string;
  reviewType?: "sitter" | "owner" | "pet";
  onCreated?: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      const payload: any = {
        booking_id: bookingId,
        review_type: reviewType,
        rating,
        comment: comment.trim(),
      };
      
      if (reviewType === "sitter" && sitterId) {
        payload.sitter_id = sitterId;
      } else if (reviewType === "owner" && ownerId) {
        payload.owner_id = ownerId;
      } else if (reviewType === "pet" && petId) {
        payload.pet_id = petId;
      }
      
      await ReviewsAPI.create(payload);
      setComment("");
      setRating(5);
      // Llamar a onCreated inmediatamente después de crear exitosamente
      if (onCreated) {
        // Pequeño delay para asegurar que el servidor procesó la creación
        setTimeout(() => onCreated(), 100);
      }
    } catch (e: any) {
      const errorMsg = e?.message || e?.detail || String(e) || "No se pudo enviar la reseña";
      const errorStr = String(e);
      
      // Verificar si es un error 409 (conflicto - ya existe)
      if (errorStr.includes("409") || errorMsg.includes("409") || errorMsg.includes("Ya has enviado") || errorMsg.includes("ya existe") || errorMsg.includes("Conflict")) {
        setErr("Ya has enviado una reseña para esta reserva.");
        // Llamar a onCreated para que el componente padre pueda actualizar el estado y mostrar la reseña existente
        if (onCreated) {
          // Delay más largo para dar tiempo a que se actualice el estado
          setTimeout(() => onCreated(), 500);
        }
      } else if (errorStr.includes("CORS") || errorStr.includes("Failed to fetch") || errorStr.includes("network")) {
        // Error de red/CORS - puede que la reseña se haya creado pero no recibimos respuesta
        setErr("Error de conexión. Por favor, recarga la página para verificar si la reseña se envió correctamente.");
        // Intentar actualizar el estado por si acaso se creó
        if (onCreated) {
          setTimeout(() => onCreated(), 2000);
        }
      } else {
        setErr(errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm">Puntuación:</span>
        <select
          className="input h-9"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} ⭐
            </option>
          ))}
        </select>
      </div>
      <textarea
        className="input w-full mb-2"
        placeholder="Escribe un comentario (opcional)…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {err && <div className="text-red-500 text-sm mb-2">{err}</div>}
      <Button disabled={saving} type="submit">
        {saving ? "Enviando…" : "Enviar reseña"}
      </Button>
    </form>
  );
}

