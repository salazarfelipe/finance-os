import type { Database } from "sql.js";
import type { CreditCard } from "@finance-os/domain";

export class CreditCardRepository {
  constructor(private readonly db: Database) {}

  insert(creditCard: CreditCard): void {
    this.db.run(
      `INSERT INTO credit_cards
        (id, account_id, name, credit_limit, closing_day, due_day, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        creditCard.id,
        creditCard.accountId,
        creditCard.name,
        creditCard.creditLimit ?? null,
        creditCard.closingDay ?? null,
        creditCard.dueDay ?? null,
        creditCard.createdAt,
      ],
    );
  }

  findById(id: string): CreditCard | undefined {
    const result = this.db.exec("SELECT * FROM credit_cards WHERE id = ?", [id]);
    if (result.length === 0) return undefined;
    const { columns, values } = result[0];
    const row = values[0];
    if (!row) return undefined;
    const record = Object.fromEntries(columns.map((column, i) => [column, row[i]])) as Record<
      string,
      unknown
    >;
    return {
      id: record.id as string,
      accountId: record.account_id as string,
      name: record.name as string,
      creditLimit: (record.credit_limit as number | null) ?? undefined,
      closingDay: (record.closing_day as number | null) ?? undefined,
      dueDay: (record.due_day as number | null) ?? undefined,
      createdAt: record.created_at as string,
    };
  }
}
