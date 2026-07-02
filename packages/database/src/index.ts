// Repositorios sobre sql.js + persistencia en IndexedDB. Implementa los puertos definidos en domain/application.

export { FinanceDatabase } from "./financeDatabase";
export { openDatabase, type OpenDatabaseOptions } from "./client";
export { loadPersistedDatabase, persistDatabase } from "./persistence";
export { runMigrations } from "./migrate";
export { AccountRepository } from "./repositories/accountRepository";
export { EventRepository } from "./repositories/eventRepository";
export { MovementRepository } from "./repositories/movementRepository";
export { CreditRepository } from "./repositories/creditRepository";
export { CreditCardRepository } from "./repositories/creditCardRepository";
export { CategoryRepository } from "./repositories/categoryRepository";
export { BudgetRepository } from "./repositories/budgetRepository";
export { ReserveRepository } from "./repositories/reserveRepository";
export { GoalRepository } from "./repositories/goalRepository";
export { SystemClock, UuidGenerator } from "./adapters";
