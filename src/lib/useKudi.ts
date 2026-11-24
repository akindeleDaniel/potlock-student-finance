import { useSyncExternalStore } from "react";
import {
  applyEmergencyRequest,
  applyIncome,
  clearState,
  createBudget,
  loadState,
  releaseRequest,
  resetState,
  saveState,
  spendFromPurse,
  type KudiState,
  type PurseId,
  type SpendInput,
  type SpendResult,
} from "./money";

/**
 * One shared demo state for every page: the same purses on Home, Money in, Spend, Emergency and Report.
 * Every change is written to localStorage, so a reload keeps it. Wallet connection does not touch this data.
 */
let state: KudiState = loadState();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function set(next: KudiState) {
  state = next;
  saveState(next);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export default function useKudi() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    state: current,
    createBudget(input: { income: number; amounts: Record<PurseId, number>; source: string }) {
      set(createBudget(state, input));
    },
    addIncome(input: { amount: number; source: string }) {
      set(applyIncome(state, input));
    },
    spend(input: SpendInput): SpendResult {
      const result: SpendResult = spendFromPurse(state, input);
      if (result.ok) set(result.state);
      return result;
    },
    recordEmergency(input: { amount: number; description: string; verdict: "approved" | "review"; reasons: string[]; hadClip: boolean }) {
      set(applyEmergencyRequest(state, input));
    },
    release(id: string) {
      set(releaseRequest(state, id));
    },
    reset() {
      set(resetState());
    },
    clear() {
      set(clearState());
    },
  };
}
