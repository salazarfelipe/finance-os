import type { Database } from "sql.js";
import type { Category } from "@finance-os/domain";

export class CategoryRepository {
  constructor(private readonly db: Database) {}

  insert(category: Category): void {
    this.db.run(
      `INSERT INTO categories (id, name, kind, parent_id, created_at) VALUES (?, ?, ?, ?, ?)`,
      [category.id, category.name, category.kind, category.parentId ?? null, category.createdAt],
    );
  }

  findAll(): Category[] {
    const result = this.db.exec("SELECT * FROM categories ORDER BY name");
    if (result.length === 0) return [];
    const { columns, values } = result[0];
    return values.map((row) => rowToCategory(columns, row));
  }

  findById(id: string): Category | undefined {
    const result = this.db.exec("SELECT * FROM categories WHERE id = ?", [id]);
    if (result.length === 0) return undefined;
    const { columns, values } = result[0];
    const row = values[0];
    if (!row) return undefined;
    return rowToCategory(columns, row);
  }
}

function rowToCategory(columns: string[], row: unknown[]): Category {
  const record = Object.fromEntries(columns.map((column, i) => [column, row[i]])) as Record<
    string,
    unknown
  >;
  return {
    id: record.id as string,
    name: record.name as string,
    kind: record.kind as Category["kind"],
    parentId: (record.parent_id as string | null) ?? undefined,
    createdAt: record.created_at as string,
  };
}
