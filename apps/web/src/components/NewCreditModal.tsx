"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useFinanceStore } from "@/store/useFinanceStore";
import { Modal } from "@/components/Modal";

export function NewCreditModal({ onClose }: { onClose: () => void }) {
  const app = useFinanceStore((state) => state.app);
  const refresh = useFinanceStore((state) => state.refresh);

  const creditAccounts = useMemo(
    () =>
      (app?.accounts.findAll() ?? []).filter(
        (account) => account.kind === "liability" && account.subtype === "credit",
      ),
    [app],
  );

  const [name, setName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [principal, setPrincipal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [termMonths, setTermMonths] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!app) return;
    const parsedPrincipal = Number(principal);
    const parsedTerm = Number(termMonths);
    const parsedMonthlyPayment = Number(monthlyPayment);
    if (
      !name.trim() ||
      !accountId ||
      !startDate ||
      !parsedPrincipal ||
      !parsedTerm ||
      !parsedMonthlyPayment
    ) {
      setError("Todos los campos son obligatorios");
      return;
    }

    setSubmitting(true);
    setError(undefined);
    setMessage(undefined);
    try {
      app.credits.insert({
        id: app.ids.generate(),
        name: name.trim(),
        accountId,
        principalAmount: parsedPrincipal,
        startDate,
        termMonths: parsedTerm,
        monthlyPayment: parsedMonthlyPayment,
        createdAt: app.clock.now(),
      });
      await app.db.save();
      refresh();
      setMessage(`"${name.trim()}" creado.`);
      setName("");
      setAccountId("");
      setPrincipal("");
      setStartDate("");
      setTermMonths("");
      setMonthlyPayment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Nuevo crédito" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <input
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Crédito Comfamiliar"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Cuenta (pasivo · crédito)
          <select
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
          >
            <option value="" disabled>
              Selecciona una cuenta
            </option>
            {creditAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Monto inicial
            <input
              type="number"
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={principal}
              onChange={(event) => setPrincipal(event.target.value)}
              placeholder="0"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Fecha de inicio
            <input
              type="date"
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>
        </div>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Plazo (meses)
            <input
              type="number"
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={termMonths}
              onChange={(event) => setTermMonths(event.target.value)}
              placeholder="60"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Cuota mensual
            <input
              type="number"
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={monthlyPayment}
              onChange={(event) => setMonthlyPayment(event.target.value)}
              placeholder="0"
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}

        <button
          type="submit"
          disabled={submitting || creditAccounts.length === 0}
          className="mt-2 rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {submitting ? "Guardando…" : "Crear crédito"}
        </button>
        {creditAccounts.length === 0 && (
          <p className="text-center text-xs text-zinc-500">
            Primero crea una cuenta pasiva de tipo &ldquo;Crédito&rdquo;.
          </p>
        )}
      </form>
    </Modal>
  );
}
