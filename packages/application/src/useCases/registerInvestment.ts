import type { Id, ISODateString, Money } from "@finance-os/shared";
import type { InvestmentEvent } from "@finance-os/domain";
import type { Clock, IdGenerator } from "../ports";
import { persistEvent, type RegisterEventDeps } from "./shared";

export interface RegisterInvestmentInput {
  sourceAccountId: Id;
  destinationAccountId: Id;
  amount: Money;
  date: ISODateString;
  projectId?: Id;
  description?: string;
}

export class RegisterInvestment {
  constructor(
    private readonly deps: RegisterEventDeps & { clock: Clock; ids: IdGenerator },
  ) {}

  async execute(input: RegisterInvestmentInput): Promise<InvestmentEvent> {
    if (input.amount <= 0) throw new Error("El monto debe ser mayor a cero");
    if (input.sourceAccountId === input.destinationAccountId) {
      throw new Error("La cuenta origen y destino no pueden ser la misma");
    }

    const event: InvestmentEvent = {
      id: this.deps.ids.generate(),
      type: "investment",
      date: input.date,
      amount: input.amount,
      sourceAccountId: input.sourceAccountId,
      destinationAccountId: input.destinationAccountId,
      projectId: input.projectId,
      description: input.description,
      createdAt: this.deps.clock.now(),
    };

    await persistEvent(this.deps, event);
    return event;
  }
}
