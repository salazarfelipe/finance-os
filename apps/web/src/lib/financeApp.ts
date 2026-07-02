import {
  AccountRepository,
  BudgetRepository,
  CategoryRepository,
  CreditCardRepository,
  CreditRepository,
  EventRepository,
  FinanceDatabase,
  MovementRepository,
  SystemClock,
  UuidGenerator,
} from "@finance-os/database";
import type { RegisterEventDeps } from "@finance-os/application";

export interface FinanceApp {
  db: FinanceDatabase;
  accounts: AccountRepository;
  events: EventRepository;
  movements: MovementRepository;
  categories: CategoryRepository;
  budgets: BudgetRepository;
  credits: CreditRepository;
  creditCards: CreditCardRepository;
  clock: SystemClock;
  ids: UuidGenerator;
}

export async function createFinanceApp(): Promise<FinanceApp> {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const db = await FinanceDatabase.open({ wasmUrl: `${basePath}/sql-wasm.wasm` });

  return {
    db,
    accounts: new AccountRepository(db.raw),
    events: new EventRepository(db.raw),
    movements: new MovementRepository(db.raw),
    categories: new CategoryRepository(db.raw),
    budgets: new BudgetRepository(db.raw),
    credits: new CreditRepository(db.raw),
    creditCards: new CreditCardRepository(db.raw),
    clock: new SystemClock(),
    ids: new UuidGenerator(),
  };
}

// Dependencias comunes que necesitan los casos de uso RegisterIncome/RegisterExpense/TransferMoney.
export function registerEventDeps(app: FinanceApp): RegisterEventDeps & {
  clock: SystemClock;
  ids: UuidGenerator;
} {
  return {
    events: app.events,
    movements: app.movements,
    persistence: app.db,
    ids: app.ids,
    clock: app.clock,
  };
}
