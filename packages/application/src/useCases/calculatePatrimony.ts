import type { Id, Money } from "@finance-os/shared";
import type { AccountKind, AccountSubtype } from "@finance-os/domain";
import type { AccountRepository, MovementRepository } from "../ports";

export interface AccountBalance {
  accountId: Id;
  name: string;
  kind: AccountKind;
  subtype: AccountSubtype;
  balance: Money;
}

export interface PatrimonySnapshot {
  totalAssets: Money;
  totalLiabilities: Money;
  netWorth: Money;
  accounts: AccountBalance[];
}

// El indicador principal del sistema (Principio 4): patrimonio = activos - pasivos.
// El saldo de cada cuenta es su openingBalance más la suma de sus movimientos.
export class CalculatePatrimony {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly movements: MovementRepository,
  ) {}

  execute(): PatrimonySnapshot {
    const accounts = this.accounts.findAll();
    const movements = this.movements.findAll();

    const balances = new Map<Id, Money>();
    for (const account of accounts) balances.set(account.id, account.openingBalance);
    for (const movement of movements) {
      balances.set(movement.accountId, (balances.get(movement.accountId) ?? 0) + movement.amount);
    }

    let totalAssets = 0;
    let totalLiabilities = 0;
    const accountBalances: AccountBalance[] = accounts.map((account) => {
      const balance = balances.get(account.id) ?? 0;
      if (account.kind === "asset") totalAssets += balance;
      else totalLiabilities += balance;
      return {
        accountId: account.id,
        name: account.name,
        kind: account.kind,
        subtype: account.subtype,
        balance,
      };
    });

    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      accounts: accountBalances,
    };
  }
}
