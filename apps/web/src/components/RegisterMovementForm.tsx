"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  RegisterCreditCardPayment,
  RegisterCreditPayment,
  RegisterExpense,
  RegisterIncome,
  RegisterInvestment,
  RegisterSaving,
  TransferMoney,
} from "@finance-os/application";
import { useFinanceStore } from "@/store/useFinanceStore";
import { registerEventDeps } from "@/lib/financeApp";

type MovementType =
  | "expense"
  | "income"
  | "transfer"
  | "saving"
  | "investment"
  | "credit_payment"
  | "credit_card_payment";

const TYPE_LABELS: Record<MovementType, string> = {
  expense: "Gasto",
  income: "Ingreso",
  transfer: "Transferencia",
  saving: "Ahorro",
  investment: "Inversión",
  credit_payment: "Pago crédito",
  credit_card_payment: "Pago tarjeta",
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RegisterMovementForm({ onClose }: { onClose: () => void }) {
  const app = useFinanceStore((state) => state.app);
  const refresh = useFinanceStore((state) => state.refresh);

  const accounts = useMemo(() => app?.accounts.findAll() ?? [], [app]);
  const categories = useMemo(() => app?.categories.findAll() ?? [], [app]);
  const reserves = useMemo(() => app?.reserves.findAll() ?? [], [app]);
  const credits = useMemo(() => app?.credits.findAll() ?? [], [app]);
  const creditCards = useMemo(() => app?.creditCards.findAll() ?? [], [app]);

  const [type, setType] = useState<MovementType>("expense");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [destinationAccountId, setDestinationAccountId] = useState(accounts[1]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [reserveId, setReserveId] = useState("");
  const [creditId, setCreditId] = useState("");
  const [creditCardId, setCreditCardId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const needsDestination = type === "transfer" || type === "saving" || type === "investment";
  const isCreditPayment = type === "credit_payment" || type === "credit_card_payment";
  const categoriesForType = categories.filter(
    (category) => type === "income" ? category.kind === "income" : category.kind === "expense",
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!app) return;

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("El monto debe ser mayor a cero");
      return;
    }
    if (!accountId) {
      setError("Selecciona una cuenta");
      return;
    }

    setSubmitting(true);
    setError(undefined);
    try {
      const deps = registerEventDeps(app);

      if (type === "expense") {
        await new RegisterExpense(deps).execute({
          accountId,
          amount: parsedAmount,
          date,
          categoryId: categoryId || undefined,
          description: description || undefined,
        });
      } else if (type === "income") {
        await new RegisterIncome(deps).execute({
          accountId,
          amount: parsedAmount,
          date,
          categoryId: categoryId || undefined,
          description: description || undefined,
        });
      } else if (type === "transfer") {
        if (!destinationAccountId || destinationAccountId === accountId) {
          throw new Error("Selecciona una cuenta destino distinta a la de origen");
        }
        await new TransferMoney(deps).execute({
          sourceAccountId: accountId,
          destinationAccountId,
          amount: parsedAmount,
          date,
          description: description || undefined,
        });
      } else if (type === "saving") {
        if (!destinationAccountId || destinationAccountId === accountId) {
          throw new Error("Selecciona una cuenta destino distinta a la de origen");
        }
        await new RegisterSaving(deps).execute({
          sourceAccountId: accountId,
          destinationAccountId,
          amount: parsedAmount,
          date,
          reserveId: reserveId || undefined,
          description: description || undefined,
        });
      } else if (type === "investment") {
        if (!destinationAccountId || destinationAccountId === accountId) {
          throw new Error("Selecciona una cuenta destino distinta a la de origen");
        }
        await new RegisterInvestment(deps).execute({
          sourceAccountId: accountId,
          destinationAccountId,
          amount: parsedAmount,
          date,
          description: description || undefined,
        });
      } else if (type === "credit_payment") {
        if (!creditId) throw new Error("Selecciona el crédito a pagar");
        await new RegisterCreditPayment({ ...deps, credits: app.credits }).execute({
          creditId,
          sourceAccountId: accountId,
          amount: parsedAmount,
          date,
          description: description || undefined,
        });
      } else {
        if (!creditCardId) throw new Error("Selecciona la tarjeta a pagar");
        await new RegisterCreditCardPayment({ ...deps, creditCards: app.creditCards }).execute({
          creditCardId,
          sourceAccountId: accountId,
          amount: parsedAmount,
          date,
          description: description || undefined,
        });
      }

      refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-3 rounded-lg bg-white p-6 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Registrar movimiento</h2>
          <button type="button" onClick={onClose} className="text-sm text-zinc-500">
            Cerrar
          </button>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          {(
            [
              "expense",
              "income",
              "transfer",
              "saving",
              "investment",
              "credit_payment",
              "credit_card_payment",
            ] as const
          ).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setType(option)}
              className={`rounded px-2 py-1 ${
                type === option
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "border border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {TYPE_LABELS[option]}
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-1 text-sm">
          {needsDestination ? "Cuenta origen" : isCreditPayment ? "Cuenta de pago" : "Cuenta"}
          <select
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
          >
            <option value="" disabled>
              Selecciona una cuenta
            </option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        {needsDestination && (
          <label className="flex flex-col gap-1 text-sm">
            Cuenta destino
            <select
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={destinationAccountId}
              onChange={(event) => setDestinationAccountId(event.target.value)}
            >
              <option value="" disabled>
                Selecciona una cuenta
              </option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {type === "saving" && (
          <label className="flex flex-col gap-1 text-sm">
            Reserva (opcional)
            <select
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={reserveId}
              onChange={(event) => setReserveId(event.target.value)}
            >
              <option value="">Sin reserva</option>
              {reserves.map((reserve) => (
                <option key={reserve.id} value={reserve.id}>
                  {reserve.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {type === "credit_payment" && (
          <label className="flex flex-col gap-1 text-sm">
            Crédito
            <select
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={creditId}
              onChange={(event) => setCreditId(event.target.value)}
            >
              <option value="" disabled>
                Selecciona un crédito
              </option>
              {credits.map((credit) => (
                <option key={credit.id} value={credit.id}>
                  {credit.name}
                </option>
              ))}
            </select>
            {credits.length === 0 && (
              <span className="text-xs text-zinc-500">
                Primero registra el crédito en la sección Cuentas.
              </span>
            )}
          </label>
        )}

        {type === "credit_card_payment" && (
          <label className="flex flex-col gap-1 text-sm">
            Tarjeta
            <select
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={creditCardId}
              onChange={(event) => setCreditCardId(event.target.value)}
            >
              <option value="" disabled>
                Selecciona una tarjeta
              </option>
              {creditCards.map((creditCard) => (
                <option key={creditCard.id} value={creditCard.id}>
                  {creditCard.name}
                </option>
              ))}
            </select>
            {creditCards.length === 0 && (
              <span className="text-xs text-zinc-500">
                Primero registra la tarjeta en la sección Cuentas.
              </span>
            )}
          </label>
        )}

        {(type === "income" || type === "expense") && (
          <label className="flex flex-col gap-1 text-sm">
            Categoría (opcional)
            <select
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">Sin categoría</option>
              {categoriesForType.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm">
          Monto
          <input
            type="number"
            autoFocus
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Fecha
          <input
            type="date"
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Descripción (opcional)
          <input
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting || accounts.length === 0}
          className="mt-2 rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {submitting ? "Guardando…" : "Registrar"}
        </button>
        {accounts.length === 0 && (
          <p className="text-center text-xs text-zinc-500">
            Primero crea al menos una cuenta en la sección Cuentas.
          </p>
        )}
      </form>
    </div>
  );
}
