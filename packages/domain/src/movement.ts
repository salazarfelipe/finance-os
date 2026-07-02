import type { Id, ISODateString, Money } from "@finance-os/shared";

// Línea de movimiento generada automáticamente a partir de un Event (motor financiero, Sprint 2).
// El saldo de una Account es su openingBalance + SUM(movements.amount) para esa cuenta.
export interface Movement {
  id: Id;
  eventId: Id;
  accountId: Id;
  amount: Money;
  date: ISODateString;
  createdAt: ISODateString;
}
