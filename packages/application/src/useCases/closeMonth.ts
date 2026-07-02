import type { Period } from "@finance-os/domain";
import type { BudgetRepository, Clock, IdGenerator, RecurringExpenseRepository } from "../ports";
import { type RegisterEventDeps } from "./shared";
import {
  GenerateRecurringExpenses,
  type GenerateRecurringExpensesResult,
} from "./generateRecurringExpenses";

export interface CloseMonthResult {
  fromPeriod: Period;
  toPeriod: Period;
  recurringExpenses: GenerateRecurringExpensesResult;
  budgetsCopied: number;
}

// Cerrar el mes automatiza dos cosas que si no, el usuario tendría que rehacer a mano
// cada período: genera los gastos fijos del mes nuevo y copia el presupuesto planeado.
export class CloseMonth {
  constructor(
    private readonly deps: RegisterEventDeps & {
      clock: Clock;
      ids: IdGenerator;
      recurringExpenses: RecurringExpenseRepository;
      budgets: BudgetRepository;
    },
  ) {}

  async execute(fromPeriod: Period, toPeriod: Period): Promise<CloseMonthResult> {
    const recurringExpenses = await new GenerateRecurringExpenses(this.deps).execute(toPeriod);

    const currentBudgets = this.deps.budgets.findByPeriod(fromPeriod);
    for (const budget of currentBudgets) {
      this.deps.budgets.upsert({
        id: this.deps.ids.generate(),
        period: toPeriod,
        categoryId: budget.categoryId,
        plannedAmount: budget.plannedAmount,
        createdAt: this.deps.clock.now(),
      });
    }
    if (currentBudgets.length > 0) {
      await this.deps.persistence.save();
    }

    return {
      fromPeriod,
      toPeriod,
      recurringExpenses,
      budgetsCopied: currentBudgets.length,
    };
  }
}
