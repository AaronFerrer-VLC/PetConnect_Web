// src/components/ReviewForm.tsx
import { useState } from "react";
import Button from "./Button";
import { ReviewsAPI } from "../lib/api";

export default function ReviewForm({
  bookingId,
  sitterId,
  onCreated,
}: {
  bookingId: string;
  sitterId: string;
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
      await ReviewsAPI.create({
        booking_id: bookingId,
        sitter_id: sitterId,
        rating,
        comment: comment.trim(),
      });
      setComment("");
      if (onCreated) onCreated();
    } catch (e: any) {
      setErr(e?.message || "No se pudo enviar la reseña");
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

