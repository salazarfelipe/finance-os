import type { Id, ISODateString, Money } from "@finance-os/shared";

// Metadata del producto de crédito. El saldo vive en la Account (liability) referenciada.
export interface Credit {
  id: Id;
  accountId: Id;
  name: string;
  principalAmount: Money;
  startDate: ISODateString;
  termMonths: number;
  monthlyPayment: Money;
  createdAt: ISODateString;
}
