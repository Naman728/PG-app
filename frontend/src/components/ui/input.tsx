import { forwardRef, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className = "", error, ...rest },
  ref,
) {
  return (
    <div className="w-full">
      <input
        ref={ref}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-2 ${
          error ? "border-red-300" : "border-slate-200"
        } ${className}`}
        {...rest}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
});
