import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBar() {
  const [city, setCity] = useState("");
  const [service, setService] = useState("boarding");
  const [size, setSize] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const nav = useNavigate();

  const go = () => {
    const params: Record<string, string> = {};
    if (city) params.city = city;
    if (service) params.service = service;
    if (size) params.size = size;
    if (priceMax) params.price_max = priceMax;
    if (start) params.start = new Date(start).toISOString();
    if (end) params.end = new Date(end).toISOString();
    const qs = new URLSearchParams(params).toString();
    nav(`/search?${qs}`);
  };

  return (
    <div className="grid md:grid-cols-6 gap-2 bg-slate-900/60 p-3 rounded-2xl">
      <input className="px-3 py-2 rounded-xl bg-slate-800 outline-none"
             placeholder="Ciudad (p.ej. Madrid)"
             value={city} onChange={e=>setCity(e.target.value)} />
      <select className="px-3 py-2 rounded-xl bg-slate-800" value={service} onChange={e=>setService(e.target.value)}>
        <option value="boarding">Alojamiento</option>
        <option value="daycare">Guardería</option>
        <option value="walking">Paseo</option>
        <option value="house_sitting">Cuidado en casa</option>
        <option value="drop_in">Visitas a domicilio</option>
      </select>
      <select className="px-3 py-2 rounded-xl bg-slate-800" value={size} onChange={e=>setSize(e.target.value)}>
        <option value="">Tamaño</option>
        <option value="small">Pequeño</option>
        <option value="medium">Mediano</option>
        <option value="large">Grande</option>
      </select>
      <input className="px-3 py-2 rounded-xl bg-slate-800" type="number" min="0" placeholder="€ precio máx"
             value={priceMax} onChange={e=>setPriceMax(e.target.value)} />
      <input className="px-3 py-2 rounded-xl bg-slate-800" type="date" value={start} onChange={e=>setStart(e.target.value)} />
      <input className="px-3 py-2 rounded-xl bg-slate-800" type="date" value={end} onChange={e=>setEnd(e.target.value)} />
      <div className="md:col-span-6 flex justify-end">
        <button onClick={go} className="mt-2 md:mt-0 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white">
          Buscar
        </button>
      </div>
    </div>
  );
}