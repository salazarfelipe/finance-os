import type { Database } from "sql.js";
import type { Credit } from "@finance-os/domain";

export class CreditRepository {
  constructor(private readonly db: Database) {}

  insert(credit: Credit): void {
    this.db.run(
      `INSERT INTO credits
        (id, account_id, name, principal_amount, start_date, term_months, monthly_payment, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        credit.id,
        credit.accountId,
        credit.name,
        credit.principalAmount,
        credit.startDate,
        credit.termMonths,
        credit.monthlyPayment,
        credit.createdAt,
      ],
    );
  }

  findById(id: string): Credit | undefined {
    const result = this.db.exec("SELECT * FROM credits WHERE id = ?", [id]);
    if (result.length === 0) return undefined;
    const { columns, values } = result[0];
    const row = values[0];
    if (!row) return undefined;
    return rowToCredit(columns, row);
  }

  findAll(): Credit[] {
    const result = this.db.exec("SELECT * FROM credits ORDER BY created_at");
    if (result.length === 0) return [];
    const { columns, values } = result[0];
    return values.map((row) => rowToCredit(columns, row));
  }
}

function rowToCredit(columns: string[], row: unknown[]): Credit {
  const record = Object.fromEntries(columns.map((column, i) => [column, row[i]])) as Record<
    string,
    unknown
  >;
  return {
    id: record.id as string,
    accountId: record.account_id as string,
    name: record.name as string,
    principalAmount: record.principal_amount as number,
    startDate: record.start_date as string,
    termMonths: record.term_months as number,
    monthlyPayment: record.monthly_payment as number,
    createdAt: record.created_at as string,
  };
}
