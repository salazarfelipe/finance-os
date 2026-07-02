import type { Id, ISODateString, Money } from "@finance-os/shared";

// Metadata de la tarjeta. El saldo (deuda) vive en la Account (liability) referenciada.
export interface CreditCard {
  id: Id;
  accountId: Id;
  name: string;
  creditLimit?: Money;
  closingDay?: number;
  dueDay?: number;
  createdAt: ISODateString;
}
