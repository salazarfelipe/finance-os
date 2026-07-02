import type { Id, ISODateString, Money } from "@finance-os/shared";

interface BaseEvent {
  id: Id;
  date: ISODateString;
  amount: Money;
  description?: string;
  createdAt: ISODateString;
}

export interface IncomeEvent extends BaseEvent {
  type: "income";
  accountId: Id;
  categoryId?: Id;
  personId?: Id;
}

export interface ExpenseEvent extends BaseEvent {
  type: "expense";
  accountId: Id;
  categoryId?: Id;
  personId?: Id;
  // Presente cuando el evento fue generado por GenerateRecurringExpenses/CloseMonth.
  recurringExpenseId?: Id;
}

export interface TransferEvent extends BaseEvent {
  type: "transfer";
  sourceAccountId: Id;
  destinationAccountId: Id;
}

export interface SavingEvent extends BaseEvent {
  type: "saving";
  sourceAccountId: Id;
  destinationAccountId: Id;
  reserveId?: Id;
}

export interface InvestmentEvent extends BaseEvent {
  type: "investment";
  sourceAccountId: Id;
  destinationAccountId: Id;
  projectId?: Id;
}

export interface CreditPaymentEvent extends BaseEvent {
  type: "credit_payment";
  creditId: Id;
  sourceAccountId: Id;
}

export interface CreditCardPaymentEvent extends BaseEvent {
  type: "credit_card_payment";
  creditCardId: Id;
  sourceAccountId: Id;
}

export interface InterestEvent extends BaseEvent {
  type: "interest";
  accountId: Id;
}

// Un Event es lo único que el usuario registra. El motor financiero (Sprint 2)
// lo traduce en uno o más Movement.
export type Event =
  | IncomeEvent
  | ExpenseEvent
  | TransferEvent
  | SavingEvent
  | InvestmentEvent
  | CreditPaymentEvent
  | CreditCardPaymentEvent
  | InterestEvent;

export type EventType = Event["type"];
