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

export function nextPeriod(period: Period): Period {
  const [year, month] = period.split("-").map(Number);
  // month (1-12) usado como índice 0-based de Date.UTC ya apunta al mes siguiente.
  const date = new Date(Date.UTC(year, month, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
