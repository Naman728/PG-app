import { forwardRef, type ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className = "", variant = "primary", ...rest },
  ref,
) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
  const styles =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:opacity-95"
      : variant === "secondary"
        ? "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
        : "text-slate-700 hover:bg-slate-100";
  return <button ref={ref} className={`${base} ${styles} ${className}`} {...rest} />;
});
