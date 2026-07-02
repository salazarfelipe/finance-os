import type { Id, Money } from "@finance-os/shared";
import type { Period } from "@finance-os/domain";
import type { BudgetRepository, CategoryRepository, EventRepository } from "../ports";

export interface BudgetProgressEntry {
  categoryId: Id;
  categoryName: string;
  plannedAmount: Money;
  actualAmount: Money;
  remaining: Money;
  percentageConsumed: number;
}

export interface BudgetProgress {
  period: Period;
  entries: BudgetProgressEntry[];
  totalPlanned: Money;
  totalActual: Money;
}

// Responde "¿qué porcentaje del presupuesto he consumido?": compara lo planeado
// por categoría contra los eventos con esa categoría en el período.
export class CalculateBudgetProgress {
  constructor(
    private readonly budgets: BudgetRepository,
    private readonly categories: CategoryRepository,
    private readonly events: EventRepository,
  ) {}

  execute(period: Period): BudgetProgress {
    const budgetEntries = this.budgets.findByPeriod(period);
    const periodEvents = this.events.findByPeriod(period);
    const categoryNames = new Map(this.categories.findAll().map((c) => [c.id, c.name]));

    const actualByCategory = new Map<Id, Money>();
    for (const event of periodEvents) {
      if (event.type !== "income" && event.type !== "expense") continue;
      if (!event.categoryId) continue;
      actualByCategory.set(
        event.categoryId,
        (actualByCategory.get(event.categoryId) ?? 0) + event.amount,
      );
    }

    let totalPlanned = 0;
    let totalActual = 0;
    const entries: BudgetProgressEntry[] = budgetEntries.map((budget) => {
      const actualAmount = actualByCategory.get(budget.categoryId) ?? 0;
      totalPlanned += budget.plannedAmount;
      totalActual += actualAmount;
      return {
        categoryId: budget.categoryId,
        categoryName: categoryNames.get(budget.categoryId) ?? "Sin categoría",
        plannedAmount: budget.plannedAmount,
        actualAmount,
        remaining: budget.plannedAmount - actualAmount,
        percentageConsumed: budget.plannedAmount === 0 ? 0 : actualAmount / budget.plannedAmount,
      };
    });

    return { period, entries, totalPlanned, totalActual };
  }
}
