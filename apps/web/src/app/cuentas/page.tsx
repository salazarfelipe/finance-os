"use client";

import { useMemo, useState } from "react";
import { CalculatePatrimony } from "@finance-os/application";
import { useFinanceStore } from "@/store/useFinanceStore";
import { formatMoney } from "@/lib/money";
import { NewAccountModal } from "@/components/NewAccountModal";
import { ImportAccountsModal } from "@/components/ImportAccountsModal";
import { NewCreditModal } from "@/components/NewCreditModal";
import { NewCreditCardModal } from "@/components/NewCreditCardModal";

type OpenModal = "account" | "import" | "credit" | "card" | null;

export default function CuentasPage() {
  const app = useFinanceStore((state) => state.app);
  const version = useFinanceStore((state) => state.version);
  const [openModal, setOpenModal] = useState<OpenModal>(null);

  // version fuerza a releer después de cada mutación.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const accounts = useMemo(() => app?.accounts.findAll() ?? [], [app, version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const credits = useMemo(() => app?.credits.findAll() ?? [], [app, version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const creditCards = useMemo(() => app?.creditCards.findAll() ?? [], [app, version]);
  // El saldo real es openingBalance + movimientos, no el campo estático de la cuenta.
  // version fuerza a recalcular después de cada mutación.
  const balanceByAccountId = useMemo(() => {
    if (!app) return new Map<string, number>();
    const patrimony = new CalculatePatrimony(app.accounts, app.movements).execute();
    return new Map(patrimony.accounts.map((account) => [account.accountId, account.balance]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app, version]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Cuentas</h1>
          <p className="text-sm text-zinc-500">
            Tus cuentas y saldos viven solo en este navegador (IndexedDB), nunca en el código.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setOpenModal("import")}
            className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium dark:border-zinc-700"
          >
            Importar JSON
          </button>
          <button
            type="button"
            onClick={() => setOpenModal("account")}
            className="rounded bg-black px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            + Nueva cuenta
          </button>
        </div>
      </div>

      <ul className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {accounts.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-zinc-500">
            Todavía no has creado ninguna cuenta.
          </li>
        )}
        {accounts.map((account) => (
          <li key={account.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{account.name}</p>
              <p className="text-zinc-500">
                {account.kind === "asset" ? "Activo" : "Pasivo"} · {account.institution ?? "—"}
              </p>
            </div>
            <p className="font-mono">
              {formatMoney(balanceByAccountId.get(account.id) ?? account.openingBalance)}
            </p>
          </li>
        ))}
      </ul>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Créditos y tarjetas</h2>
          <p className="text-sm text-zinc-500">
            Registrar el crédito o la tarjeta (con su cuota/cupo) es lo que permite usar
            &ldquo;Pago de crédito&rdquo; y &ldquo;Pago de tarjeta&rdquo; en &ldquo;+ Registrar
            movimiento&rdquo;. El saldo sigue viviendo en la cuenta pasiva asociada.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setOpenModal("credit")}
            className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium dark:border-zinc-700"
          >
            + Crédito
          </button>
          <button
            type="button"
            onClick={() => setOpenModal("card")}
            className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium dark:border-zinc-700"
          >
            + Tarjeta
          </button>
        </div>
      </div>

      <ul className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {credits.length === 0 && creditCards.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-zinc-500">
            Todavía no has registrado ningún crédito ni tarjeta.
          </li>
        )}
        {credits.map((credit) => (
          <li key={credit.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{credit.name}</p>
              <p className="text-zinc-500">
                Cuota {formatMoney(credit.monthlyPayment)} · {credit.termMonths} meses desde{" "}
                {credit.startDate}
              </p>
            </div>
            <p className="font-mono">{formatMoney(credit.principalAmount)}</p>
          </li>
        ))}
        {creditCards.map((creditCard) => (
          <li key={creditCard.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{creditCard.name}</p>
              <p className="text-zinc-500">
                {creditCard.closingDay ? `Corte día ${creditCard.closingDay}` : "Sin corte"} ·{" "}
                {creditCard.dueDay ? `Pago día ${creditCard.dueDay}` : "Sin fecha de pago"}
              </p>
            </div>
            <p className="font-mono">
              {creditCard.creditLimit ? formatMoney(creditCard.creditLimit) : "—"}
            </p>
          </li>
        ))}
      </ul>

      {openModal === "account" && <NewAccountModal onClose={() => setOpenModal(null)} />}
      {openModal === "import" && <ImportAccountsModal onClose={() => setOpenModal(null)} />}
      {openModal === "credit" && <NewCreditModal onClose={() => setOpenModal(null)} />}
      {openModal === "card" && <NewCreditCardModal onClose={() => setOpenModal(null)} />}
    </div>
  );
}
