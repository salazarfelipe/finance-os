import type { Id, ISODateString, Money } from "@finance-os/shared";
import type { SavingEvent } from "@finance-os/domain";
import type { Clock, IdGenerator } from "../ports";
import { persistEvent, type RegisterEventDeps } from "./shared";

export interface RegisterSavingInput {
  sourceAccountId: Id;
  destinationAccountId: Id;
  amount: Money;
  date: ISODateString;
  reserveId?: Id;
  description?: string;
}

// Un ahorro es una transferencia con propósito: mueve dinero "para algo"
// (Reserve), a diferencia de TransferMoney que no lo etiqueta.
export class RegisterSaving {
  constructor(
    private readonly deps: RegisterEventDeps & { clock: Clock; ids: IdGenerator },
  ) {}

  async execute(input: RegisterSavingInput): Promise<SavingEvent> {
    if (input.amount <= 0) throw new Error("El monto debe ser mayor a cero");
    if (input.sourceAccountId === input.destinationAccountId) {
      throw new Error("La cuenta origen y destino no pueden ser la misma");
    }

    const event: SavingEvent = {
      id: this.deps.ids.generate(),
      type: "saving",
      date: input.date,
      amount: input.amount,
      sourceAccountId: input.sourceAccountId,
      destinationAccountId: input.destinationAccountId,
      reserveId: input.reserveId,
      description: input.description,
      createdAt: this.deps.clock.now(),
    };

    await persistEvent(this.deps, event);
    return event;
  }
}
