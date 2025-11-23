// src/components/ReportForm.tsx
import { useState, useRef } from "react";
import Button from "./Button";
import { ReportsAPI, type Report } from "../lib/api";

interface Props {
  bookingId: string;
  onReportCreated: (report: Report) => void;
}

export default function ReportForm({ bookingId, onReportCreated }: Props) {
  const [type, setType] = useState<"photo" | "check_in" | "update" | "activity">("update");
  const [message, setMessage] = useState("");
  const [activityType, setActivityType] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && type !== "photo") return;
    if (type === "photo" && !photoFile) return;

    setSaving(true);
    try {
      let report: Report;

      if (type === "photo" && photoFile) {
        // Crear reporte primero
        report = await ReportsAPI.create({
          booking_id: bookingId,
          type: "photo",
          message: message || "Foto del servicio",
        });
        
        // Subir foto
        report = await ReportsAPI.uploadPhoto(report.id, photoFile);
      } else {
        report = await ReportsAPI.create({
          booking_id: bookingId,
          type,
          message: message.trim(),
          activity_type: type === "activity" ? activityType : undefined,
        });
      }

      // Reset form
      setMessage("");
      setActivityType("");
      setPhotoFile(null);
      setPhotoPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onReportCreated(report);
    } catch (error: any) {
      alert(error.message || "Error al crear el reporte");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Tipo de reporte</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "update", label: "📝 Actualización", icon: "📝" },
            { value: "check_in", label: "✅ Check-in", icon: "✅" },
            { value: "photo", label: "📷 Foto", icon: "📷" },
            { value: "activity", label: "🎾 Actividad", icon: "🎾" },
          ].map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value as any)}
              className={`p-3 rounded-lg border text-sm ${
                type === t.value
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {type === "photo" && (
        <div>
          <label className="block text-sm font-medium mb-2">Foto</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="input w-full"
          />
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Preview"
              className="mt-2 rounded-lg max-w-full h-48 object-cover"
            />
          )}
        </div>
      )}

      {type === "activity" && (
        <div>
          <label className="block text-sm font-medium mb-2">Tipo de actividad</label>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            className="input w-full"
          >
            <option value="">Selecciona...</option>
            <option value="walk">Paseo</option>
            <option value="play">Juego</option>
            <option value="feed">Comida</option>
            <option value="nap">Siesta</option>
            <option value="medication">Medicación</option>
            <option value="other">Otro</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">
          Mensaje {type === "photo" ? "(opcional)" : ""}
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            type === "check_in"
              ? "Todo va bien, la mascota está cómoda..."
              : type === "activity"
              ? "Describe la actividad..."
              : "Escribe una actualización..."
          }
          className="input w-full min-h-[100px]"
          required={type !== "photo"}
        />
      </div>

      <Button type="submit" variant="brand" disabled={saving} fullWidth>
        {saving ? "Enviando..." : "Enviar reporte"}
      </Button>
    </form>
  );
}

