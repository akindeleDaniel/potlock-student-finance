import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Wallet } from "lucide-react";
import { Pagelede, SectionTitle } from "../components/Bits";
import { PurseIcon } from "../components/PurseIcon";
import { Button } from "../components/ui/button";
import { Notice } from "../components/ui/notice";
import useKudi from "../lib/useKudi";
import {
  PURSES,
  PURSE_IDS,
  budgetTotal,
  checkBudget,
  emptyAmounts,
  money,
  round2,
  type Balances,
  type PurseId,
} from "../lib/money";

const PLACEHOLDER: Record<PurseId, string> = {
  feeding: "30000",
  transport: "15000",
  personal: "10000",
  academic: "5000",
  emergency: "10000",
  savings: "30000",
};

const SOURCES = ["Monthly allowance", "From home", "Scholarship", "Side hustle", "Gift", "Other"];

function toAmounts(values: Record<PurseId, string>): Balances {
  const out = emptyAmounts();
  for (const id of PURSE_IDS) out[id] = Math.max(0, Number(values[id]) || 0);
  return out;
}

export default function Setup() {
  const { state, createBudget } = useKudi();
  const navigate = useNavigate();

  const [income, setIncome] = useState(state.budget ? String(state.budget.income) : "");
  const [values, setValues] = useState<Record<PurseId, string>>(() => {
    const base = emptyAmounts() as unknown as Record<PurseId, string>;
    if (state.budget) for (const id of PURSE_IDS) base[id] = state.budget.amounts[id] ? String(state.budget.amounts[id]) : "";
    return { ...base };
  });
  const [source, setSource] = useState(SOURCES[0]);
  const [saved, setSaved] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    document.title = "Create my budget · Kudi";
  }, []);

  const amounts = useMemo(() => toAmounts(values), [values]);
  const incomeNum = Math.max(0, Number(income) || 0);
  const check = checkBudget(incomeNum, amounts);
  const existingTotal = budgetTotal(state.budget);

  function setField(id: PurseId, v: string) {
    setValues((prev) => ({ ...prev, [id]: v }));
    setSaved(null);
  }

  function useIncomeAsTotal() {
    setIncome(String(existingTotal || ""));
    setSaved(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setShowErrors(true);
    if (!check.valid) return;
    createBudget({ income: round2(incomeNum), amounts, source });
    setSaved("Budget created. " + money(check.total) + " is now sitting in your six purses.");
    setTimeout(() => navigate("/"), 900);
  }

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>Create my budget</SectionTitle>
        <Pagelede>
          You decide the figures. Enter the money you have available and how much of it you want in each purse, and Kudi moves exactly those amounts across. It never changes your numbers.
        </Pagelede>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <form onSubmit={submit} noValidate className="space-y-6 rounded-3xl border border-border bg-card p-5 sm:p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Wallet className="size-4 text-accent" aria-hidden="true" />
                Money available
              </h2>
              {existingTotal > 0 ? (
                <button
                  type="button"
                  onClick={useIncomeAsTotal}
                  className="rounded-md text-xs font-medium text-accent underline decoration-accent/40 underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  Match my current purse total
                </button>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="income" className="block text-sm font-medium">
                Total available income
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground" aria-hidden="true">
                  ₦
                </span>
                <input
                  id="income"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="100"
                  placeholder="100000"
                  value={income}
                  onChange={(e) => {
                    setIncome(e.target.value);
                    setSaved(null);
                  }}
                  className="h-12 w-full rounded-xl border border-border bg-background pl-9 pr-3 font-display text-2xl font-semibold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </div>
              <p className="text-xs text-muted-foreground">The money you have for this period, in naira.</p>
            </div>

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
          </div>

          <div className="space-y-4 border-t border-border pt-5">
            <div>
              <h2 className="font-display text-lg font-semibold">How much in each purse?</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Enter the exact amount you want in each purse. Leave a purse empty to keep ₦0 in it.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {PURSES.map((purse) => {
                const id = "budget-" + purse.id;
                return (
                  <div key={purse.id} className="space-y-1.5">
                    <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium">
                      <PurseIcon id={purse.id} className="size-7" />
                      <span>{purse.name === "Transportation" ? "Transportation" : purse.name}</span>
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
                        step="100"
                        placeholder={PLACEHOLDER[purse.id]}
                        value={values[purse.id]}
                        onChange={(e) => setField(purse.id, e.target.value)}
                        aria-describedby={id + "-rule"}
                        className="h-11 w-full rounded-xl border border-border bg-background pl-8 pr-3 text-base tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:text-sm"
                      />
                    </div>
                    <p id={id + "-rule"} className="text-[11px] text-muted-foreground">
                      {purse.rule}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {check.over ? (
            <Notice tone="danger" title="Your allocations are more than your income.">
              {check.error} Nothing is created until the amounts fit.
            </Notice>
          ) : null}
          {showErrors && !check.over && !check.valid ? <Notice tone="danger">{check.error}</Notice> : null}
          {saved ? (
            <Notice tone="success" title="Budget created.">
              {saved}
            </Notice>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button type="submit" size="lg" disabled={check.over} className="w-full sm:w-auto">
              <Sparkles className="size-4" />
              Create My Budget
            </Button>
            <p className="text-xs text-muted-foreground">Creating your budget replaces what is in the purses now.</p>
          </div>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="rounded-3xl bg-primary p-5 text-primary-foreground sm:p-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary-foreground/70">Live total</p>
            <p className="mt-2 font-display text-4xl font-semibold tabular-nums">{money(check.total)}</p>
            <p className="mt-1 text-sm text-primary-foreground/70">of {money(incomeNum)} available</p>

            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-primary-foreground/15">
              <div
                className={"h-full rounded-full transition-[width] " + (check.over ? "bg-danger" : "bg-primary-foreground/80")}
                style={{ width: Math.min(100, incomeNum > 0 ? Math.round((check.total / incomeNum) * 100) : 0) + "%" }}
              />
            </div>

            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3 border-b border-primary-foreground/15 pb-2">
                <dt className="text-primary-foreground/80">Total allocated</dt>
                <dd className="tabular-nums">{money(check.total)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-primary-foreground/15 pb-2">
                <dt className="text-primary-foreground/80">{check.over ? "Over your income by" : "Remaining unallocated"}</dt>
                <dd className={"font-medium tabular-nums " + (check.over ? "text-danger" : "")}>{money(Math.abs(check.left))}</dd>
              </div>
            </dl>

            <p className="mt-4 text-xs leading-relaxed text-primary-foreground/60">
              {check.over
                ? "Lower one or more amounts until the total is within your income."
                : check.left > 0 && check.total > 0
                  ? "That is fine. The money stays unallocated until you decide where it goes."
                  : "Every naira of your income is placed in a purse."}
            </p>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold">Your budget at a glance</h2>
            <ul className="mt-3 hidden text-xs uppercase tracking-wide text-muted-foreground sm:flex sm:items-center sm:justify-between">
              <li>Purse</li>
              <li>You entered</li>
            </ul>
            <ul className="mt-1 divide-y divide-border">
              {PURSES.map((purse) => (
                <li key={purse.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-muted-foreground">{purse.name}</span>
                  <span className={"font-medium tabular-nums " + (amounts[purse.id] > 0 ? "" : "text-muted-foreground")}>{money(amounts[purse.id])}</span>
                </li>
              ))}
            </ul>
          </section>

          <p className="px-1 text-xs leading-relaxed text-muted-foreground">
            Demo: this budget is stored on this device in naira only. No wallet is connected and no real money moves.
          </p>
        </aside>
      </div>
    </div>
  );
}
