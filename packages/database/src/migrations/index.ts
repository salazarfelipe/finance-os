import type { Migration } from "./types";
import { migration001Initial } from "./001_initial";
import { migration002RecurringExpenses } from "./002_recurring_expenses";

// Ordenadas por version ascendente. Cada migración se aplica una sola vez.
export const migrations: Migration[] = [migration001Initial, migration002RecurringExpenses];

export type { Migration };
