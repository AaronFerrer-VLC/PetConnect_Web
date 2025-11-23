// src/components/ReportsTimeline.tsx
import { useEffect, useState } from "react";
import { ReportsAPI, type Report } from "../lib/api";
import { ChatWebSocket } from "../lib/websocket";

interface Props {
  bookingId: string;
  isCaretaker: boolean;
}

export default function ReportsTimeline({ bookingId, isCaretaker }: Props) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState<ChatWebSocket | null>(null);

  useEffect(() => {
    loadReports();

    // Conectar WebSocket para recibir reportes en tiempo real
    const token = localStorage.getItem("token");
    if (token && !isCaretaker) {
      // Solo los dueños necesitan recibir notificaciones
      const websocket = new ChatWebSocket(token);
      websocket.connect().then(() => {
        setWs(websocket);
        websocket.on("new_report", (data) => {
          if (data.booking_id === bookingId && data.report) {
            setReports((prev) => [...prev, data.report]);
          }
        });
      });
    }

    return () => {
      if (ws) {
        ws.disconnect();
      }
    };
  }, [bookingId]);

  const loadReports = async () => {
    try {
      const data = await ReportsAPI.getByBooking(bookingId);
      setReports(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getReportIcon = (type: Report["type"]) => {
    const icons = {
      photo: "📷",
      check_in: "✅",
      update: "📝",
      activity: "🎾",
    };
    return icons[type] || "📝";
  };

  const getReportLabel = (type: Report["type"]) => {
    const labels = {
      photo: "Foto",
      check_in: "Check-in",
      update: "Actualización",
      activity: "Actividad",
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="text-center py-4 text-slate-400">Cargando reportes...</div>;
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        {isCaretaker
          ? "Aún no has enviado reportes. ¡Comparte actualizaciones con el dueño!"
          : "Aún no hay reportes. El cuidador compartirá actualizaciones durante el servicio."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <div
          key={report.id}
          className="bg-slate-800 rounded-lg p-4 border border-slate-700"
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">{getReportIcon(report.type)}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{getReportLabel(report.type)}</span>
                <span className="text-xs text-slate-400">
                  {new Date(report.created_at).toLocaleString("es-ES")}
                </span>
              </div>

              {report.activity_type && (
                <div className="text-sm text-emerald-400 mb-2">
                  Actividad: {report.activity_type}
                </div>
              )}

              {report.message && (
                <p className="text-sm text-slate-300 mb-2">{report.message}</p>
              )}

              {report.photo_url && (
                <img
                  src={report.photo_url}
                  alt="Reporte"
                  className="rounded-lg max-w-full h-64 object-cover mt-2"
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

