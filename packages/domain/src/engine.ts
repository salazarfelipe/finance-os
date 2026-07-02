import type { Id, Money } from "@finance-os/shared";
import type { Event } from "./event";

export interface MovementDraft {
  accountId: Id;
  amount: Money;
}

export interface MovementContext {
  creditAccountId?: Id;
  creditCardAccountId?: Id;
}

// El motor financiero: traduce un Event (lo único que registra el usuario) en los
// Movement que le corresponden. Convención de signos: un movimiento positivo aumenta
// el saldo de la cuenta en su sentido natural (activo sube, o deuda sube); un movimiento
// negativo lo reduce. Así, pagar una deuda genera dos movimientos negativos (baja el
// efectivo, baja la deuda) y el patrimonio neto no cambia — el dinero solo cambió de
// estado, no desapareció (Principio 1).
export function generateMovements(event: Event, context: MovementContext = {}): MovementDraft[] {
  switch (event.type) {
    case "income":
      return [{ accountId: event.accountId, amount: event.amount }];

    case "expense":
      return [{ accountId: event.accountId, amount: -event.amount }];

    case "transfer":
    case "saving":
    case "investment":
      return [
        { accountId: event.sourceAccountId, amount: -event.amount },
        { accountId: event.destinationAccountId, amount: event.amount },
      ];

    case "credit_payment": {
      if (!context.creditAccountId) {
        throw new Error("Falta resolver la cuenta del crédito para generar los movimientos");
      }
      return [
        { accountId: event.sourceAccountId, amount: -event.amount },
        { accountId: context.creditAccountId, amount: -event.amount },
      ];
    }

    case "credit_card_payment": {
      if (!context.creditCardAccountId) {
        throw new Error("Falta resolver la cuenta de la tarjeta para generar los movimientos");
      }
      return [
        { accountId: event.sourceAccountId, amount: -event.amount },
        { accountId: context.creditCardAccountId, amount: -event.amount },
      ];
    }

    case "interest":
      return [{ accountId: event.accountId, amount: event.amount }];

    default: {
      const exhaustive: never = event;
      throw new Error(`Tipo de evento no soportado: ${JSON.stringify(exhaustive)}`);
    }
  }
}
