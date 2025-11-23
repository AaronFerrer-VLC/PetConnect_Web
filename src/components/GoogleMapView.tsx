import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { useEffect, useMemo, useRef } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { SitterCard } from "../lib/api";

const containerStyle = { width: "100%", height: "520px" };

export default function GoogleMapView({
  sitters,
  highlightedId,
  onMarkerClick,
  centerFallback = { lat: 40.4168, lng: -3.7038 }, // Madrid
  userLocation,
  radiusKm,
}: {
  sitters: SitterCard[];
  highlightedId?: string | null;
  onMarkerClick?: (id: string) => void;
  centerFallback?: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number } | null;
  radiusKm?: number | null;
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: apiKey || "" });
  const mapRef = useRef<google.maps.Map | null>(null);
  const clusterRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());

  const points = useMemo(
    () => sitters.filter(s => typeof s.lat === "number" && typeof s.lng === "number"),
    [sitters]
  );

  const center = useMemo(() => {
    if (userLocation) return userLocation;
    if (!points.length) return centerFallback;
    const lat = points.reduce((a, b) => a + (b.lat as number), 0) / points.length;
    const lng = points.reduce((a, b) => a + (b.lng as number), 0) / points.length;
    return { lat, lng };
  }, [points, centerFallback, userLocation]);

  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    // limpia y recrea markers + cluster
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current.clear();
    clusterRef.current?.clearMarkers();
    circleRef.current?.setMap(null);

    // Crear círculo de radio si hay userLocation y radiusKm
    if (userLocation && radiusKm && mapRef.current) {
      circleRef.current = new google.maps.Circle({
        strokeColor: "#10b981",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#10b981",
        fillOpacity: 0.15,
        map: mapRef.current,
        center: userLocation,
        radius: radiusKm * 1000, // convertir km a metros
      });
    }

    const markers: google.maps.Marker[] = [];
    for (const s of points) {
      const m = new google.maps.Marker({
        position: { lat: s.lat as number, lng: s.lng as number },
        title: s.name,
      });
      m.addListener("click", () => onMarkerClick?.(s.id));
      markersRef.current.set(s.id, m);
      markers.push(m);
    }
    clusterRef.current = new MarkerClusterer({ markers, map: mapRef.current! });
  }, [points, onMarkerClick, userLocation, radiusKm]);

  // resaltar marker al pasar el ratón por la tarjeta
  useEffect(() => {
    markersRef.current.forEach((m, id) => {
      if (id === highlightedId) {
        m.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
        m.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => m.setAnimation(null), 600);
      } else {
        m.setZIndex(undefined);
      }
    });
  }, [highlightedId]);

  if (loadError) return <div className="p-3 text-red-400">No se pudo cargar Google Maps.</div>;
  if (!isLoaded) return <div className="p-3">Cargando mapa…</div>;
  if (!apiKey) return <div className="p-3 text-red-400">Falta VITE_GOOGLE_MAPS_API_KEY en tu .env</div>;

  return (
    <GoogleMap
      onLoad={(m) => { mapRef.current = m; }}
      mapContainerStyle={containerStyle}
      center={center}
      zoom={12}
    />
  );
}
