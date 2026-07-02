// Repositorios sobre sql.js + persistencia en IndexedDB. Implementa los puertos definidos en domain/application.

export { FinanceDatabase } from "./financeDatabase";
export { openDatabase, type OpenDatabaseOptions } from "./client";
export { loadPersistedDatabase, persistDatabase } from "./persistence";
export { runMigrations } from "./migrate";
export { AccountRepository } from "./repositories/accountRepository";
