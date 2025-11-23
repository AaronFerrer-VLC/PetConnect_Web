// src/components/BillingButtons.tsx
import Button from "./Button";
import { createCheckoutSession } from "../lib/api";

export default function BillingButtons() {
  const go = async (plan: "pro" | "free") => {
    try {
      const { url } = await createCheckoutSession(plan);
      window.location.href = url;
    } catch (e) {
      console.error(e);
      alert("No se pudo iniciar el proceso.");
    }
  };

  return (
    <div className="hidden sm:flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => go("pro")}>
        Mejorar a Pro (demo)
      </Button>
    </div>
  );
}
