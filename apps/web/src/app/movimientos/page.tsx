"use client";

import { useMemo, useState } from "react";
import type { Event, EventType } from "@finance-os/domain";
import { useFinanceStore } from "@/store/useFinanceStore";
import { formatMoney } from "@/lib/money";
import { RegisterMovementForm } from "@/components/RegisterMovementForm";

const TYPE_LABELS: Record<EventType, string> = {
  income: "Ingreso",
  expense: "Gasto",
  transfer: "Transferencia",
  saving: "Ahorro",
  investment: "Inversión",
  credit_payment: "Pago crédito",
  credit_card_payment: "Pago tarjeta",
  interest: "Interés",
};

export default function MovimientosPage() {
  const app = useFinanceStore((state) => state.app);
  const version = useFinanceStore((state) => state.version);
  const refresh = useFinanceStore((state) => state.refresh);
  const [showForm, setShowForm] = useState(false);

  // version fuerza a releer después de cada mutación.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const accounts = useMemo(() => app?.accounts.findAll() ?? [], [app, version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const categories = useMemo(() => app?.categories.findAll() ?? [], [app, version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const credits = useMemo(() => app?.credits.findAll() ?? [], [app, version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const creditCards = useMemo(() => app?.creditCards.findAll() ?? [], [app, version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const events = useMemo(() => [...(app?.events.findAll() ?? [])].reverse(), [app, version]);

  const accountName = (id?: string) => accounts.find((account) => account.id === id)?.name ?? "—";
  const categoryName = (id?: string) => categories.find((category) => category.id === id)?.name;
  const creditName = (id?: string) => credits.find((credit) => credit.id === id)?.name;
  const creditCardName = (id?: string) =>
    creditCards.find((creditCard) => creditCard.id === id)?.name;

  function describeEvent(event: Event): { accountText: string; detail?: string } {
    switch (event.type) {
      case "income":
      case "expense":
        return {
          accountText: accountName(event.accountId),
          detail: categoryName(event.categoryId),
        };
      case "transfer":
      case "saving":
      case "investment":
        return {
          accountText: `${accountName(event.sourceAccountId)} → ${accountName(event.destinationAccountId)}`,
        };
      case "credit_payment":
        return {
          accountText: accountName(event.sourceAccountId),
          detail: creditName(event.creditId),
        };
      case "credit_card_payment":
        return {
          accountText: accountName(event.sourceAccountId),
          detail: creditCardName(event.creditCardId),
        };
      case "interest":
        return { accountText: accountName(event.accountId) };
    }
  }

  async function handleDelete(eventId: string) {
    if (!app) return;
    const proceed = window.confirm(
      "¿Eliminar este movimiento? Esto también revierte su efecto en el saldo de las cuentas.",
    );
    if (!proceed) return;

    app.movements.deleteByEventId(eventId);
    app.events.delete(eventId);
    await app.db.save();
    refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Movimientos</h1>
          <p className="text-sm text-zinc-500">Historial de todo lo que has registrado.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          + Registrar movimiento
        </button>
      </div>

      <ul className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {events.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-zinc-500">
            Todavía no has registrado ningún movimiento.
          </li>
        )}
        {events.map((event) => {
          const { accountText, detail } = describeEvent(event);
          return (
            <li key={event.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{event.description || TYPE_LABELS[event.type]}</p>
                <p className="text-zinc-500">
                  {event.date} · {TYPE_LABELS[event.type]} · {accountText}
                  {detail ? ` · ${detail}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-mono">{formatMoney(event.amount)}</p>
                <button
                  type="button"
                  onClick={() => handleDelete(event.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {showForm && <RegisterMovementForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
