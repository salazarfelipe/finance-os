import type { Database } from "sql.js";
import type { RecurringExpense } from "@finance-os/domain";

export class RecurringExpenseRepository {
  constructor(private readonly db: Database) {}

  insert(recurringExpense: RecurringExpense): void {
    this.db.run(
      `INSERT INTO recurring_expenses
        (id, name, account_id, category_id, amount, day_of_month, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recurringExpense.id,
        recurringExpense.name,
        recurringExpense.accountId,
        recurringExpense.categoryId ?? null,
        recurringExpense.amount,
        recurringExpense.dayOfMonth,
        recurringExpense.isActive ? 1 : 0,
        recurringExpense.createdAt,
      ],
    );
  }

  findAll(): RecurringExpense[] {
    const result = this.db.exec("SELECT * FROM recurring_expenses ORDER BY day_of_month");
    if (result.length === 0) return [];
    const { columns, values } = result[0];
    return values.map((row) => rowToRecurringExpense(columns, row));
  }

  findActive(): RecurringExpense[] {
    const result = this.db.exec(
      "SELECT * FROM recurring_expenses WHERE is_active = 1 ORDER BY day_of_month",
    );
    if (result.length === 0) return [];
    const { columns, values } = result[0];
    return values.map((row) => rowToRecurringExpense(columns, row));
  }
}

function rowToRecurringExpense(columns: string[], row: unknown[]): RecurringExpense {
  const record = Object.fromEntries(columns.map((column, i) => [column, row[i]])) as Record<
    string,
    unknown
  >;
  return {
    id: record.id as string,
    name: record.name as string,
    accountId: record.account_id as string,
    categoryId: (record.category_id as string | null) ?? undefined,
    amount: record.amount as number,
    dayOfMonth: record.day_of_month as number,
    isActive: record.is_active === 1,
    createdAt: record.created_at as string,
  };
}
