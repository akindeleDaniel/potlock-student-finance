/**
 * Kudi's money engine. The student decides every figure: the income they have and one amount per purse.
 * Kudi adds the amounts up, warns when they pass the income, and moves money into the purses exactly as entered.
 * Everything is demo money kept in this browser's localStorage. No wallet, no chain, no real naira.
 */

export type PurseId = "feeding" | "transport" | "personal" | "academic" | "emergency" | "savings";

export interface PurseInfo {
  id: PurseId;
  name: string;
  rule: string;
}

export const PURSES: PurseInfo[] = [
  { id: "feeding", name: "Feeding", rule: "Food, groceries and water" },
  { id: "transport", name: "Transportation", rule: "Fares to class and back" },
  { id: "personal", name: "Personal needs", rule: "Soap, data, small repairs" },
  { id: "academic", name: "Academic expenses", rule: "Books, printing, projects" },
  { id: "emergency", name: "Emergency savings", rule: "Surprises only, needs a clip" },
  { id: "savings", name: "General savings", rule: "Locked until the 1st" },
];

export const PURSE_IDS: PurseId[] = PURSES.map((p) => p.id);

export function purseName(id: PurseId): string {
  return PURSES.find((p) => p.id === id)?.name ?? id;
}

export function purseRule(id: PurseId): string {
  return PURSES.find((p) => p.id === id)?.rule ?? "";
}

export interface Budget {
  /** The money the student has available for this budget. */
  income: number;
  /** Exactly what the student chose for each purse. Kudi never adjusts these. */
  amounts: Record<PurseId, number>;
  createdAt: number;
}

export type Balances = Record<PurseId, number>;

export interface IncomeEntry {
  id: string;
  at: number;
  type: "income";
  source: string;
  amount: number;
  splits: Partial<Balances>;
}

export interface SpendEntry {
  id: string;
  at: number;
  type: "spend";
  purse: PurseId;
  amount: number;
  note: string;
}

export type Entry = IncomeEntry | SpendEntry;

export interface EmergencyRequest {
  id: string;
  at: number;
  amount: number;
  verdict: "approved" | "review";
  reasons: string[];
  hadClip: boolean;
  released: boolean;
  description: string;
}

export interface KudiState {
  budget: Budget | null;
  balances: Balances;
  entries: Entry[];
  requests: EmergencyRequest[];
}

// ---------------------------------------------------------------- numbers

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** 100000 -> "100,000", 1500.5 -> "1,500.50" */
export function formatN(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const rounded = round2(n);
  const fixed = rounded.toFixed(2).replace(/\.00$/, "");
  const [whole, frac] = fixed.split(".");
  const grouped = Number(whole).toLocaleString("en-NG");
  return frac ? grouped + "." + frac : grouped;
}

/** 150000 -> "₦150,000" */
export function money(n: number): string {
  return "₦" + formatN(n);
}

export function monthLabel(at: number): string {
  return new Date(at).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function dayLabel(at: number): string {
  return new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function inThisMonth(at: number): boolean {
  const d = new Date(at);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function emptyAmounts(): Balances {
  return { feeding: 0, transport: 0, personal: 0, academic: 0, emergency: 0, savings: 0 };
}

export function totalBalance(balances: Balances): number {
  return round2(PURSE_IDS.reduce((sum, id) => sum + (balances[id] ?? 0), 0));
}

export function budgetTotal(budget: Budget | null): number {
  if (!budget) return 0;
  return round2(PURSE_IDS.reduce((sum, id) => sum + (budget.amounts[id] ?? 0), 0));
}

export function budgetLeft(budget: Budget | null): number {
  if (!budget) return 0;
  return round2(budget.income - budgetTotal(budget));
}

/** True once the student has made a budget with at least one naira in it. */
export function hasBudget(budget: Budget | null): boolean {
  return budgetTotal(budget) > 0;
}

// ---------------------------------------------------------------- budget check

export interface BudgetCheck {
  total: number;
  left: number;
  over: boolean;
  valid: boolean;
  error: string | null;
}

/** Live check of the student's own figures: the amounts may never pass the income. */
export function checkBudget(income: number, amounts: Record<PurseId, number>): BudgetCheck {
  const total = round2(PURSE_IDS.reduce((sum, id) => sum + (Number(amounts[id]) || 0), 0));
  const left = round2(income - total);
  const negative = PURSE_IDS.some((id) => !Number.isFinite(Number(amounts[id])) || Number(amounts[id]) < 0);
  let error: string | null = null;
  if (!Number.isFinite(income) || income <= 0) error = "Enter the money you have available first.";
  else if (negative) error = "Amounts cannot be negative.";
  else if (total <= 0) error = "Enter an amount for at least one purse.";
  else if (total > income) error = "Your allocations are " + money(round2(total - income)) + " more than your income. Lower an amount to continue.";
  return { total, left, over: total > income, valid: error === null, error };
}

/** Turn the student's figures into a working budget and set each purse to the amount they chose. */
export function createBudget(state: KudiState, input: { income: number; amounts: Record<PurseId, number>; source: string }): KudiState {
  const income = round2(input.income);
  const amounts = emptyAmounts();
  for (const id of PURSE_IDS) amounts[id] = round2(Number(input.amounts[id]) || 0);
  const budget: Budget = { income, amounts, createdAt: Date.now() };
  const entry: IncomeEntry = {
    id: newId(),
    at: Date.now(),
    type: "income",
    source: input.source,
    amount: income,
    splits: { ...amounts },
  };
  return { ...state, budget, balances: amounts, entries: [entry, ...state.entries] };
}

// ---------------------------------------------------------------- incoming money

export interface SplitLine {
  purse: PurseId;
  label: string;
  amount: number;
}

export interface Split {
  total: number;
  lines: SplitLine[];
  /** True when the amount is bigger than the whole budget, so the excess goes to general savings. */
  hasExcess: boolean;
}

/**
 * New money follows the student's own budget: each purse gets its budgeted share.
 * Anything above the budget goes to general savings, never invented into other purses.
 */
export function splitByBudget(total: number, budget: Budget | null): Split {
  const amount = round2(total);
  const allocated = budgetTotal(budget);
  if (!budget || allocated <= 0) return { total: amount, lines: [], hasExcess: false };

  const shares = emptyAmounts();
  let hasExcess = false;

  if (amount >= allocated) {
    for (const id of PURSE_IDS) shares[id] = budget.amounts[id] ?? 0;
    shares.savings = round2(shares.savings + (amount - allocated));
    hasExcess = amount > allocated;
  } else {
    let used = 0;
    for (const id of PURSE_IDS) {
      if (id === "savings") continue;
      const share = Math.floor(((amount * (budget.amounts[id] ?? 0)) / allocated) * 100) / 100;
      shares[id] = round2(share);
      used = round2(used + share);
    }
    // The general savings purse takes the rest, so nothing is lost to rounding.
    shares.savings = round2(Math.max(0, amount - used));
  }

  const lines = PURSES.map((p) => ({ purse: p.id, label: p.name, amount: shares[p.id] ?? 0 })).filter((line) => line.amount > 0);
  return { total: amount, lines, hasExcess };
}

export function applyIncome(state: KudiState, input: { amount: number; source: string }): KudiState {
  const split = splitByBudget(input.amount, state.budget);
  const balances = { ...state.balances };
  const splits: Partial<Balances> = {};
  for (const line of split.lines) {
    balances[line.purse] = round2((balances[line.purse] ?? 0) + line.amount);
    splits[line.purse] = line.amount;
  }
  const entry: IncomeEntry = {
    id: newId(),
    at: Date.now(),
    type: "income",
    source: input.source,
    amount: split.total,
    splits,
  };
  return { ...state, balances, entries: [entry, ...state.entries] };
}

// ---------------------------------------------------------------- spending

export interface SpendInput {
  purse: PurseId;
  amount: number;
  note: string;
  /** Set once the student has seen the "more than half" warning and chosen to go ahead. */
  confirmed?: boolean;
}

export type SpendResult = { ok: true; state: KudiState; left: number } | { ok: false; error: string; needsConfirm?: boolean };

export function spendFromPurse(state: KudiState, input: SpendInput): SpendResult {
  const amount = round2(input.amount);
  const balance = state.balances[input.purse] ?? 0;
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Enter an amount in naira." };
  if (input.note.trim().length < 3) return { ok: false, error: "Add a short note (at least 3 characters)." };
  if (input.purse === "savings") return { ok: false, error: "Savings is locked until the end of the month." };
  if (input.purse === "emergency") return { ok: false, error: "The emergency purse needs a short video request." };
  if (amount > balance) return { ok: false, error: "That is more than this purse holds." };
  if (amount > balance / 2 && !input.confirmed)
    return { ok: false, error: "That is more than half of this purse. Make sure it is really needed.", needsConfirm: true };

  const entry: SpendEntry = {
    id: newId(),
    at: Date.now(),
    type: "spend",
    purse: input.purse,
    amount,
    note: input.note.trim(),
  };
  const balances = { ...state.balances, [input.purse]: round2(balance - amount) };
  return { ok: true, state: { ...state, balances, entries: [entry, ...state.entries] }, left: balances[input.purse] };
}

// ---------------------------------------------------------------- report sums

export function totalIncome(entries: Entry[]): number {
  return round2(entries.reduce((sum, e) => (e.type === "income" ? sum + e.amount : sum), 0));
}

export function totalSpent(entries: Entry[]): number {
  return round2(entries.reduce((sum, e) => (e.type === "spend" ? sum + e.amount : sum), 0));
}

export function monthEntries(entries: Entry[]): Entry[] {
  return entries.filter((e) => inThisMonth(e.at));
}

// ---------------------------------------------------------------- emergency check

export interface CheckResult {
  verdict: "approved" | "review";
  reasons: string[];
}

/**
 * The demo stand-in for the AI review: plain on-device rules, no model and no server.
 * A clip and a clear, modest request get approved; anything else is referred for review.
 */
export function runEmergencyCheck(input: { description: string; amount: number; hasClip: boolean; balance: number }): CheckResult {
  const reasons: string[] = [];
  const words = input.description.trim().toLowerCase();
  let approved = true;

  if (!input.hasClip) {
    approved = false;
    reasons.push("A short clip helps approve it.");
  }
  if (input.description.trim().length < 40) {
    approved = false;
    reasons.push("The explanation is short. A few more details would help.");
  }
  if (input.amount > input.balance / 2) {
    approved = false;
    reasons.push("That is more than half of the emergency purse.");
  }
  if (/\b(bet|party|shopping|jollof|game|dress|shoe)\b/.test(words)) {
    approved = false;
    reasons.push("That does not read like an emergency.");
  }
  if (approved) {
    reasons.push("The request is clear, modest and backed by a clip.");
    reasons.push("It is less than half of the emergency purse.");
  }
  return { verdict: approved ? "approved" : "review", reasons };
}

export function applyEmergencyRequest(
  state: KudiState,
  input: { amount: number; description: string; verdict: "approved" | "review"; reasons: string[]; hadClip: boolean },
): KudiState {
  const request: EmergencyRequest = {
    id: newId(),
    at: Date.now(),
    amount: round2(input.amount),
    verdict: input.verdict,
    reasons: input.reasons,
    hadClip: input.hadClip,
    released: false,
    description: input.description.trim(),
  };
  return { ...state, requests: [request, ...state.requests] };
}

/** Move an approved amount out of the emergency purse. */
export function releaseRequest(state: KudiState, id: string): KudiState {
  const request = state.requests.find((r) => r.id === id);
  if (!request || request.released) return state;
  const balance = state.balances.emergency ?? 0;
  const amount = Math.min(request.amount, balance);
  const entry: SpendEntry = {
    id: newId(),
    at: Date.now(),
    type: "spend",
    purse: "emergency",
    amount,
    note: "Emergency release",
  };
  return {
    ...state,
    balances: { ...state.balances, emergency: round2(balance - amount) },
    entries: [entry, ...state.entries],
    requests: state.requests.map((r) => (r.id === id ? { ...r, released: true } : r)),
  };
}

// ---------------------------------------------------------------- state seed

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** The example budget from the plan: ₦100,000 shared across six purses. */
const SAMPLE_AMOUNTS: Balances = {
  feeding: 30000,
  transport: 15000,
  personal: 10000,
  academic: 5000,
  emergency: 10000,
  savings: 30000,
};

function sampleState(): KudiState {
  const budget: Budget = { income: 100000, amounts: { ...SAMPLE_AMOUNTS }, createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5 };
  return {
    budget,
    balances: { ...SAMPLE_AMOUNTS, feeding: 29200 },
    entries: [
      {
        id: newId(),
        at: Date.now() - 1000 * 60 * 60 * 20,
        type: "spend",
        purse: "feeding",
        amount: 800,
        note: "Canteen card top-up",
      },
      {
        id: newId(),
        at: Date.now() - 1000 * 60 * 60 * 24 * 5,
        type: "income",
        source: "Monthly allowance",
        amount: 100000,
        splits: { ...SAMPLE_AMOUNTS },
      },
    ],
    requests: [],
  };
}

export { SAMPLE_AMOUNTS, sampleState };

// ---------------------------------------------------------------- persistence

const KEY = "kudi.budget.v1";

/** A state with nothing created yet: the student builds the budget on the setup page. */
export function freshState(): KudiState {
  return { budget: null, balances: emptyAmounts(), entries: [], requests: [] };
}

export function loadState(): KudiState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return sampleState();
    const parsed = JSON.parse(raw) as KudiState;
    if (!parsed || typeof parsed !== "object" || !parsed.balances) return sampleState();
    const amounts = emptyAmounts();
    const budget = parsed.budget
      ? {
          income: Number(parsed.budget.income) || 0,
          amounts: PURSE_IDS.reduce((acc, id) => ({ ...acc, [id]: Number(parsed.budget?.amounts?.[id]) || 0 }), amounts),
          createdAt: Number(parsed.budget.createdAt) || Date.now(),
        }
      : null;
    const balances = PURSE_IDS.reduce((acc, id) => ({ ...acc, [id]: Number(parsed.balances?.[id]) || 0 }), emptyAmounts());
    return {
      budget,
      balances,
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      requests: Array.isArray(parsed.requests) ? parsed.requests : [],
    };
  } catch {
    return sampleState();
  }
}

export function saveState(state: KudiState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // A full or blocked storage: the session still works, it just won't be remembered.
  }
}

export function resetState(): KudiState {
  const fresh = sampleState();
  saveState(fresh);
  return fresh;
}

/** Clear everything, including the budget, so the student starts from the setup page. */
export function clearState(): KudiState {
  const fresh = freshState();
  saveState(fresh);
  return fresh;
}
