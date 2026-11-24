import { Link, type LinkProps } from "react-router-dom";
import { cn } from "../lib/utils";

const variants = {
  default: "bg-primary text-primary-foreground hover:opacity-90",
  accent: "bg-accent text-accent-foreground hover:opacity-90",
  outline: "border border-border bg-background hover:bg-muted",
  ghost: "hover:bg-muted",
  onDark: "bg-background text-primary hover:bg-background/90",
} as const;

const sizes = {
  default: "h-9 px-4",
  sm: "h-8 px-3 text-xs",
  lg: "h-11 px-6",
} as const;

/** A react-router Link that looks exactly like a Button. */
export function ButtonLink({
  variant = "default",
  size = "default",
  className,
  ...props
}: LinkProps & { variant?: keyof typeof variants; size?: keyof typeof sizes }) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
