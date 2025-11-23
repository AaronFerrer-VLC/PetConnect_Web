// src/components/BrandSelector.tsx
import { useEffect, useMemo, useState } from "react";

type Preset = { name: string; h: number; s: number; l: number };

const PRESETS: Preset[] = [
  { name: "Emerald", h: 160, s: 84, l: 39 }, // por defecto
  { name: "Teal",    h: 173, s: 80, l: 40 },
  { name: "Blue",    h: 217, s: 91, l: 60 },
  { name: "Indigo",  h: 242, s: 75, l: 58 },
  { name: "Violet",  h: 271, s: 91, l: 65 },
  { name: "Rose",    h: 346, s: 77, l: 56 },
  { name: "Orange",  h: 24,  s: 95, l: 53 },
];

const LS_KEY = "brand_hsl"; // guardamos {h,s,l}

function applyBrand(h: number, s: number, l: number) {
  const root = document.documentElement;
  root.style.setProperty("--brand-h", String(h));
  root.style.setProperty("--brand-s", `${s}%`);
  root.style.setProperty("--brand-l", `${l}%`);

  // calcular on-brand por contraste (blanco o casi-negro)
  const { r, g, b } = hslToRgb(h, s / 100, l / 100);
  const luminance = 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
  root.style.setProperty("--on-brand", luminance < 0.6 ? "#ffffff" : "#0f172a");
}

function srgb(c: number) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function hslToRgb(h: number, s: number, l: number) {
  // h [0..360], s,l [0..1]
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let [r1, g1, b1] = [0, 0, 0];
  if (0 <= hp && hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (1 <= hp && hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (2 <= hp && hp < 3) [r1, g1, b1] = [0, c, x];
  else if (3 <= hp && hp < 4) [r1, g1, b1] = [0, x, c];
  else if (4 <= hp && hp < 5) [r1, g1, b1] = [x, 0, c];
  else if (5 <= hp && hp <= 6) [r1, g1, b1] = [c, 0, x];
  const m = l - c / 2;
  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);
  return { r, g, b };
}
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export default function BrandSelector({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [hsl, setHsl] = useState<{ h: number; s: number; l: number } | null>(null);

  useEffect(() => {
    // carga inicial
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      const obj = JSON.parse(saved) as { h: number; s: number; l: number };
      setHsl(obj);
      applyBrand(obj.h, obj.s, obj.l);
    } else {
      // usa los valores por defecto del CSS (emerald)
      setHsl({ h: 160, s: 84, l: 39 });
    }
  }, []);

  const dotStyle = useMemo(
    () => ({ backgroundColor: `hsl(${hsl?.h ?? 160} ${hsl?.s ?? 84}% ${hsl?.l ?? 39}%)` }),
    [hsl]
  );

  const setPreset = (p: Preset) => {
    setHsl({ h: p.h, s: p.s, l: p.l });
    applyBrand(p.h, p.s, p.l);
    localStorage.setItem(LS_KEY, JSON.stringify({ h: p.h, s: p.s, l: p.l }));
  };

  const onPickColor = (hex: string) => {
    const { h, s, l } = hexToHsl(hex);
    setHsl({ h, s, l });
    applyBrand(h, s, l);
    localStorage.setItem(LS_KEY, JSON.stringify({ h, s, l }));
  };

  const reset = () => setPreset(PRESETS[0]);

  // botón muy compacto
  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-2 h-9 rounded-md border border-white/20 bg-white/10 hover:bg-white/15"
        onClick={() => setOpen((v) => !v)}
        aria-label="Cambiar color de marca"
        title="Color de marca"
      >
        <span className="inline-block w-3.5 h-3.5 rounded-full border border-white/30" style={dotStyle} />
        {!compact && <span className="text-sm">Marca</span>}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 p-3 shadow-lg z-50"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="text-sm font-medium mb-2">Color de marca</div>
          <div className="grid grid-cols-7 gap-2 mb-3">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                className="h-7 rounded-full border border-slate-200 dark:border-slate-700"
                style={{ backgroundColor: `hsl(${p.h} ${p.s}% ${p.l}%)` }}
                title={p.name}
                onClick={() => setPreset(p)}
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-600 dark:text-slate-300">Personalizado</label>
            <input
              type="color"
              onChange={(e) => onPickColor(e.target.value)}
              className="w-8 h-8 p-0 rounded-md border border-slate-200 dark:border-slate-700"
              aria-label="Color personalizado"
            />
          </div>
          <div className="mt-3 text-right">
            <button onClick={reset} className="text-xs underline">Restablecer</button>
          </div>
        </div>
      )}
    </div>
  );
}
