import type { Id, ISODateString, Money } from "@finance-os/shared";
import type { ExpenseEvent } from "@finance-os/domain";
import type { Clock, IdGenerator } from "../ports";
import { persistEvent, type RegisterEventDeps } from "./shared";

export interface RegisterExpenseInput {
  accountId: Id;
  amount: Money;
  date: ISODateString;
  categoryId?: Id;
  personId?: Id;
  description?: string;
}

export class RegisterExpense {
  constructor(
    private readonly deps: RegisterEventDeps & { clock: Clock; ids: IdGenerator },
  ) {}

  async execute(input: RegisterExpenseInput): Promise<ExpenseEvent> {
    if (input.amount <= 0) throw new Error("El monto debe ser mayor a cero");

    const event: ExpenseEvent = {
      id: this.deps.ids.generate(),
      type: "expense",
      date: input.date,
      amount: input.amount,
      accountId: input.accountId,
      categoryId: input.categoryId,
      personId: input.personId,
      description: input.description,
      createdAt: this.deps.clock.now(),
    };

    await persistEvent(this.deps, event);
    return event;
  }
}
