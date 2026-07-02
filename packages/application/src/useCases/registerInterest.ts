import type { Id, ISODateString, Money } from "@finance-os/shared";
import type { InterestEvent } from "@finance-os/domain";
import type { Clock, IdGenerator } from "../ports";
import { persistEvent, type RegisterEventDeps } from "./shared";

export interface RegisterInterestInput {
  accountId: Id;
  amount: Money;
  date: ISODateString;
  description?: string;
}

// Sirve tanto para interés ganado (cuenta de ahorro/inversión) como para
// interés cobrado sobre una deuda: en ambos casos el movimiento es positivo,
// porque "positivo" significa "crece en su sentido natural" para esa cuenta.
export class RegisterInterest {
  constructor(
    private readonly deps: RegisterEventDeps & { clock: Clock; ids: IdGenerator },
  ) {}

  async execute(input: RegisterInterestInput): Promise<InterestEvent> {
    if (input.amount <= 0) throw new Error("El monto debe ser mayor a cero");

    const event: InterestEvent = {
      id: this.deps.ids.generate(),
      type: "interest",
      date: input.date,
      amount: input.amount,
      accountId: input.accountId,
      description: input.description,
      createdAt: this.deps.clock.now(),
    };

    await persistEvent(this.deps, event);
    return event;
  }
}
