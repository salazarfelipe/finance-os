import type { Database } from "sql.js";
import type { Movement } from "@finance-os/domain";

export class MovementRepository {
  constructor(private readonly db: Database) {}

  insertMany(movements: Movement[]): void {
    for (const movement of movements) {
      this.db.run(
        `INSERT INTO movements (id, event_id, account_id, amount, date, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          movement.id,
          movement.eventId,
          movement.accountId,
          movement.amount,
          movement.date,
          movement.createdAt,
        ],
      );
    }
  }

  findAll(): Movement[] {
    const result = this.db.exec("SELECT * FROM movements ORDER BY date, created_at");
    return rowsToMovements(result);
  }

  findByAccountId(accountId: string): Movement[] {
    const result = this.db.exec(
      "SELECT * FROM movements WHERE account_id = ? ORDER BY date, created_at",
      [accountId],
    );
    return rowsToMovements(result);
  }

  deleteByEventId(eventId: string): void {
    this.db.run("DELETE FROM movements WHERE event_id = ?", [eventId]);
  }
}

function rowsToMovements(result: ReturnType<Database["exec"]>): Movement[] {
  if (result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map((row) => {
    const record = Object.fromEntries(columns.map((column, i) => [column, row[i]])) as Record<
      string,
      unknown
    >;
    return {
      id: record.id as string,
      eventId: record.event_id as string,
      accountId: record.account_id as string,
      amount: record.amount as number,
      date: record.date as string,
      createdAt: record.created_at as string,
    };
  });
}
