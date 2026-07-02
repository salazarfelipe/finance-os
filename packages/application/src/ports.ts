import type { Id, ISODateString } from "@finance-os/shared";
import type {
  Account,
  Budget,
  Category,
  Credit,
  CreditCard,
  Event,
  Movement,
  Period,
} from "@finance-os/domain";

// Puertos que los casos de uso necesitan. packages/database los implementa;
// gracias al tipado estructural de TypeScript, database no necesita depender
// de application para satisfacerlos.
export interface AccountRepository {
  insert(account: Account): void;
  findAll(): Account[];
  findById(id: Id): Account | undefined;
}

export interface EventRepository {
  insert(event: Event): void;
  findAll(): Event[];
  findByPeriod(period: Period): Event[];
}

export interface CategoryRepository {
  insert(category: Category): void;
  findAll(): Category[];
  findById(id: Id): Category | undefined;
}

export interface BudgetRepository {
  upsert(budget: Budget): void;
  findByPeriod(period: Period): Budget[];
}

export interface MovementRepository {
  insertMany(movements: Movement[]): void;
  findAll(): Movement[];
  findByAccountId(accountId: Id): Movement[];
}

export interface CreditRepository {
  findById(id: Id): Credit | undefined;
}

export interface CreditCardRepository {
  findById(id: Id): CreditCard | undefined;
}

export interface Persistence {
  save(): Promise<void>;
}

export interface IdGenerator {
  generate(): Id;
}

export interface Clock {
  now(): ISODateString;
}
