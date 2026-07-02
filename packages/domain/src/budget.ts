import type { Id, ISODateString, Money } from "@finance-os/shared";

// Period es un valor "YYYY-MM", no una entidad con tabla propia.
export type Period = string;

export interface Budget {
  id: Id;
  period: Period;
  categoryId: Id;
  plannedAmount: Money;
  createdAt: ISODateString;
}

export function periodOf(date: ISODateString): Period {
  return date.slice(0, 7);
}
