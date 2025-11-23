// src/pages/Search.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { searchSitters, type SitterCard } from "../lib/api";
import SearchWizard from "../components/SearchWizard";
import SearchFilters from "../components/SearchFilters";
import GoogleMapView from "../components/GoogleMapView";
import ChipToggle from "../components/ChipToggle";
import Drawer from "../components/Drawer";
import Button from "../components/Button";
import SegmentedControl from "../components/SegmentedControl";
import Pagination from "../components/Pagination";
import DateRange from "../components/DateRange";

const TYPE_OPTS = [
  { value: "", label: "Todos" },
  { value: "boarding", label: "Alojamiento" },
  { value: "house_sitting", label: "Cuidado a domicilio" },
  { value: "drop_in", label: "Visitas a domicilio" },
  { value: "daycare", label: "Guardería de día" },
  { value: "walking", label: "Paseo de perros" },
];

const SIZE_OPTS = [
  { value: "", label: "Cualquiera" },
  { value: "small", label: "0–7 kg" },
  { value: "medium", label: "7–18 kg" },
  { value: "large", label: "18–45 kg" },
  { value: "giant", label: "45+ kg" },
];

const FLAG_KEYS = [
  "has_house","has_yard","no_dogs_at_home","no_cats_at_home","one_pet_only",
  "no_kids","puppy_care","cat_care","accepts_unspayed","accepts_unneutered",
] as const;

export default function Search() {
  const { search } = useLocation();
  const nav = useNavigate();

  const [items, setItems] = useState<SitterCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [openSort, setOpenSort] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);

  const params = useMemo(() => new URLSearchParams(search), [search]);
  const openWizard = params.get("wizard") === "1";

  // URL state
  const type = (params.get("type") || "").toLowerCase();
  const city = params.get("city") || "";
  const size = params.get("size") || "";
  const start = params.get("start") || "";
  const end = params.get("end") || "";
  const sort = params.get("sort") || "relevance";
  const view = params.get("view") || "list"; // list | map (sólo móvil)
  const page = Math.max(1, parseInt(params.get("page") || "1"));
  const pageSize = Math.max(6, parseInt(params.get("ps") || "10")); // opcional: ?ps=20
  const urlRadius = params.get("radius");
  const urlLat = params.get("lat");
  const urlLng = params.get("lng");

  const pillsCount = FLAG_KEYS.reduce((n, k) => n + (params.get(k) === "1" ? 1 : 0), 0);

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value); else p.delete(key);
    p.delete("page"); // reset page
    nav(`/search?${p.toString()}`);
  };
  const setParams = (entries: Record<string,string>) => {
    const p = new URLSearchParams(params);
    Object.entries(entries).forEach(([k,v]) => v ? p.set(k,v) : p.delete(k));
    p.delete("page");
    nav(`/search?${p.toString()}`);
  };
  const clearBasic = () => {
    const p = new URLSearchParams(params);
    ["type","size","city","start","end"].forEach(k => p.delete(k));
    p.delete("page");
    nav(`/search?${p.toString()}`);
  };

  // Obtener ubicación del usuario
  useEffect(() => {
    if (navigator.geolocation && !userLocation && !urlLat) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          // Actualizar en el backend si el usuario está logueado
          const token = localStorage.getItem("token");
          if (token) {
            import("../lib/api").then(({ GeolocationAPI }) => {
              GeolocationAPI.updateLocation(loc.lat, loc.lng).catch(() => {
                // Silenciar errores de actualización de ubicación
              });
            });
          }
        },
        (error) => {
          // Silenciar errores de geolocalización (es normal que el usuario deniegue el permiso)
          if (error.code !== 1) { // 1 = PERMISSION_DENIED
            console.log("Geolocalización no disponible");
          }
        },
        {
          timeout: 5000,
          enableHighAccuracy: false,
        }
      );
    } else if (urlLat && urlLng) {
      setUserLocation({ lat: parseFloat(urlLat), lng: parseFloat(urlLng) });
    }
  }, []);

  // fetch
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const qs: Record<string, string | number> = {};
        if (city) qs.city = city;
        if (type) qs.type = type;
        if (size) qs.size = size;
        if (start) qs.start = start;
        if (end) qs.end = end;
        FLAG_KEYS.forEach(k => { if (params.get(k) === "1") qs[k] = "1"; });
        
        // Parámetros geográficos (solo si hay ubicación)
        const searchLat = urlLat ? parseFloat(urlLat) : userLocation?.lat;
        const searchLng = urlLng ? parseFloat(urlLng) : userLocation?.lng;
        const searchRadius = urlRadius ? parseFloat(urlRadius) : radiusKm;
        
        // Solo enviar parámetros geográficos si realmente hay una ubicación
        // Esto evita filtrar por radio cuando no hay ubicación
        if (searchLat && searchLng) {
          qs.lat = searchLat;
          qs.lng = searchLng;
          if (searchRadius) {
            qs.radius_km = searchRadius;
          }
        }
        if (sort) {
          qs.sort_by = sort === "distance" ? "distance" : sort === "price" ? "price" : "relevance";
        }

        const res = await searchSitters(qs);
        if (!alive) return;

        // El backend ya filtra por tipo/precio, aquí solo filtramos flags y tamaño
        const filtered = res.filter(s => {
          // El tipo ya se filtra en el backend
          // if (type && !s.services?.includes(type)) return false;
          for (const k of FLAG_KEYS) {
            if (params.get(k) === "1" && (s as any)[k] === false) return false;
          }
          if (size) {
            const acc = (s as any).accepts_sizes as string[] | undefined;
            if (acc && !acc.includes(size)) return false;
          }
          return true;
        });

        // orden
        const sorted = [...filtered].sort((a, b) => {
          if (sort === "price") return (a.min_price ?? 9e9) - (b.min_price ?? 9e9);
          if (sort === "price_desc") return (b.min_price ?? -1) - (a.min_price ?? -1);
          if (sort === "rating") return (b.rating_avg ?? 0) - (a.rating_avg ?? 0);
          if (sort === "reviews") return (b.rating_count ?? 0) - (a.rating_count ?? 0);
          return 0;
        });

        setItems(sorted);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [type, city, size, start, end, sort, search, userLocation, radiusKm, urlLat, urlLng, urlRadius]);

  // paginación client-side
  const total = items.length;
  const startIdx = (page - 1) * pageSize;
  const pageItems = items.slice(startIdx, startIdx + pageSize);

  const applyWizard = (qs: URLSearchParams) => {
    nav(`/search?${qs.toString()}`, { replace: true });
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Wizard */}
      <SearchWizard
        open={openWizard}
        onClose={() => {
          const p = new URLSearchParams(params); p.delete("wizard");
          nav(`/search?${p.toString()}`, { replace: true });
        }}
        initialParams={params}
        onApply={applyWizard}
      />

      {/* Topbar móvil: filtros + ordenar + toggle Lista/Mapa */}
      <div className="md:hidden px-4 mb-3 flex items-center gap-2">
        <Button variant="outline" onClick={() => setOpenDrawer(true)}>
          Filtros {pillsCount ? `(${pillsCount})` : ""}
        </Button>
        <Button variant="outline" onClick={() => setOpenSort(true)}>Ordenar</Button>
        <div className="ml-auto">
          <SegmentedControl
            value={view}
            onChange={(v) => setParam("view", v)}
            options={[{value:"list",label:"Lista"},{value:"map",label:"Mapa"}]}
          />
        </div>
      </div>

      {/* Drawer móvil: Filtros */}
      <Drawer open={openDrawer} onClose={() => setOpenDrawer(false)} title="Filtros" side="left">
        <div className="mb-4">
          <div className="text-sm text-slate-500 mb-1">Tipo de servicio</div>
          <ChipToggle value={type} onChange={(v) => setParam("type", v)} options={TYPE_OPTS} />
        </div>
        <div className="mb-4">
          <div className="text-sm text-slate-500 mb-1">Tamaño del perro</div>
          <ChipToggle value={size} onChange={(v) => setParam("size", v)} options={SIZE_OPTS} />
        </div>
        <div className="mb-4">
          <div className="text-sm text-slate-500 mb-1">Ciudad + fechas</div>
          <input
            className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 mb-2"
            placeholder="Madrid…"
            defaultValue={city}
            onBlur={(e) => setParam("city", e.target.value)}
          />
          <DateRange
            start={start}
            end={end}
            onChange={(s, e) => setParams({ start: s, end: e })}
          />
        </div>
        <SearchFilters params={params} />
        <div className="mt-6 flex items-center justify-between">
          <button className="text-sm underline" onClick={clearBasic}>Restablecer básicos</button>
          <Button onClick={() => setOpenDrawer(false)}>Ver resultados</Button>
        </div>
      </Drawer>

      {/* Drawer móvil: Ordenar */}
      <Drawer open={openSort} onClose={() => setOpenSort(false)} title="Ordenar" side="right" width={300}>
        <div className="space-y-2">
          {[
            {v:"relevance", l:"Relevancia"},
            ...(userLocation || urlLat ? [{v:"distance", l:"Distancia (más cercano)"}] : []),
            {v:"price", l:"Precio (menor a mayor)"},
            {v:"price_desc", l:"Precio (mayor a menor)"},
            {v:"rating", l:"Valoración"},
            {v:"reviews", l:"Número de reseñas"},
          ].map(opt => (
            <label key={opt.v} className="flex items-center gap-2">
              <input type="radio" name="sort" checked={sort===opt.v} onChange={() => setParam("sort", opt.v)} />
              <span>{opt.l}</span>
            </label>
          ))}
        </div>
        <div className="mt-6 text-right">
          <Button onClick={() => setOpenSort(false)}>Aplicar</Button>
        </div>
      </Drawer>

      {/* Layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="p-4 border-r border-slate-200 dark:border-slate-800 hidden md:block">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Tipo de servicio</h2>
            <button
              onClick={() => {
                const p = new URLSearchParams(params); p.set("wizard","1");
                nav(`/search?${p.toString()}`);
              }}
              className="text-xs underline"
            >
              Abrir asistente
            </button>
          </div>

          <ChipToggle value={type} onChange={(v) => setParam("type", v)} options={TYPE_OPTS} />

          <div className="mt-4">
            <div className="text-sm text-slate-500 mb-1">Ciudad</div>
            <input
              className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
              placeholder="Madrid…"
              defaultValue={city}
              onBlur={(e) => setParam("city", e.target.value)}
            />
          </div>

          {/* Filtro de radio */}
          {(userLocation || urlLat) && (
            <div className="mt-4">
              <div className="text-sm text-slate-500 mb-1">Radio de búsqueda</div>
              <select
                className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
                value={urlRadius || radiusKm || ""}
                onChange={(e) => {
                  const val = e.target.value ? parseFloat(e.target.value) : null;
                  setRadiusKm(val);
                  if (val) {
                    setParam("radius", String(val));
                    if (userLocation) {
                      setParams({ lat: String(userLocation.lat), lng: String(userLocation.lng) });
                    }
                  } else {
                    const p = new URLSearchParams(params);
                    p.delete("radius");
                    nav(`/search?${p.toString()}`);
                  }
                }}
              >
                <option value="">Sin límite</option>
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="20">20 km</option>
                <option value="50">50 km</option>
                <option value="100">100 km</option>
              </select>
              {userLocation && (
                <p className="text-xs text-slate-400 mt-1">
                  📍 Usando tu ubicación
                </p>
              )}
            </div>
          )}

          <div className="mt-4">
            <div className="text-sm text-slate-500 mb-1">Fechas</div>
            <DateRange
              start={start}
              end={end}
              onChange={(s, e) => setParams({ start: s, end: e })}
            />
          </div>

          <div className="mt-4">
            <div className="text-sm text-slate-500 mb-1">Tamaño del perro</div>
            <ChipToggle value={size} onChange={(v) => setParam("size", v)} options={SIZE_OPTS} />
          </div>

          <SearchFilters params={params} />

          <div className="mt-2 text-right">
            <button className="text-xs underline" onClick={clearBasic}>Restablecer básicos</button>
          </div>
        </aside>

        {/* Main */}
        <main className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold">Encontrar a alguien</h1>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-slate-500">{total} cuidadores</span>
              <select
                className="h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2"
                value={sort}
                onChange={(e) => setParam("sort", e.target.value)}
              >
                <option value="relevance">Relevancia</option>
                {(userLocation || urlLat) && <option value="distance">Distancia</option>}
                <option value="price">Precio (⇡)</option>
                <option value="price_desc">Precio (⇣)</option>
                <option value="rating">Valoración</option>
                <option value="reviews">Reseñas</option>
              </select>
            </div>
          </div>

          {/* Desktop: lista + mapa lado a lado */}
          <div className="hidden lg:grid lg:grid-cols-[1fr_520px] gap-4">
            <div className="space-y-3">
              {loading ? (
                <div>Cargando…</div>
              ) : pageItems.length === 0 ? (
                <div className="text-slate-500">No se encontraron cuidadores con estos filtros.</div>
              ) : (
                <>
                  {pageItems.map((s, idx) => (
                    <Link
                      key={s.id}
                      to={`/sitters/${s.id}`}
                      className="block rounded-2xl border border-slate-200 dark:border-slate-800 p-3 hover:bg-white/50 dark:hover:bg-white/5"
                      onMouseEnter={() => setHighlight(s.id)}
                      onMouseLeave={() => setHighlight(null)}
                    >
                      <div className="flex gap-3">
                        <img
                          src={s.photo || "/placeholder-avatar.png"}
                          className="w-16 h-16 rounded-xl object-cover bg-slate-200 dark:bg-slate-800"
                          alt={s.name}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-lg font-semibold">{(startIdx+idx) + 1}. {s.name}</div>
                            {typeof s.min_price === "number" && (
                              <div className="ml-auto text-right">
                                <div className="text-emerald-500 font-semibold">€{s.min_price}</div>
                                <div className="text-[11px] text-slate-500">por noche</div>
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-slate-500">
                            {s.city || "—"}
                            {s.distance_km !== undefined && (
                              <span className="ml-2 text-emerald-500">📍 {s.distance_km.toFixed(1)} km</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">
                            {s.rating_avg ? `⭐ ${s.rating_avg.toFixed(1)} (${s.rating_count || 0})` : "Sin reseñas"}
                            {s.services?.length ? ` · ${s.services.slice(0,3).join(" · ")}` : ""}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <Pagination
                    page={page}
                    pageSize={pageSize}
                    total={total}
                    onChange={(p) => setParam("page", String(p))}
                  />
                </>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <GoogleMapView
                sitters={items}
                highlightedId={highlight}
                onMarkerClick={(id) => {
                  const el = document.querySelector(`a[href="/sitters/${id}"]`);
                  if (el) (el as HTMLAnchorElement).click();
                }}
                userLocation={userLocation || (urlLat && urlLng ? { lat: parseFloat(urlLat), lng: parseFloat(urlLng) } : null)}
                radiusKm={urlRadius ? parseFloat(urlRadius) : radiusKm}
              />
            </div>
          </div>

          {/* Móvil/Tablet: toggle Lista/Mapa */}
          <div className="lg:hidden">
            {view === "map" ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <GoogleMapView
                  sitters={items}
                  highlightedId={highlight}
                  userLocation={userLocation || (urlLat && urlLng ? { lat: parseFloat(urlLat), lng: parseFloat(urlLng) } : null)}
                  radiusKm={urlRadius ? parseFloat(urlRadius) : radiusKm}
                  onMarkerClick={(id) => {
                    const el = document.querySelector(`a[href="/sitters/${id}"]`);
                    if (el) (el as HTMLAnchorElement).click();
                  }}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {loading ? (
                  <div>Cargando…</div>
                ) : pageItems.length === 0 ? (
                  <div className="text-slate-500">No se encontraron cuidadores.</div>
                ) : (
                  <>
                    {pageItems.map((s, idx) => (
                      <Link
                        key={s.id}
                        to={`/sitters/${s.id}`}
                        className="block rounded-2xl border border-slate-200 dark:border-slate-800 p-3"
                      >
                        <div className="flex gap-3">
                          <img
                            src={s.photo || "/placeholder-avatar.png"}
                            className="w-16 h-16 rounded-xl object-cover bg-slate-200 dark:bg-slate-800"
                            alt={s.name}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold">{(startIdx+idx) + 1}. {s.name}</div>
                              {typeof s.min_price === "number" && (
                                <div className="ml-auto text-right">
                                  <div className="text-emerald-500 font-semibold">€{s.min_price}</div>
                                  <div className="text-[11px] text-slate-500">/noche</div>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">{s.city || "—"} · {s.services?.slice(0,2).join(" · ")}</div>
                            <div className="text-xs text-slate-500">
                              {s.rating_avg ? `⭐ ${s.rating_avg.toFixed(1)} (${s.rating_count || 0})` : "Sin reseñas"}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                    <Pagination
                      page={page}
                      pageSize={pageSize}
                      total={total}
                      onChange={(p) => setParam("page", String(p))}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

