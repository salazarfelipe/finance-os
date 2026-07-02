import type { Id, Money } from "@finance-os/shared";
import type { Period } from "@finance-os/domain";
import type {
  AccountRepository,
  BudgetRepository,
  CategoryRepository,
  CreditRepository,
  EventRepository,
  GoalRepository,
  MovementRepository,
} from "../ports";
import { CalculatePatrimony, type PatrimonySnapshot } from "./calculatePatrimony";
import { CalculateCashFlow, type CashFlow } from "./calculateCashFlow";
import { CalculateBudgetProgress, type BudgetProgress } from "./calculateBudgetProgress";
import { CalculateGoalProgress, type GoalProgress } from "./calculateGoalProgress";

export interface CreditPaidSummary {
  creditId: Id;
  name: string;
  paidAmount: Money;
}

export interface DashboardSnapshot {
  period: Period;
  patrimony: PatrimonySnapshot;
  liquidity: Money;
  cashFlow: CashFlow;
  savingsRate: number;
  budgetProgress: BudgetProgress;
  creditsPaid: CreditPaidSummary[];
  goalsProgress: GoalProgress[];
}

// Agrega los demás casos de uso en una sola foto para la pantalla principal.
export class GenerateDashboard {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly movements: MovementRepository,
    private readonly events: EventRepository,
    private readonly categories: CategoryRepository,
    private readonly budgets: BudgetRepository,
    private readonly credits: CreditRepository,
    private readonly goals: GoalRepository,
  ) {}

  execute(period: Period): DashboardSnapshot {
    const patrimony = new CalculatePatrimony(this.accounts, this.movements).execute();
    const cashFlow = new CalculateCashFlow(this.events).execute(period);
    const budgetProgress = new CalculateBudgetProgress(
      this.budgets,
      this.categories,
      this.events,
    ).execute(period);
    const goalsProgress = new CalculateGoalProgress(this.goals, this.events).execute();

    const liquidity = patrimony.accounts
      .filter((account) => account.subtype === "bank" || account.subtype === "cash")
      .reduce((sum, account) => sum + account.balance, 0);

    const savingsRate =
      cashFlow.totalIncome === 0 ? 0 : Math.max(cashFlow.net, 0) / cashFlow.totalIncome;

    const paidByCredit = new Map<Id, Money>();
    for (const event of this.events.findAll()) {
      if (event.type !== "credit_payment") continue;
      paidByCredit.set(event.creditId, (paidByCredit.get(event.creditId) ?? 0) + event.amount);
    }
    const creditsPaid: CreditPaidSummary[] = Array.from(paidByCredit.entries()).map(
      ([creditId, paidAmount]) => ({
        creditId,
        name: this.credits.findById(creditId)?.name ?? "Crédito",
        paidAmount,
      }),
    );

    return {
      period,
      patrimony,
      liquidity,
      cashFlow,
      savingsRate,
      budgetProgress,
      creditsPaid,
      goalsProgress,
    };
  }
}
