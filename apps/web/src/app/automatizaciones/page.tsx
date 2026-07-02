"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CloseMonth, type CloseMonthResult } from "@finance-os/application";
import { nextPeriod } from "@finance-os/domain";
import { useFinanceStore } from "@/store/useFinanceStore";
import { formatMoney } from "@/lib/money";

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function AutomatizacionesPage() {
  const app = useFinanceStore((state) => state.app);
  const version = useFinanceStore((state) => state.version);
  const refresh = useFinanceStore((state) => state.refresh);

  // version fuerza a releer después de cada mutación.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const accounts = useMemo(() => app?.accounts.findAll() ?? [], [app, version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const categories = useMemo(() => app?.categories.findAll() ?? [], [app, version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recurringExpenses = useMemo(() => app?.recurringExpenses.findAll() ?? [], [app, version]);

  const [name, setName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const [closeSubmitting, setCloseSubmitting] = useState(false);
  const [closeError, setCloseError] = useState<string>();
  const [closeResult, setCloseResult] = useState<CloseMonthResult>();

  const expenseCategories = categories.filter((category) => category.kind === "expense");
  const from = currentPeriod();
  const to = nextPeriod(from);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!app) return;
    const parsedAmount = Number(amount);
    const parsedDay = Number(dayOfMonth);
    if (!name.trim() || !accountId || !parsedAmount || parsedAmount <= 0) {
      setError("Nombre, cuenta y monto (mayor a cero) son obligatorios");
      return;
    }
    if (!parsedDay || parsedDay < 1 || parsedDay > 28) {
      setError("El día del mes debe estar entre 1 y 28");
      return;
    }

    setSubmitting(true);
    setError(undefined);
    try {
      app.recurringExpenses.insert({
        id: app.ids.generate(),
        name: name.trim(),
        accountId,
        categoryId: categoryId || undefined,
        amount: parsedAmount,
        dayOfMonth: parsedDay,
        isActive: true,
        createdAt: app.clock.now(),
      });
      await app.db.save();
      refresh();
      setName("");
      setAmount("");
      setDayOfMonth("1");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCloseMonth() {
    if (!app) return;
    setCloseSubmitting(true);
    setCloseError(undefined);
    setCloseResult(undefined);
    try {
      const result = await new CloseMonth({
        events: app.events,
        movements: app.movements,
        persistence: app.db,
        ids: app.ids,
        clock: app.clock,
        recurringExpenses: app.recurringExpenses,
        budgets: app.budgets,
      }).execute(from, to);
      refresh();
      setCloseResult(result);
    } catch (err) {
      setCloseError(err instanceof Error ? err.message : String(err));
    } finally {
      setCloseSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold">Automatizaciones</h1>
        <p className="text-sm text-zinc-500">
          Define tus gastos fijos una vez; cerrar el mes los genera solos y copia el presupuesto
          planeado al mes siguiente.
        </p>
      </div>

      <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-medium">Cerrar mes</h2>
        <p className="text-xs text-zinc-500">
          {from} → {to}
        </p>
        <button
          type="button"
          onClick={handleCloseMonth}
          disabled={closeSubmitting}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {closeSubmitting ? "Cerrando…" : `Cerrar ${from} → generar ${to}`}
        </button>
        {closeError && <p className="text-sm text-red-500">{closeError}</p>}
        {closeResult && (
          <p className="text-sm text-green-600">
            {closeResult.recurringExpenses.created.length} gasto(s) generado(s),{" "}
            {closeResult.recurringExpenses.skipped} ya existían, {closeResult.budgetsCopied}{" "}
            categoría(s) de presupuesto copiadas a {closeResult.toPeriod}.
          </p>
        )}
      </section>

      <ul className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {recurringExpenses.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-zinc-500">
            Todavía no has creado ningún gasto recurrente.
          </li>
        )}
        {recurringExpenses.map((recurringExpense) => (
          <li
            key={recurringExpense.id}
            className="flex items-center justify-between px-4 py-3 text-sm"
          >
            <div>
              <p className="font-medium">{recurringExpense.name}</p>
              <p className="text-zinc-500">Día {recurringExpense.dayOfMonth} de cada mes</p>
            </div>
            <p className="font-mono">{formatMoney(recurringExpense.amount)}</p>
          </li>
        ))}
      </ul>

      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <h2 className="text-sm font-medium">Nuevo gasto recurrente</h2>

        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <input
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Arriendo"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Cuenta
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

        <label className="flex flex-col gap-1 text-sm">
          Categoría (opcional)
          <select
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">Sin categoría</option>
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Monto
            <input
              type="number"
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
            />
          </label>

          <label className="flex flex-1 flex-col gap-1 text-sm">
            Día del mes
            <input
              type="number"
              min={1}
              max={28}
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={dayOfMonth}
              onChange={(event) => setDayOfMonth(event.target.value)}
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting || accounts.length === 0}
          className="mt-2 rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {submitting ? "Guardando…" : "Crear gasto recurrente"}
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
