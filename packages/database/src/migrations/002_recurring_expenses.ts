import type { Migration } from "./types";

// Sprint 6: automatizaciones. Plantillas de gastos fijos + trazabilidad en events
// para que GenerateRecurringExpenses/CloseMonth sean idempotentes por período.
export const migration002RecurringExpenses: Migration = {
  version: 2,
  name: "recurring_expenses",
  up: `
    CREATE TABLE recurring_expenses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      category_id TEXT REFERENCES categories(id),
      amount INTEGER NOT NULL,
      day_of_month INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    ALTER TABLE events ADD COLUMN recurring_expense_id TEXT REFERENCES recurring_expenses(id);

    CREATE INDEX idx_events_recurring_expense_id ON events(recurring_expense_id);
  `,
};
