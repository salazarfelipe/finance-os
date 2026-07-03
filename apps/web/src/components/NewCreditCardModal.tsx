"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { CreditCard } from "@finance-os/domain";
import { useFinanceStore } from "@/store/useFinanceStore";
import { Modal } from "@/components/Modal";

export function NewCreditCardModal({
  onClose,
  creditCard,
}: {
  onClose: () => void;
  creditCard?: CreditCard;
}) {
  const app = useFinanceStore((state) => state.app);
  const refresh = useFinanceStore((state) => state.refresh);
  const isEditing = !!creditCard;

  const creditCardAccounts = useMemo(
    () =>
      (app?.accounts.findAll() ?? []).filter(
        (account) => account.kind === "liability" && account.subtype === "credit_card",
      ),
    [app],
  );

  const [name, setName] = useState(creditCard?.name ?? "");
  const [accountId, setAccountId] = useState(creditCard?.accountId ?? "");
  const [creditLimit, setCreditLimit] = useState(String(creditCard?.creditLimit ?? ""));
  const [closingDay, setClosingDay] = useState(String(creditCard?.closingDay ?? ""));
  const [dueDay, setDueDay] = useState(String(creditCard?.dueDay ?? ""));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!app) return;
    if (!name.trim() || !accountId) {
      setError("Nombre y cuenta son obligatorios");
      return;
    }

    setSubmitting(true);
    setError(undefined);
    setMessage(undefined);
    try {
      if (isEditing) {
        app.creditCards.update({
          ...creditCard,
          name: name.trim(),
          accountId,
          creditLimit: creditLimit ? Number(creditLimit) : undefined,
          closingDay: closingDay ? Number(closingDay) : undefined,
          dueDay: dueDay ? Number(dueDay) : undefined,
        });
        await app.db.save();
        refresh();
        onClose();
        return;
      }

      app.creditCards.insert({
        id: app.ids.generate(),
        name: name.trim(),
        accountId,
        creditLimit: creditLimit ? Number(creditLimit) : undefined,
        closingDay: closingDay ? Number(closingDay) : undefined,
        dueDay: dueDay ? Number(dueDay) : undefined,
        createdAt: app.clock.now(),
      });
      await app.db.save();
      refresh();
      setMessage(`"${name.trim()}" creada.`);
      setName("");
      setAccountId("");
      setCreditLimit("");
      setClosingDay("");
      setDueDay("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={isEditing ? "Editar tarjeta" : "Nueva tarjeta"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <input
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Tarjeta Nu"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Cuenta (pasivo · tarjeta de crédito)
          <select
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
          >
            <option value="" disabled>
              Selecciona una cuenta
            </option>
            {creditCardAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Cupo (opcional)
            <input
              type="number"
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={creditLimit}
              onChange={(event) => setCreditLimit(event.target.value)}
              placeholder="0"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Día de corte (opcional)
            <input
              type="number"
              min={1}
              max={31}
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={closingDay}
              onChange={(event) => setClosingDay(event.target.value)}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Día de pago (opcional)
            <input
              type="number"
              min={1}
              max={31}
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={dueDay}
              onChange={(event) => setDueDay(event.target.value)}
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}

        <button
          type="submit"
          disabled={submitting || creditCardAccounts.length === 0}
          className="mt-2 rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {submitting ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear tarjeta"}
        </button>
        {creditCardAccounts.length === 0 && (
          <p className="text-center text-xs text-zinc-500">
            Primero crea una cuenta pasiva de tipo &ldquo;Tarjeta de crédito&rdquo;.
          </p>
        )}
      </form>
    </Modal>
  );
}
