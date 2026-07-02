import type { Id, ISODateString, Money } from "@finance-os/shared";

export type AccountKind = "asset" | "liability";

export type AccountSubtype =
  | "bank"
  | "cash"
  | "investment"
  | "credit"
  | "credit_card"
  | "physical_asset"
  | "other";

export interface Account {
  id: Id;
  name: string;
  kind: AccountKind;
  subtype: AccountSubtype;
  institution?: string;
  openingBalance: Money;
  isArchived: boolean;
  createdAt: ISODateString;
}
