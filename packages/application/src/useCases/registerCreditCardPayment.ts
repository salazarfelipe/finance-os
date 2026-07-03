import type { Id, ISODateString, Money } from "@finance-os/shared";
import type { CreditCardPaymentEvent } from "@finance-os/domain";
import type { Clock, CreditCardRepository, IdGenerator } from "../ports";
import { persistEvent, type RegisterEventDeps } from "./shared";

export interface RegisterCreditCardPaymentInput {
  creditCardId: Id;
  sourceAccountId: Id;
  amount: Money;
  date: ISODateString;
  description?: string;
}

export class RegisterCreditCardPayment {
  constructor(
    private readonly deps: RegisterEventDeps & {
      clock: Clock;
      ids: IdGenerator;
      creditCards: CreditCardRepository;
    },
  ) {}

  async execute(input: RegisterCreditCardPaymentInput): Promise<CreditCardPaymentEvent> {
    if (input.amount <= 0) throw new Error("El monto debe ser mayor a cero");

    const creditCard = this.deps.creditCards.findById(input.creditCardId);
    if (!creditCard) throw new Error(`No existe la tarjeta ${input.creditCardId}`);
    if (creditCard.accountId === input.sourceAccountId) {
      throw new Error("La cuenta de pago no puede ser la misma cuenta de la tarjeta");
    }

    const event: CreditCardPaymentEvent = {
      id: this.deps.ids.generate(),
      type: "credit_card_payment",
      date: input.date,
      amount: input.amount,
      creditCardId: input.creditCardId,
      sourceAccountId: input.sourceAccountId,
      description: input.description,
      createdAt: this.deps.clock.now(),
    };

    await persistEvent(this.deps, event, { creditCardAccountId: creditCard.accountId });
    return event;
  }
}
