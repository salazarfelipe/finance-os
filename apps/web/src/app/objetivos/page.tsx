"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CalculateGoalProgress } from "@finance-os/application";
import { useFinanceStore } from "@/store/useFinanceStore";
import { formatMoney, formatPercentage } from "@/lib/money";

export default function ObjetivosPage() {
  const app = useFinanceStore((state) => state.app);
  const version = useFinanceStore((state) => state.version);
  const refresh = useFinanceStore((state) => state.refresh);

  // version fuerza a releer después de cada mutación.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const accounts = useMemo(() => app?.accounts.findAll() ?? [], [app, version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reserves = useMemo(() => app?.reserves.findAll() ?? [], [app, version]);
  const goalsProgress = useMemo(
    () => (app ? new CalculateGoalProgress(app.goals, app.events).execute() : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [app, version],
  );

  const [reserveName, setReserveName] = useState("");
  const [reserveAccountId, setReserveAccountId] = useState("");
  const [reserveTarget, setReserveTarget] = useState("");
  const [reserveSubmitting, setReserveSubmitting] = useState(false);
  const [reserveError, setReserveError] = useState<string>();

  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [goalReserveId, setGoalReserveId] = useState("");
  const [goalSubmitting, setGoalSubmitting] = useState(false);
  const [goalError, setGoalError] = useState<string>();

  async function handleCreateReserve(event: FormEvent) {
    event.preventDefault();
    if (!app) return;
    if (!reserveName.trim() || !reserveAccountId) {
      setReserveError("Nombre y cuenta son obligatorios");
      return;
    }

    setReserveSubmitting(true);
    setReserveError(undefined);
    try {
      app.reserves.insert({
        id: app.ids.generate(),
        name: reserveName.trim(),
        accountId: reserveAccountId,
        targetAmount: reserveTarget ? Number(reserveTarget) : undefined,
        createdAt: app.clock.now(),
      });
      await app.db.save();
      refresh();
      setReserveName("");
      setReserveTarget("");
    } catch (err) {
      setReserveError(err instanceof Error ? err.message : String(err));
    } finally {
      setReserveSubmitting(false);
    }
  }

  async function handleCreateGoal(event: FormEvent) {
    event.preventDefault();
    if (!app) return;
    const target = Number(goalTarget);
    if (!goalName.trim() || !target || target <= 0) {
      setGoalError("Nombre y monto objetivo (mayor a cero) son obligatorios");
      return;
    }

    setGoalSubmitting(true);
    setGoalError(undefined);
    try {
      app.goals.insert({
        id: app.ids.generate(),
        name: goalName.trim(),
        targetAmount: target,
        targetDate: goalDate || undefined,
        reserveId: goalReserveId || undefined,
        status: "active",
        createdAt: app.clock.now(),
      });
      await app.db.save();
      refresh();
      setGoalName("");
      setGoalTarget("");
      setGoalDate("");
    } catch (err) {
      setGoalError(err instanceof Error ? err.message : String(err));
    } finally {
      setGoalSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold">Objetivos</h1>
        <p className="text-sm text-zinc-500">
          Una reserva dice dónde vive el dinero; una meta dice cuánto necesitas y para cuándo.
        </p>
      </div>

      {goalsProgress.length > 0 && (
        <ul className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          {goalsProgress.map((goal) => (
            <li key={goal.goalId} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{goal.name}</span>
                <span className="text-zinc-500">
                  {formatMoney(goal.currentAmount)} / {formatMoney(goal.targetAmount)} (
                  {formatPercentage(goal.percentage)})
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
                <div
                  className="h-full bg-green-600"
                  style={{ width: `${goal.percentage * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleCreateReserve}
        className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <h2 className="text-sm font-medium">Nueva reserva</h2>
        <p className="text-xs text-zinc-500">
          Ej. &ldquo;Fondo de emergencia&rdquo;, asociada a la cuenta donde guardas ese dinero.
        </p>

        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <input
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={reserveName}
            onChange={(event) => setReserveName(event.target.value)}
            placeholder="Fondo de emergencia"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Cuenta donde vive el dinero
          <select
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={reserveAccountId}
            onChange={(event) => setReserveAccountId(event.target.value)}
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
          Monto objetivo (opcional)
          <input
            type="number"
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={reserveTarget}
            onChange={(event) => setReserveTarget(event.target.value)}
            placeholder="0"
          />
        </label>

        {reserveError && <p className="text-sm text-red-500">{reserveError}</p>}

        <button
          type="submit"
          disabled={reserveSubmitting || accounts.length === 0}
          className="mt-2 rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {reserveSubmitting ? "Guardando…" : "Crear reserva"}
        </button>
        {accounts.length === 0 && (
          <p className="text-center text-xs text-zinc-500">
            Primero crea al menos una cuenta en la sección Cuentas.
          </p>
        )}
      </form>

      <form
        onSubmit={handleCreateGoal}
        className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <h2 className="text-sm font-medium">Nueva meta</h2>
        <p className="text-xs text-zinc-500">
          El avance se calcula sumando lo que registres como &ldquo;Ahorro&rdquo; hacia la reserva
          asociada.
        </p>

        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <input
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={goalName}
            onChange={(event) => setGoalName(event.target.value)}
            placeholder="Fondo de emergencia (6 meses de gastos)"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Monto objetivo
          <input
            type="number"
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={goalTarget}
            onChange={(event) => setGoalTarget(event.target.value)}
            placeholder="0"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Fecha objetivo (opcional)
          <input
            type="date"
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={goalDate}
            onChange={(event) => setGoalDate(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Reserva asociada (opcional)
          <select
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={goalReserveId}
            onChange={(event) => setGoalReserveId(event.target.value)}
          >
            <option value="">Sin reserva</option>
            {reserves.map((reserve) => (
              <option key={reserve.id} value={reserve.id}>
                {reserve.name}
              </option>
            ))}
          </select>
        </label>

        {goalError && <p className="text-sm text-red-500">{goalError}</p>}

        <button
          type="submit"
          disabled={goalSubmitting}
          className="mt-2 rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {goalSubmitting ? "Guardando…" : "Crear meta"}
        </button>
      </form>
    </div>
  );
}
