import type { ExpenseEvent, Period } from "@finance-os/domain";
import type { Clock, IdGenerator, RecurringExpenseRepository } from "../ports";
import { persistEvent, type RegisterEventDeps } from "./shared";

export interface GenerateRecurringExpensesResult {
  created: ExpenseEvent[];
  skipped: number;
}

// Idempotente por período: si ya existe un ExpenseEvent para una plantilla en ese
// período, no lo vuelve a crear (Principio 5: nunca duplicar información).
export class GenerateRecurringExpenses {
  constructor(
    private readonly deps: RegisterEventDeps & {
      clock: Clock;
      ids: IdGenerator;
      recurringExpenses: RecurringExpenseRepository;
    },
  ) {}

  async execute(period: Period): Promise<GenerateRecurringExpensesResult> {
    const templates = this.deps.recurringExpenses.findActive();
    const periodEvents = this.deps.events.findByPeriod(period);
    const alreadyGenerated = new Set(
      periodEvents
        .filter((event): event is ExpenseEvent => event.type === "expense")
        .map((event) => event.recurringExpenseId)
        .filter((id): id is string => id !== undefined),
    );

    const created: ExpenseEvent[] = [];
    let skipped = 0;

    for (const template of templates) {
      if (alreadyGenerated.has(template.id)) {
        skipped += 1;
        continue;
      }

      const day = String(template.dayOfMonth).padStart(2, "0");
      const event: ExpenseEvent = {
        id: this.deps.ids.generate(),
        type: "expense",
        date: `${period}-${day}`,
        amount: template.amount,
        accountId: template.accountId,
        categoryId: template.categoryId,
        recurringExpenseId: template.id,
        description: template.name,
        createdAt: this.deps.clock.now(),
      };

      await persistEvent(this.deps, event);
      created.push(event);
    }

    return { created, skipped };
  }
}
