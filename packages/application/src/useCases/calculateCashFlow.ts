import type { Money } from "@finance-os/shared";
import type { Period } from "@finance-os/domain";
import type { EventRepository } from "../ports";

export interface CashFlow {
  period: Period;
  totalIncome: Money;
  totalExpense: Money;
  net: Money;
}

export class CalculateCashFlow {
  constructor(private readonly events: EventRepository) {}

  execute(period: Period): CashFlow {
    const periodEvents = this.events.findByPeriod(period);

    let totalIncome = 0;
    let totalExpense = 0;
    for (const event of periodEvents) {
      if (event.type === "income") totalIncome += event.amount;
      if (event.type === "expense") totalExpense += event.amount;
    }

    return { period, totalIncome, totalExpense, net: totalIncome - totalExpense };
  }
}
