import { BookOpen, Bus, PiggyBank, ShieldAlert, ShoppingBag, Utensils } from "lucide-react";
import type { PurseId } from "../lib/money";

const icons = {
  feeding: Utensils,
  transport: Bus,
  personal: ShoppingBag,
  academic: BookOpen,
  emergency: ShieldAlert,
  savings: PiggyBank,
} as const;

/** The icon tile for one purse, coloured with the app's accent. */
export function PurseIcon({ id, tone = "accent", className }: { id: PurseId; tone?: "accent" | "onDark"; className?: string }) {
  const Icon = icons[id];
  return (
    <span
      className={
        "grid size-10 shrink-0 place-items-center rounded-xl " +
        (tone === "onDark" ? "bg-primary-foreground/15 text-primary-foreground" : "bg-accent/10 text-accent") +
        (className ? " " + className : "")
      }
      aria-hidden="true"
    >
      <Icon className="size-5" />
    </span>
  );
}
