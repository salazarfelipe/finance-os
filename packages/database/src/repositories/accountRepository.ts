import type { Database } from "sql.js";
import type { Account } from "@finance-os/domain";

export class AccountRepository {
  constructor(private readonly db: Database) {}

  insert(account: Account): void {
    this.db.run(
      `INSERT INTO accounts
        (id, name, kind, subtype, institution, opening_balance, is_archived, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        account.id,
        account.name,
        account.kind,
        account.subtype,
        account.institution ?? null,
        account.openingBalance,
        account.isArchived ? 1 : 0,
        account.createdAt,
      ],
    );
  }

  findAll(): Account[] {
    const result = this.db.exec("SELECT * FROM accounts ORDER BY created_at");
    if (result.length === 0) return [];
    const { columns, values } = result[0];
    return values.map((row) => rowToAccount(columns, row));
  }

  findById(id: string): Account | undefined {
    const result = this.db.exec("SELECT * FROM accounts WHERE id = ?", [id]);
    if (result.length === 0) return undefined;
    const { columns, values } = result[0];
    const row = values[0];
    if (!row) return undefined;
    return rowToAccount(columns, row);
  }
}

function rowToAccount(columns: string[], row: unknown[]): Account {
  const record = Object.fromEntries(columns.map((column, i) => [column, row[i]])) as Record<
    string,
    unknown
  >;
  return {
    id: record.id as string,
    name: record.name as string,
    kind: record.kind as Account["kind"],
    subtype: record.subtype as Account["subtype"],
    institution: (record.institution as string | null) ?? undefined,
    openingBalance: record.opening_balance as number,
    isArchived: record.is_archived === 1,
    createdAt: record.created_at as string,
  };
}
