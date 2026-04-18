import type { Check } from "../../types";

export type TransitionStatus = "ok" | "fail";

export interface Transition {
  to: TransitionStatus;
  at: string;
  durationSeconds: number;
  isCurrent: boolean;
}

export function statusOf(c: Check): TransitionStatus {
  return c.success ? "ok" : "fail";
}

export function deriveTransitions(history: Check[]): Transition[] {
  if (history.length === 0) return [];

  const chronological = [...history].reverse();
  const transitions: Transition[] = [];

  let currentState = statusOf(chronological[0]);
  let currentStart = chronological[0].checked_at;

  for (let i = 1; i < chronological.length; i++) {
    const check = chronological[i];
    const status = statusOf(check);
    if (status !== currentState) {
      transitions.push({
        to: currentState,
        at: currentStart,
        durationSeconds: diffSeconds(currentStart, check.checked_at),
        isCurrent: false,
      });
      currentState = status;
      currentStart = check.checked_at;
    }
  }

  transitions.push({
    to: currentState,
    at: currentStart,
    durationSeconds: diffSeconds(currentStart, new Date().toISOString()),
    isCurrent: true,
  });

  return transitions.reverse();
}

export function findLatestCheckForTransition(
  chronological: Check[],
  t: Transition,
): Check | undefined {
  const start = new Date(t.at).getTime();
  return chronological.find((c) => {
    const checkTime = new Date(c.checked_at).getTime();
    return checkTime >= start && statusOf(c) === t.to;
  });
}

function diffSeconds(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 1000);
}
