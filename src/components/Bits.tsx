import * as React from "react";
import { cn } from "../lib/utils";

export function SectionTitle({ as: Tag = "h1", className, ...props }: React.HTMLAttributes<HTMLHeadingElement> & { as?: "h1" | "h2" | "h3" }) {
  return (
    <Tag
      className={cn(
        "font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl",
        className,
      )}
      {...props}
    />
  );
}

export function Pagelede({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground", className)} {...props} />;
}

/** A labelled money field in naira, with the ₦ mark on the left. */
export function MoneyField({
  id,
  label,
  value,
  onChange,
  hint,
  step = "0.01",
  suffix,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: React.ReactNode;
  step?: string;
  suffix?: React.ReactNode;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground" aria-hidden="true">
          ₦
        </span>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min="0"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-base tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:text-sm"
        />
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {suffix}
    </div>
  );
}

/** A slim bar showing a share of something, 0 to 100. */
export function Bar({ pct, tone = "accent" }: { pct: number; tone?: "accent" | "primary" | "success" }) {
  const width = Math.max(0, Math.min(100, Math.round(pct)));
  const colour = tone === "primary" ? "bg-primary" : tone === "success" ? "bg-success" : "bg-accent";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-[width]", colour)} style={{ width: width + "%" }} />
    </div>
  );
}
