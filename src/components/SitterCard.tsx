import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import type { SitterCard } from "../lib/api";

export default function SitterCard({ sitter }: { sitter: SitterCard }) {
  return (
    <Link to={`/sitters/${sitter.id}`} className="block rounded-2xl border border-slate-800 hover:border-slate-700">
      <div className="p-4 flex gap-4">
        <img src={sitter.photo || "/placeholder-avatar.png"} alt={sitter.name}
             className="w-20 h-20 rounded-xl object-cover bg-slate-800" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{sitter.name}</h3>
            {sitter.city ? <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800">{sitter.city}</span> : null}
            {sitter.distance_km !== undefined && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                📍 {sitter.distance_km.toFixed(1)} km
              </span>
            )}
          </div>
          <StarRating value={sitter.rating_avg} count={sitter.rating_count} />
          {sitter.address && (
            <div className="text-xs text-slate-500 mt-1">📍 {sitter.address}</div>
          )}
          <div className="text-sm text-slate-400 mt-1 line-clamp-2">{sitter.bio}</div>
          <div className="text-sm mt-2">
            {sitter.min_price != null ? <span className="font-medium">{sitter.min_price} €</span> : null}
            <span className="text-slate-400"> · {sitter.services.join(", ")}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}