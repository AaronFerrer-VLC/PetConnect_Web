// src/components/Footer.tsx
import BrandSelector from "./BrandSelector";

export default function Footer() {
  return (
    <footer className="mt-8 bg-brand text-on-brand">
      <div className="max-w-6xl mx-auto px-4 py-6 text-sm flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>© {new Date().getFullYear()} PetConnect</div>
        <div className="flex items-center gap-3">
          <span className="opacity-90 hidden sm:inline">Ajustar marca:</span>
          <BrandSelector compact />
        </div>
      </div>
    </footer>
  );
}
