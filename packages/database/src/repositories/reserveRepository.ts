import type { Database } from "sql.js";
import type { Reserve } from "@finance-os/domain";

export class ReserveRepository {
  constructor(private readonly db: Database) {}

  insert(reserve: Reserve): void {
    this.db.run(
      `INSERT INTO reserves (id, name, account_id, target_amount, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        reserve.id,
        reserve.name,
        reserve.accountId,
        reserve.targetAmount ?? null,
        reserve.createdAt,
      ],
    );
  }

  findAll(): Reserve[] {
    const result = this.db.exec("SELECT * FROM reserves ORDER BY created_at");
    if (result.length === 0) return [];
    const { columns, values } = result[0];
    return values.map((row) => rowToReserve(columns, row));
  }

  findById(id: string): Reserve | undefined {
    const result = this.db.exec("SELECT * FROM reserves WHERE id = ?", [id]);
    if (result.length === 0) return undefined;
    const { columns, values } = result[0];
    const row = values[0];
    if (!row) return undefined;
    return rowToReserve(columns, row);
  }
}

function rowToReserve(columns: string[], row: unknown[]): Reserve {
  const record = Object.fromEntries(columns.map((column, i) => [column, row[i]])) as Record<
    string,
    unknown
  >;
  return {
    id: record.id as string,
    name: record.name as string,
    accountId: record.account_id as string,
    targetAmount: (record.target_amount as number | null) ?? undefined,
    createdAt: record.created_at as string,
  };
}
