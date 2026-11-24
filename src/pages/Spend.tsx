import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Receipt, ShieldAlert } from "lucide-react";
import { MoneyField, Pagelede, SectionTitle } from "../components/Bits";
import { PurseIcon } from "../components/PurseIcon";
import { Button } from "../components/ui/button";
import { Notice } from "../components/ui/notice";
import useKudi from "../lib/useKudi";
import { PURSES, dayLabel, money, purseName, type PurseId } from "../lib/money";

export default function Spend() {
  const { state, spend } = useKudi();
  const [purse, setPurse] = useState<PurseId>("feeding");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Spend · Kudi";
  }, []);

  const balance = state.balances[purse] ?? 0;
  const parsed = Number(amount);
  const tooMuch = parsed > balance && parsed > 0;
  const overHalf = parsed > 0 && parsed <= balance && parsed > balance / 2;
  const recent = state.entries.filter((e) => e.type === "spend").slice(0, 5);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDone(null);
    const result = spend({ purse, amount: parsed, note, confirmed: confirming });
    if ("error" in result) {
      setError(result.error);
      if (result.needsConfirm) setConfirming(true);
      return;
    }
    setError(null);
    setConfirming(false);
    setAmount("");
    setNote("");
    setDone("Spent " + money(parsed) + " from " + purseName(purse) + ". " + money(result.left) + " left in " + purseName(purse) + ".");
  }

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>Spend from a purse</SectionTitle>
        <Pagelede>Money leaves the purse you choose, and only that purse. The locked and emergency purses have their own route.</Pagelede>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-border bg-card p-5 sm:p-6">
          <fieldset>
            <legend className="text-sm font-medium">Which purse?</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PURSES.map((p) => {
                const active = purse === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setPurse(p.id);
                      setError(null);
                      setConfirming(false);
                      setDone(null);
                    }}
                    className={
                      "flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40 " +
                      (active ? "border-accent bg-accent text-accent-foreground" : "border-border bg-background hover:bg-muted")
                    }
                  >
                    <span className="text-sm font-medium leading-tight">{p.name}</span>
                    <span className={"text-xs tabular-nums " + (active ? "text-accent-foreground/80" : "text-muted-foreground")}>{money(state.balances[p.id] ?? 0)}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {purse === "emergency" ? (
            <Notice tone="info" title="Emergency money is released after a short video check.">
              <Link to="/emergency" className="font-medium text-accent underline underline-offset-2">
                Request an emergency release
              </Link>
            </Notice>
          ) : purse === "savings" ? (
            <Notice tone="warning" title="Savings stays locked until the end of the month.">
              You can still spend from feeding, transport, personal needs or academic.
            </Notice>
          ) : null}

          <MoneyField id="spend-amount" label="Amount" value={amount} onChange={(v) => { setAmount(v); setError(null); }} />

          <div className="space-y-1.5">
            <label htmlFor="spend-note" className="block text-sm font-medium">
              What was it for
            </label>
            <input
              id="spend-note"
              type="text"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setError(null);
              }}
              placeholder="Lunch, keke to campus, printing"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:text-sm"
            />
          </div>

          {tooMuch ? <Notice tone="danger">That is more than this purse holds.</Notice> : null}
          {overHalf && !tooMuch ? (
            <Notice tone="warning">That is more than half of this purse. Make sure it is really needed.</Notice>
          ) : null}
          {error ? <Notice tone="danger">{error}</Notice> : null}
          {done ? (
            <Notice tone="success" title="Spending recorded.">
              {done}
            </Notice>
          ) : null}

          <Button type="submit" size="lg" className="w-full sm:w-auto">
            <Receipt className="size-4" />
            {confirming && overHalf ? "Spend anyway" : "Spend"}
          </Button>
        </form>

        <div className="space-y-4">
          <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <ShieldAlert className="size-4 text-accent" aria-hidden="true" />
              Spending rules
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                You can only spend what is in a purse.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                Savings stays locked until the end of the month.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                The emergency purse needs a short video request.
              </li>
            </ul>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/70 px-3 py-2.5 text-sm">
              <span className="text-muted-foreground">{purseName(purse)} balance</span>
              <span className="font-medium tabular-nums">{money(balance)}</span>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold">Recent spending</h2>
            {recent.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Nothing spent yet this month.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {recent.map((entry) => (
                  <li key={entry.id} className="flex items-center gap-3 py-2.5">
                    {entry.type === "spend" ? <PurseIcon id={entry.purse} className="size-9" /> : null}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{entry.type === "spend" ? entry.note : ""}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.type === "spend" ? purseName(entry.purse) : ""} · {dayLabel(entry.at)}
                      </p>
                    </div>
                    <span className="text-sm font-medium tabular-nums text-danger">-{money(entry.type === "spend" ? entry.amount : 0)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
