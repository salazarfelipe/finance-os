import type { Database } from "sql.js";
import { migrations } from "./migrations";

export function runMigrations(db: Database): void {
  db.run("CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)");

  const result = db.exec("SELECT COALESCE(MAX(version), 0) FROM schema_version");
  const currentVersion = (result[0]?.values[0]?.[0] as number) ?? 0;

  for (const migration of migrations) {
    if (migration.version <= currentVersion) continue;
    db.run(migration.up);
    db.run("INSERT INTO schema_version (version) VALUES (?)", [migration.version]);
  }
}
