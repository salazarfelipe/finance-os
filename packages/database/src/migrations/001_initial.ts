import type { Migration } from "./types";

// Sprint 1: modelo de datos. Account unifica activos y pasivos (kind: asset|liability);
// Credit, CreditCard y Asset son metadata que referencia una Account, nunca duplican saldo.
// Reserve y Project no tienen saldo propio: son etiquetas sobre Event/Movement.
export const migration001Initial: Migration = {
  version: 1,
  name: "initial",
  up: `
    CREATE TABLE accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('asset', 'liability')),
      subtype TEXT NOT NULL CHECK (subtype IN (
        'bank', 'cash', 'investment', 'credit', 'credit_card', 'physical_asset', 'other'
      )),
      institution TEXT,
      opening_balance INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE persons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      relationship TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
      parent_id TEXT REFERENCES categories(id),
      created_at TEXT NOT NULL
    );

    CREATE TABLE reserves (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      target_amount INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE TABLE projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      target_amount INTEGER,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE goals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      target_amount INTEGER NOT NULL,
      target_date TEXT,
      reserve_id TEXT REFERENCES reserves(id),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE credits (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      name TEXT NOT NULL,
      principal_amount INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      term_months INTEGER NOT NULL,
      monthly_payment INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE credit_cards (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      name TEXT NOT NULL,
      credit_limit INTEGER,
      closing_day INTEGER,
      due_day INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE TABLE assets (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      name TEXT NOT NULL,
      asset_type TEXT NOT NULL CHECK (asset_type IN ('vehicle', 'severance', 'real_estate', 'other')),
      acquisition_date TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE budgets (
      id TEXT PRIMARY KEY,
      period TEXT NOT NULL,
      category_id TEXT NOT NULL REFERENCES categories(id),
      planned_amount INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (period, category_id)
    );

    CREATE TABLE events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN (
        'income', 'expense', 'transfer', 'saving', 'investment',
        'credit_payment', 'credit_card_payment', 'interest'
      )),
      date TEXT NOT NULL,
      amount INTEGER NOT NULL,
      description TEXT,
      account_id TEXT REFERENCES accounts(id),
      source_account_id TEXT REFERENCES accounts(id),
      destination_account_id TEXT REFERENCES accounts(id),
      category_id TEXT REFERENCES categories(id),
      person_id TEXT REFERENCES persons(id),
      reserve_id TEXT REFERENCES reserves(id),
      project_id TEXT REFERENCES projects(id),
      credit_id TEXT REFERENCES credits(id),
      credit_card_id TEXT REFERENCES credit_cards(id),
      created_at TEXT NOT NULL
    );

    CREATE TABLE movements (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id),
      account_id TEXT NOT NULL REFERENCES accounts(id),
      amount INTEGER NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX idx_events_date ON events(date);
    CREATE INDEX idx_movements_account_id ON movements(account_id);
    CREATE INDEX idx_movements_event_id ON movements(event_id);
    CREATE INDEX idx_budgets_period ON budgets(period);
  `,
};
