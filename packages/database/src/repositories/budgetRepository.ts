import type { Database } from "sql.js";
import type { Budget } from "@finance-os/domain";

export class BudgetRepository {
  constructor(private readonly db: Database) {}

  // La identidad real de un presupuesto es (period, categoryId): regenerar el
  // presupuesto de un período solo actualiza el monto planeado, no crea filas nuevas.
  upsert(budget: Budget): void {
    this.db.run(
      `INSERT INTO budgets (id, period, category_id, planned_amount, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (period, category_id) DO UPDATE SET planned_amount = excluded.planned_amount`,
      [budget.id, budget.period, budget.categoryId, budget.plannedAmount, budget.createdAt],
    );
  }

  findByPeriod(period: string): Budget[] {
    const result = this.db.exec(
      "SELECT * FROM budgets WHERE period = ? ORDER BY category_id",
      [period],
    );
    if (result.length === 0) return [];
    const { columns, values } = result[0];
    return values.map((row) => rowToBudget(columns, row));
  }
}

function rowToBudget(columns: string[], row: unknown[]): Budget {
  const record = Object.fromEntries(columns.map((column, i) => [column, row[i]])) as Record<
    string,
    unknown
  >;
  return {
    id: record.id as string,
    period: record.period as string,
    categoryId: record.category_id as string,
    plannedAmount: record.planned_amount as number,
    createdAt: record.created_at as string,
  };
}
