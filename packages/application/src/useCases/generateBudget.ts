import type { Id, Money } from "@finance-os/shared";
import type { Budget, Period } from "@finance-os/domain";
import type { BudgetRepository, Clock, IdGenerator, Persistence } from "../ports";

export interface BudgetEntryInput {
  categoryId: Id;
  plannedAmount: Money;
}

export interface GenerateBudgetInput {
  period: Period;
  entries: BudgetEntryInput[];
}

// Fija cuánto se planea gastar por categoría en un período (filosofía YNAB:
// cada peso tiene un propósito). Volver a llamarlo para el mismo período solo
// actualiza los montos planeados, no duplica filas.
export class GenerateBudget {
  constructor(
    private readonly deps: {
      budgets: BudgetRepository;
      persistence: Persistence;
      ids: IdGenerator;
      clock: Clock;
    },
  ) {}

  async execute(input: GenerateBudgetInput): Promise<Budget[]> {
    for (const entry of input.entries) {
      if (entry.plannedAmount < 0) throw new Error("El monto planeado no puede ser negativo");
    }

    const budgets: Budget[] = input.entries.map((entry) => ({
      id: this.deps.ids.generate(),
      period: input.period,
      categoryId: entry.categoryId,
      plannedAmount: entry.plannedAmount,
      createdAt: this.deps.clock.now(),
    }));

    for (const budget of budgets) this.deps.budgets.upsert(budget);
    await this.deps.persistence.save();

    return budgets;
  }
}
