import type { Id, ISODateString, Money } from "@finance-os/shared";
import type { IncomeEvent } from "@finance-os/domain";
import type { Clock, IdGenerator } from "../ports";
import { persistEvent, type RegisterEventDeps } from "./shared";

export interface RegisterIncomeInput {
  accountId: Id;
  amount: Money;
  date: ISODateString;
  categoryId?: Id;
  personId?: Id;
  description?: string;
}

// También cubre ReceiveSalary: la UI simplemente precarga accountId/categoryId
// para el salario y llama a este mismo caso de uso.
export class RegisterIncome {
  constructor(
    private readonly deps: RegisterEventDeps & { clock: Clock; ids: IdGenerator },
  ) {}

  async execute(input: RegisterIncomeInput): Promise<IncomeEvent> {
    if (input.amount <= 0) throw new Error("El monto debe ser mayor a cero");

    const event: IncomeEvent = {
      id: this.deps.ids.generate(),
      type: "income",
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
