import type { Id, ISODateString, Money } from "@finance-os/shared";
import type { EventRepository, GoalRepository } from "../ports";

export interface GoalProgress {
  goalId: Id;
  name: string;
  targetAmount: Money;
  currentAmount: Money;
  remaining: Money;
  percentage: number;
  targetDate?: ISODateString;
}

// Responde "¿cuánto me falta para X?": suma los eventos de ahorro (saving)
// etiquetados con la reserva de la meta y los compara contra targetAmount.
export class CalculateGoalProgress {
  constructor(
    private readonly goals: GoalRepository,
    private readonly events: EventRepository,
  ) {}

  execute(): GoalProgress[] {
    const goals = this.goals.findAll();
    const savingEvents = this.events.findAll().filter((event) => event.type === "saving");

    return goals.map((goal) => {
      const currentAmount = goal.reserveId
        ? savingEvents
            .filter((event) => event.reserveId === goal.reserveId)
            .reduce((sum, event) => sum + event.amount, 0)
        : 0;

      return {
        goalId: goal.id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount,
        remaining: Math.max(goal.targetAmount - currentAmount, 0),
        percentage: goal.targetAmount === 0 ? 0 : Math.min(currentAmount / goal.targetAmount, 1),
        targetDate: goal.targetDate,
      };
    });
  }
}
