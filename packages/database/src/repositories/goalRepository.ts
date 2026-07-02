import type { Database } from "sql.js";
import type { Goal } from "@finance-os/domain";

export class GoalRepository {
  constructor(private readonly db: Database) {}

  insert(goal: Goal): void {
    this.db.run(
      `INSERT INTO goals (id, name, target_amount, target_date, reserve_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        goal.id,
        goal.name,
        goal.targetAmount,
        goal.targetDate ?? null,
        goal.reserveId ?? null,
        goal.status,
        goal.createdAt,
      ],
    );
  }

  findAll(): Goal[] {
    const result = this.db.exec("SELECT * FROM goals ORDER BY created_at");
    if (result.length === 0) return [];
    const { columns, values } = result[0];
    return values.map((row) => rowToGoal(columns, row));
  }
}

function rowToGoal(columns: string[], row: unknown[]): Goal {
  const record = Object.fromEntries(columns.map((column, i) => [column, row[i]])) as Record<
    string,
    unknown
  >;
  return {
    id: record.id as string,
    name: record.name as string,
    targetAmount: record.target_amount as number,
    targetDate: (record.target_date as string | null) ?? undefined,
    reserveId: (record.reserve_id as string | null) ?? undefined,
    status: record.status as Goal["status"],
    createdAt: record.created_at as string,
  };
}
