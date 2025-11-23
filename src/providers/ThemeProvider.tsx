import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";
type Brand = "emerald" | "sky" | "violet" | "rose" | "amber";

const THEME_KEY = "pc_theme";
const BRAND_KEY = "pc_brand";

const BRAND_PRESETS: Record<Brand, { h: number; s: string; l: string }> = {
  emerald: { h: 160, s: "84%", l: "39%" },
  sky:     { h: 199, s: "95%", l: "48%" },
  violet:  { h: 262, s: "83%", l: "58%" },
  rose:    { h: 346, s: "77%", l: "57%" },
  amber:   { h:  38, s: "92%", l: "50%" },
};

function applyBrand(brand: Brand) {
  const { h, s, l } = BRAND_PRESETS[brand];
  const root = document.documentElement;
  root.style.setProperty("--brand-h", String(h));
  root.style.setProperty("--brand-s", s);
  root.style.setProperty("--brand-l", l);
  // on-brand siempre blanco (puedes ajustar por contraste si cambias la paleta)
  root.style.setProperty("--on-brand", "#ffffff");
}

type Ctx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
  brand: Brand;
  setBrand: (b: Brand) => void;
  brands: Brand[];
};

const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [brand, setBrandState] = useState<Brand>("emerald");

  // init
  useEffect(() => {
    const storedTheme = (localStorage.getItem(THEME_KEY) as Theme | null);
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const initialTheme: Theme = storedTheme ?? (prefersDark ? "dark" : "light");
    setThemeState(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");

    const storedBrand = (localStorage.getItem(BRAND_KEY) as Brand | null) ?? "emerald";
    setBrandState(storedBrand);
    applyBrand(storedBrand);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    document.documentElement.classList.toggle("dark", t === "dark");
  };
  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

  const setBrand = (b: Brand) => {
    setBrandState(b);
    localStorage.setItem(BRAND_KEY, b);
    applyBrand(b);
  };

  const value = useMemo<Ctx>(
    () => ({ theme, setTheme, toggle, brand, setBrand, brands: Object.keys(BRAND_PRESETS) as Brand[] }),
    [theme, brand]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

