// src/components/ReviewSection.tsx
import { useState, useEffect } from "react";
import Button from "./Button";
import { ReviewsAPI, type Review } from "../lib/api";
// import StarRating from "./StarRating"; // Si no existe, usar texto simple

interface Props {
  bookingId: string;
  reviewType: "sitter" | "owner" | "pet";
  currentUserId: string;
  onReviewChange?: () => void;
}

export default function ReviewSection({ bookingId, reviewType, currentUserId, onReviewChange }: Props) {
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    loadReview();
  }, [bookingId, reviewType]);

  const loadReview = async () => {
    try {
      const reviews = await ReviewsAPI.listByBooking(bookingId, reviewType);
      const review = reviews.find((r: any) => r.review_type === reviewType && r.author_id === currentUserId);
      if (review) {
        setExistingReview(review);
        setRating(review.rating);
        setComment(review.comment || "");
      }
    } catch (e) {
      console.error("Error loading review:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (existingReview && !editing) return; // No permitir crear si ya existe
    
    setErr("");
    setSaving(true);
    try {
      if (existingReview && editing) {
        // Actualizar reseña existente
        await ReviewsAPI.update(existingReview.id, {
          rating,
          comment: comment.trim(),
        });
        setEditing(false);
        await loadReview();
        if (onReviewChange) onReviewChange();
      } else {
        // Esto no debería pasar si ya existe una reseña
        setErr("Ya existe una reseña para esta reserva");
      }
    } catch (e: any) {
      const errorMsg = e?.message || e?.detail || "No se pudo guardar la reseña";
      setErr(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReview) return;
    if (!confirm("¿Eliminar esta reseña?")) return;
    
    try {
      await ReviewsAPI.delete(existingReview.id);
      setExistingReview(null);
      setRating(5);
      setComment("");
      if (onReviewChange) onReviewChange();
    } catch (e: any) {
      alert(e?.message || "No se pudo eliminar la reseña");
    }
  };

  if (loading) return <div className="text-sm text-slate-400">Cargando...</div>;

  if (existingReview && !editing) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{existingReview.rating} ⭐</span>
            <span className="text-sm text-slate-400">
              {new Date(existingReview.created_at || "").toLocaleDateString()}
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Editar
            </Button>
            <Button size="sm" variant="outline" onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        </div>
        <p className="text-sm text-slate-300">{existingReview.comment || "Sin comentario"}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      {editing && existingReview && (
        <div className="mb-2 text-sm text-slate-400">Editando reseña...</div>
      )}
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
      <div className="flex gap-2">
        {editing && (
          <Button type="button" variant="outline" onClick={() => { setEditing(false); loadReview(); }}>
            Cancelar
          </Button>
        )}
        <Button disabled={saving} type="submit" className="flex-1">
          {saving ? "Guardando…" : editing ? "Guardar cambios" : "Enviar reseña"}
        </Button>
      </div>
    </form>
  );
}

