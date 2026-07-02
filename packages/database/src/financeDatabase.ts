import type { Database } from "sql.js";
import { openDatabase, type OpenDatabaseOptions } from "./client";
import { runMigrations } from "./migrate";
import { loadPersistedDatabase, persistDatabase } from "./persistence";

export class FinanceDatabase {
  private constructor(private readonly db: Database) {}

  static async open(options: OpenDatabaseOptions = {}): Promise<FinanceDatabase> {
    const data = options.data ?? (await loadPersistedDatabase());
    const db = await openDatabase({ ...options, data });
    runMigrations(db);
    return new FinanceDatabase(db);
  }

  get raw(): Database {
    return this.db;
  }

  async save(): Promise<void> {
    await persistDatabase(this.db.export());
  }
}
