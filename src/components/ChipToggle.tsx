import Button from "./Button";

type Opt = { value: string; label: string };
export default function ChipToggle({
  value,
  onChange,
  options,
}: { value: string; onChange: (v: string) => void; options: Opt[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const isOn = value === o.value;
        return (
          <Button
            key={o.value}
            size="sm"
            variant={isOn ? "brand" : "outline"}
            active={isOn}                 // <- solo para estilos, ya no cae al DOM
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </Button>
        );
      })}
    </div>
  );
}

