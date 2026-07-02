import type { Database } from "sql.js";
import type { Event, EventType } from "@finance-os/domain";

const COLUMNS = [
  "id",
  "type",
  "date",
  "amount",
  "description",
  "account_id",
  "source_account_id",
  "destination_account_id",
  "category_id",
  "person_id",
  "reserve_id",
  "project_id",
  "credit_id",
  "credit_card_id",
  "created_at",
] as const;

export class EventRepository {
  constructor(private readonly db: Database) {}

  insert(event: Event): void {
    const row = eventToRow(event);
    this.db.run(
      `INSERT INTO events (${COLUMNS.join(", ")}) VALUES (${COLUMNS.map(() => "?").join(", ")})`,
      COLUMNS.map((column) => row[column] ?? null),
    );
  }

  findAll(): Event[] {
    const result = this.db.exec("SELECT * FROM events ORDER BY date, created_at");
    if (result.length === 0) return [];
    const { columns, values } = result[0];
    return values.map((row) => rowToEvent(columns, row));
  }

  findByPeriod(period: string): Event[] {
    const result = this.db.exec(
      "SELECT * FROM events WHERE substr(date, 1, 7) = ? ORDER BY date, created_at",
      [period],
    );
    if (result.length === 0) return [];
    const { columns, values } = result[0];
    return values.map((row) => rowToEvent(columns, row));
  }
}

type EventRow = Record<(typeof COLUMNS)[number], string | number | null>;

function eventToRow(event: Event): EventRow {
  const base: EventRow = {
    id: event.id,
    type: event.type,
    date: event.date,
    amount: event.amount,
    description: event.description ?? null,
    account_id: null,
    source_account_id: null,
    destination_account_id: null,
    category_id: null,
    person_id: null,
    reserve_id: null,
    project_id: null,
    credit_id: null,
    credit_card_id: null,
    created_at: event.createdAt,
  };

  switch (event.type) {
    case "income":
    case "expense":
      base.account_id = event.accountId;
      base.category_id = event.categoryId ?? null;
      base.person_id = event.personId ?? null;
      break;
    case "transfer":
      base.source_account_id = event.sourceAccountId;
      base.destination_account_id = event.destinationAccountId;
      break;
    case "saving":
      base.source_account_id = event.sourceAccountId;
      base.destination_account_id = event.destinationAccountId;
      base.reserve_id = event.reserveId ?? null;
      break;
    case "investment":
      base.source_account_id = event.sourceAccountId;
      base.destination_account_id = event.destinationAccountId;
      base.project_id = event.projectId ?? null;
      break;
    case "credit_payment":
      base.source_account_id = event.sourceAccountId;
      base.credit_id = event.creditId;
      break;
    case "credit_card_payment":
      base.source_account_id = event.sourceAccountId;
      base.credit_card_id = event.creditCardId;
      break;
    case "interest":
      base.account_id = event.accountId;
      break;
  }

  return base;
}

function rowToEvent(columns: string[], row: unknown[]): Event {
  const record = Object.fromEntries(columns.map((column, i) => [column, row[i]])) as Record<
    string,
    unknown
  >;
  const type = record.type as EventType;
  const base = {
    id: record.id as string,
    date: record.date as string,
    amount: record.amount as number,
    description: (record.description as string | null) ?? undefined,
    createdAt: record.created_at as string,
  };

  switch (type) {
    case "income":
    case "expense":
      return {
        ...base,
        type,
        accountId: record.account_id as string,
        categoryId: (record.category_id as string | null) ?? undefined,
        personId: (record.person_id as string | null) ?? undefined,
      };
    case "transfer":
      return {
        ...base,
        type,
        sourceAccountId: record.source_account_id as string,
        destinationAccountId: record.destination_account_id as string,
      };
    case "saving":
      return {
        ...base,
        type,
        sourceAccountId: record.source_account_id as string,
        destinationAccountId: record.destination_account_id as string,
        reserveId: (record.reserve_id as string | null) ?? undefined,
      };
    case "investment":
      return {
        ...base,
        type,
        sourceAccountId: record.source_account_id as string,
        destinationAccountId: record.destination_account_id as string,
        projectId: (record.project_id as string | null) ?? undefined,
      };
    case "credit_payment":
      return {
        ...base,
        type,
        sourceAccountId: record.source_account_id as string,
        creditId: record.credit_id as string,
      };
    case "credit_card_payment":
      return {
        ...base,
        type,
        sourceAccountId: record.source_account_id as string,
        creditCardId: record.credit_card_id as string,
      };
    case "interest":
      return {
        ...base,
        type,
        accountId: record.account_id as string,
      };
  }
}
