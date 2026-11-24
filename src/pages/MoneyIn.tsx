import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { Notice } from "../components/ui/notice";
import { MoneyField, Pagelede, SectionTitle } from "../components/Bits";
import { PurseIcon } from "../components/PurseIcon";
import useKudi from "../lib/useKudi";
import { PURSES, budgetTotal, hasBudget, money, round2, splitByBudget, type Split } from "../lib/money";

const SOURCES = ["From home", "Monthly allowance", "Scholarship", "Side hustle", "Gift", "Other"];

export default function MoneyIn() {
  const { state, addIncome } = useKudi();
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState(SOURCES[0]);
  const [preview, setPreview] = useState<Split | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Money in · Kudi";
  }, []);

  const parsed = Number(amount);
  const budgeted = hasBudget(state.budget);
  const allocated = budgetTotal(state.budget);

  function buildPreview(): Split | null {
    if (amount.trim() === "") {
      setError("Enter an amount in naira first.");
      setPreview(null);
      return null;
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter a valid amount.");
      setPreview(null);
      return null;
    }
    setError(null);
    setDone(null);
    const result = splitByBudget(round2(parsed), state.budget);
    setPreview(result);
    return result;
  }

  function onAdd() {
    const result = preview ?? buildPreview();
    if (!result) return;
    addIncome({ amount: round2(parsed), source });
    setPreview(null);
    setAmount("");
    setDone(money(result.total) + " from " + source.toLowerCase() + " added to your purses.");
  }

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>Add money you received</SectionTitle>
        <Pagelede>Variable income is fine. Add whatever came in whenever it came, and it follows the amounts you set in your budget.</Pagelede>
      </div>

      {!budgeted ? (
        <Notice tone="info" title="Create your budget first so Kudi knows where this money should go.">
          <Link to="/setup" className="font-medium text-accent underline underline-offset-2">
            Create my budget
          </Link>
        </Notice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAdd();
          }}
          className="space-y-5 rounded-3xl border border-border bg-card p-5 sm:p-6"
        >
          <MoneyField
            id="amount"
            label="Amount received"
            value={amount}
            onChange={(v) => {
              setAmount(v);
              setPreview(null);
              setError(null);
            }}
            hint="In naira, whatever came in this time."
            step="0.01"
          />

          <div className="space-y-1.5">
            <label htmlFor="source" className="block text-sm font-medium">
              Where it came from
            </label>
            <select
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:text-sm"
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <p className="rounded-xl bg-muted/70 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            {budgeted
              ? "Each purse receives its share of the budget you set (" + money(allocated) + " across six purses). Anything above that budget goes to general savings."
              : "Without a budget, this amount would have nowhere to go. Create your budget first."}
          </p>

          {error ? <Notice tone="danger">{error}</Notice> : null}
          {done ? (
            <Notice tone="success" title="Money added.">
              {done} Every purse was topped up by its share.
            </Notice>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" size="lg" variant="outline" onClick={buildPreview} disabled={budgeted === false}>
              <Sparkles className="size-4" />
              Preview the split
            </Button>
            <Button type="submit" size="lg" disabled={!preview} className="w-full sm:w-auto">
              <Plus className="size-4" />
              Add to my purses
            </Button>
          </div>
        </form>

        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          {preview ? (
            <>
              <h2 className="font-display text-lg font-semibold">How {money(preview.total)} will be shared</h2>
              <ul className="mt-4 space-y-2">
                {preview.lines.map((line) => (
                  <li key={line.purse} className="flex items-center justify-between gap-3 border-b border-border pb-2 text-sm last:border-0">
                    <span className="flex items-center gap-2">
                      <PurseIcon id={line.purse} className="size-7" />
                      <span className="text-muted-foreground">To {line.label.toLowerCase()}</span>
                    </span>
                    <span className="font-medium tabular-nums">{money(line.amount)}</span>
                  </li>
                ))}
              </ul>
              {preview.hasExcess ? (
                <p className="mt-3 rounded-xl bg-success/10 px-3 py-2 text-xs leading-relaxed text-success">
                  This is more than your budget, so the extra went to general savings rather than a purse you did not choose.
                </p>
              ) : null}
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Nothing moves until you tap Add to my purses.
              </p>
            </>
          ) : (
            <div className="flex h-full min-h-48 flex-col items-start justify-center gap-2 text-sm text-muted-foreground">
              <span className="grid size-10 place-items-center rounded-xl bg-accent/10 text-accent" aria-hidden="true">
                <Sparkles className="size-5" />
              </span>
              <p className="font-display text-lg text-foreground">Your split appears here</p>
              <p className="max-w-xs">Enter an amount and Kudi shows the share for each purse before anything moves.</p>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-medium">Where your money sits now</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PURSES.map((purse) => (
            <li key={purse.id} className="flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm">
              <span className="text-muted-foreground">{purse.name}</span>
              <span className="font-medium tabular-nums">{money(state.balances[purse.id] ?? 0)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
