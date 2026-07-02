import type { Id, ISODateString, Money } from "@finance-os/shared";
import type { TransferEvent } from "@finance-os/domain";
import type { Clock, IdGenerator } from "../ports";
import { persistEvent, type RegisterEventDeps } from "./shared";

export interface TransferMoneyInput {
  sourceAccountId: Id;
  destinationAccountId: Id;
  amount: Money;
  date: ISODateString;
  description?: string;
}

export class TransferMoney {
  constructor(
    private readonly deps: RegisterEventDeps & { clock: Clock; ids: IdGenerator },
  ) {}

  async execute(input: TransferMoneyInput): Promise<TransferEvent> {
    if (input.amount <= 0) throw new Error("El monto debe ser mayor a cero");
    if (input.sourceAccountId === input.destinationAccountId) {
      throw new Error("La cuenta origen y destino no pueden ser la misma");
    }

    const event: TransferEvent = {
      id: this.deps.ids.generate(),
      type: "transfer",
      date: input.date,
      amount: input.amount,
      sourceAccountId: input.sourceAccountId,
      destinationAccountId: input.destinationAccountId,
      description: input.description,
      createdAt: this.deps.clock.now(),
    };

    await persistEvent(this.deps, event);
    return event;
  }
}
