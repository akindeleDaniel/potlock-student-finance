import { useEffect } from "react";
import { ArrowDownLeft, ArrowUpRight, Lock, Users } from "lucide-react";
import { Bar, Pagelede, SectionTitle } from "../components/Bits";
import { PurseIcon } from "../components/PurseIcon";
import { ResetDemo } from "../components/ResetDemo";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import useKudi from "../lib/useKudi";
import { PURSES, budgetTotal, dayLabel, hasBudget, inThisMonth, money, monthLabel, purseName, totalBalance, type PurseId } from "../lib/money";

export default function Report() {
  const { state } = useKudi();

  useEffect(() => {
    document.title = "Report · Kudi";
  }, []);

  const month = state.entries.find((e) => inThisMonth(e.at))?.at ?? Date.now();
  const entries = state.entries.filter((e) => inThisMonth(e.at));
  const income = entries.filter((e) => e.type === "income");
  const spends = entries.filter((e) => e.type === "spend");

  const totalIn = income.reduce((sum, e) => sum + (e.type === "income" ? e.amount : 0), 0);
  const totalSpent = spends.reduce((sum, e) => sum + (e.type === "spend" ? e.amount : 0), 0);
  const saved = income.reduce((sum, e) => sum + (e.type === "income" ? (e.splits.savings ?? 0) : 0), 0);
  const left = totalBalance(state.balances);
  const planned = budgetTotal(state.budget);
  const savingsTarget = Math.max(1, planned > 0 ? planned : 1);
  const savingsBalance = state.balances.savings ?? 0;
  const budgeted = hasBudget(state.budget);

  const perPurse = PURSES.map((p) => {
    const inPurse = income.reduce((sum, e) => sum + (e.type === "income" ? (e.splits[p.id] ?? 0) : 0), 0);
    const outPurse = spends.reduce((sum, e) => sum + (e.type === "spend" && e.purse === p.id ? e.amount : 0), 0);
    return { id: p.id as PurseId, name: p.name, inPurse, outPurse, balance: state.balances[p.id] ?? 0 };
  });

  const spendingByPurse = perPurse
    .filter((p) => p.outPurse > 0)
    .sort((a, b) => b.outPurse - a.outPurse);
  const activity = [...state.entries].sort((a, b) => b.at - a.at).slice(0, 12);

  const stats = [
    { label: "Total money in", value: money(totalIn), tone: "text-foreground" },
    { label: "Spent", value: money(totalSpent), tone: "text-foreground" },
    { label: "Saved", value: money(saved), tone: "text-success" },
    { label: "Left across purses", value: money(left), tone: "text-foreground" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">{monthLabel(month)}</p>
        <SectionTitle className="mt-1">Your report</SectionTitle>
        <Pagelede>All figures are demo figures for this device. They come from the money you added and spent here.</Pagelede>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={"mt-1.5 font-display text-xl font-semibold tabular-nums sm:text-2xl " + stat.tone}>{stat.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold">Where your money is</h2>
        <div className="mt-4 space-y-3">
          <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr] gap-3 border-b border-border pb-2 text-xs uppercase tracking-wider text-muted-foreground sm:grid">
            <span>Purse</span>
            <span className="text-right">Money in</span>
            <span className="text-right">Spent</span>
            <span className="text-right">Balance now</span>
          </div>
          {perPurse.map((row) => (
            <div key={row.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
              <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center gap-3 text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <PurseIcon id={row.id} className="hidden size-8 sm:grid" />
                  {row.name}
                </span>
                <span className="text-right tabular-nums text-muted-foreground">{money(row.inPurse)}</span>
                <span className="text-right tabular-nums text-muted-foreground">{money(row.outPurse)}</span>
                <span className="text-right font-medium tabular-nums">{money(row.balance)}</span>
              </div>
              <div className="mt-2">
                <Bar pct={left > 0 ? (row.balance / left) * 100 : 0} tone={row.id === "savings" ? "success" : "accent"} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">Spending by purse</h2>
          {spendingByPurse.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No spending to show yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {spendingByPurse.map((row) => (
                <li key={row.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{row.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {money(row.outPurse)} · {Math.round((row.outPurse / totalSpent) * 100)}%
                    </span>
                  </div>
                  <Bar pct={(row.outPurse / totalSpent) * 100} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <Lock className="size-4 text-accent" aria-hidden="true" />
            Savings
          </h2>
          <p className="mt-3 font-display text-3xl font-semibold tabular-nums">{money(savingsBalance)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {budgeted ? "Your budget puts " + money(state.budget.amounts.savings) + " in general savings, plus any income above your budget." : "Create a budget to set your general savings amount."}
          </p>
          <div className="mt-4 space-y-1.5">
            <Bar pct={(savingsBalance / savingsTarget) * 100} tone="success" />
            <p className="text-xs text-muted-foreground tabular-nums">
              {money(savingsBalance)} of a {money(savingsTarget)} target, your full budget.
            </p>
          </div>
          <p className="mt-4 rounded-xl bg-muted px-3 py-2.5 text-sm text-muted-foreground">Savings stays locked until the first of next month.</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {PURSES.map((purse) => (
              <Badge key={purse.id}>
                {purse.name} {money(budgeted ? state.budget.amounts[purse.id] : 0)}
              </Badge>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold">Recent activity</h2>
        {activity.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nothing yet. Add money you received to get started.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {activity.map((entry) => {
              const isIncome = entry.type === "income";
              return (
                <li key={entry.id} className="flex items-center gap-3 py-3">
                  <span
                    className={
                      "grid size-9 shrink-0 place-items-center rounded-xl " +
                      (isIncome ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")
                    }
                    aria-hidden="true"
                  >
                    {isIncome ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{isIncome ? entry.source : entry.note}</p>
                    <p className="text-xs text-muted-foreground">
                      {isIncome ? "Added to purses" : purseName(entry.purse)} · {dayLabel(entry.at)}
                    </p>
                  </div>
                  <span className={"text-sm font-medium tabular-nums " + (isIncome ? "text-success" : "text-foreground")}>
                    {isIncome ? "+" : "-"}
                    {money(entry.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent" aria-hidden="true">
            <Users className="size-5" />
          </span>
          <div>
            <h2 className="flex flex-wrap items-center gap-2 font-display text-lg font-semibold">
              Share with a helper
              <Badge tone="warning">Coming later</Badge>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">A helper you trust can see your purses and progress.</p>
          </div>
        </div>
        <Button variant="outline" disabled className="sm:shrink-0">
          Invite a helper
        </Button>
      </section>

      <ResetDemo />
    </div>
  );
}
