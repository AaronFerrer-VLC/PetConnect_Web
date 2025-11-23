import clsx from "clsx";
import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "brand" | "outline" | "soft";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  active?: boolean; // SOLO para estilos; NO se pasa al DOM
};

export default function Button({
  variant = "brand",
  size = "md",
  fullWidth,
  active,
  className,
  ...rest // <- aquí ya NO va "active"
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    brand: "bg-brand text-on-brand hover:bg-brand-600 focus:ring-brand",
    outline:
      "border border-slate-300 dark:border-slate-700 bg-transparent hover:bg-white/10",
    soft: "bg-white/10 hover:bg-white/20",
  }[variant];

  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4",
    lg: "h-12 px-5 text-lg",
  }[size];

  return (
    <button
      {...rest}
      className={clsx(base, variants, sizes, { "w-full": fullWidth }, className, {
        "ring-2 ring-brand": active, // usa el flag para clases
      })}
      aria-pressed={active ?? undefined}
      data-active={active ? "" : undefined}
    />
  );
}

