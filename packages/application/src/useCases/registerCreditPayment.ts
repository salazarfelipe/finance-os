import type { Id, ISODateString, Money } from "@finance-os/shared";
import type { CreditPaymentEvent } from "@finance-os/domain";
import type { Clock, CreditRepository, IdGenerator } from "../ports";
import { persistEvent, type RegisterEventDeps } from "./shared";

export interface RegisterCreditPaymentInput {
  creditId: Id;
  sourceAccountId: Id;
  amount: Money;
  date: ISODateString;
  description?: string;
}

export class RegisterCreditPayment {
  constructor(
    private readonly deps: RegisterEventDeps & {
      clock: Clock;
      ids: IdGenerator;
      credits: CreditRepository;
    },
  ) {}

  async execute(input: RegisterCreditPaymentInput): Promise<CreditPaymentEvent> {
    if (input.amount <= 0) throw new Error("El monto debe ser mayor a cero");

    const credit = this.deps.credits.findById(input.creditId);
    if (!credit) throw new Error(`No existe el crédito ${input.creditId}`);
    if (credit.accountId === input.sourceAccountId) {
      throw new Error("La cuenta de pago no puede ser la misma cuenta del crédito");
    }

    const event: CreditPaymentEvent = {
      id: this.deps.ids.generate(),
      type: "credit_payment",
      date: input.date,
      amount: input.amount,
      creditId: input.creditId,
      sourceAccountId: input.sourceAccountId,
      description: input.description,
      createdAt: this.deps.clock.now(),
    };

    await persistEvent(this.deps, event, { creditAccountId: credit.accountId });
    return event;
  }
}
