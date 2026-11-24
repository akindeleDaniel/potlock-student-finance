import { useEffect } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { ButtonLink } from "../components/ButtonLink";
import { PurseIcon } from "../components/PurseIcon";
import { ResetDemo } from "../components/ResetDemo";
import { Badge } from "../components/ui/badge";
import { Notice } from "../components/ui/notice";
import { Pagelede, SectionTitle } from "../components/Bits";
import useKudi from "../lib/useKudi";
import { PURSES, budgetTotal, hasBudget, inThisMonth, money, monthLabel, totalBalance, totalIncome, totalSpent } from "../lib/money";

export default function Home() {
  const { state } = useKudi();
  const { balances, entries } = state;
  const thisMonth = entries.filter((e) => inThisMonth(e.at));
  const budgeted = hasBudget(state.budget);
  const planned = budgetTotal(state.budget);

  useEffect(() => {
    document.title = "Home · Kudi";
  }, []);

  return (
    <div className="space-y-8 sm:space-y-10">
      <Notice tone="warning" title="Local demo">
        No real money moves here. Everything you add is saved on this device only.
      </Notice>

      <section className="overflow-hidden rounded-3xl bg-primary text-primary-foreground shadow-xl shadow-primary/20">
        <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary-foreground/70">Your money right now</p>
            <div>
              <p className="font-display text-5xl font-semibold leading-none tracking-tight tabular-nums sm:text-6xl">
                {money(totalBalance(balances))}
              </p>
              <p className="mt-2 text-sm text-primary-foreground/70">across 6 purses</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <ButtonLink to="/money-in" variant="onDark" size="lg" className="w-full sm:w-auto">
                <Plus className="size-4" />
                Add money I received
              </ButtonLink>
              <ButtonLink
                to="/spend"
                variant="ghost"
                size="lg"
                className="w-full border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto"
              >
                Spend from a purse
              </ButtonLink>
            </div>
          </div>

          <div className="rounded-2xl bg-primary-foreground/10 p-4">
            <dl className="grid grid-cols-3 gap-3">
              {[
                { label: "Money in", value: totalIncome(thisMonth) },
                { label: "Spent", value: totalSpent(thisMonth) },
                { label: "Saved", value: balances.savings },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-[10px] uppercase tracking-wide text-primary-foreground/65">{stat.label}</dt>
                  <dd className="mt-1 font-display text-base tabular-nums sm:text-xl">{money(stat.value)}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 border-t border-primary-foreground/15 pt-2 text-[11px] text-primary-foreground/60">{monthLabel(Date.now())} so far</p>
          </div>
        </div>
      </section>

      {!budgeted ? (
        <Notice tone="info" title="Set your own amounts so Kudi knows where money should go.">
          <Link to="/setup" className="font-medium text-accent underline underline-offset-2">
            Create my budget
          </Link>
        </Notice>
      ) : (
        <Notice tone="info" title={"Your budget: " + money(planned) + " across six purses."}>
          <Link to="/setup" className="font-medium text-accent underline underline-offset-2">
            Change my amounts
          </Link>
        </Notice>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <SectionTitle>Your purses</SectionTitle>
            <Pagelede>Each purse holds money for one purpose. Spending always comes out of the purse you choose.</Pagelede>
          </div>
          <Link
            to="/setup"
            className="rounded-md px-1 py-1 text-sm font-medium text-accent underline decoration-accent/40 underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            Edit budget
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PURSES.map((purse) => {
            const need = budgeted && state.budget ? state.budget.amounts[purse.id] ?? 0 : 0;
            const balance = balances[purse.id] ?? 0;
            const pct = need > 0 ? Math.min(100, Math.round((balance / need) * 100)) : 0;
            const low = need > 0 && balance < need * 0.25;
            return (
              <article
                key={purse.id}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <PurseIcon id={purse.id} />
                    <div>
                      <h3 className="font-display text-lg font-semibold leading-tight">{purse.name}</h3>
                      <p className="text-xs text-muted-foreground">{purse.rule}</p>
                    </div>
                  </div>
                  {purse.id === "emergency" ? <Badge tone="warning">Video request</Badge> : null}
                  {purse.id === "savings" ? <Badge tone="success">Locked until the 1st</Badge> : null}
                </div>

                <p className={"mt-4 font-display text-2xl font-semibold tabular-nums " + (low ? "text-danger" : "")}>{money(balance)}</p>

                {need > 0 ? (
                  <div className="mt-3 space-y-1.5">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className={"h-full rounded-full " + (low ? "bg-danger/70" : "bg-accent")} style={{ width: pct + "%" }} />
                    </div>
                    <p className="text-[11px] tabular-nums text-muted-foreground">
                      {pct}% of the {money(need)} you budgeted
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    {purse.id === "emergency"
                      ? "Only released after a short video check."
                      : purse.id === "savings"
                        ? "Grows every time money comes in."
                        : "Set this purse's amount in your plan."}
                  </p>
                )}

                {purse.id !== "emergency" && purse.id !== "savings" ? (
                  <Link
                    to="/spend"
                    className="mt-3 inline-flex w-fit items-center gap-1 text-sm font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent"
                  >
                    Spend
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <SectionTitle as="h2">How your split works</SectionTitle>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            {
              n: "1",
              t: "Essentials first",
              d: "Feeding, transport, personal needs and academic hold the amounts you set for them.",
            },
            {
              n: "2",
              t: "Emergency kept aside",
              d: "The amount you choose sits in the emergency purse. Releasing it takes a short clip.",
            },
            {
              n: "3",
              t: "Saving every time",
              d: "Your general savings amount is set aside first, and stays locked until the end of the month.",
            },
          ].map((step) => (
            <li key={step.n} className="rounded-2xl bg-muted/70 p-4">
              <span className="grid size-7 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{step.n}</span>
              <p className="mt-3 font-medium">{step.t}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <ResetDemo />
    </div>
  );
}
