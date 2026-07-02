"use client";

import { useMemo, useState } from "react";
import { GenerateDashboard, type DashboardSnapshot } from "@finance-os/application";
import { useFinanceStore } from "@/store/useFinanceStore";
import { formatMoney, formatPercentage } from "@/lib/money";
import { RegisterMovementForm } from "@/components/RegisterMovementForm";

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function Home() {
  const app = useFinanceStore((state) => state.app);
  const version = useFinanceStore((state) => state.version);
  const [showForm, setShowForm] = useState(false);

  const snapshot = useMemo<DashboardSnapshot | undefined>(() => {
    if (!app) return undefined;
    return new GenerateDashboard(
      app.accounts,
      app.movements,
      app.events,
      app.categories,
      app.budgets,
      app.credits,
      app.goals,
    ).execute(currentPeriod());
    // version fuerza a recalcular después de cada movimiento registrado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app, version]);

  if (!app) return null;

  if (snapshot && snapshot.patrimony.accounts.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-semibold">Finance OS</h1>
        <p className="max-w-sm text-sm text-zinc-500">
          Todavía no tienes cuentas. Ve a la sección Cuentas y crea la primera para empezar a ver
          tu patrimonio.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          + Registrar movimiento
        </button>
      </div>

      {snapshot && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Metric label="Patrimonio" value={formatMoney(snapshot.patrimony.netWorth)} />
            <Metric label="Liquidez" value={formatMoney(snapshot.liquidity)} />
            <Metric
              label="Flujo de caja (mes)"
              value={formatMoney(snapshot.cashFlow.net)}
              tone={snapshot.cashFlow.net >= 0 ? "positive" : "negative"}
            />
            <Metric label="Ingresos del mes" value={formatMoney(snapshot.cashFlow.totalIncome)} />
            <Metric label="Gastos del mes" value={formatMoney(snapshot.cashFlow.totalExpense)} />
            <Metric label="% ahorrado del ingreso" value={formatPercentage(snapshot.savingsRate)} />
          </div>

          {snapshot.budgetProgress.entries.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-medium text-zinc-500">
                Presupuesto de {snapshot.period}
              </h2>
              <ul className="flex flex-col gap-2">
                {snapshot.budgetProgress.entries.map((entry) => (
                  <li key={entry.categoryId} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm">
                      <span>{entry.categoryName}</span>
                      <span className="text-zinc-500">
                        {formatMoney(entry.actualAmount)} / {formatMoney(entry.plannedAmount)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className={`h-full ${
                          entry.percentageConsumed > 1 ? "bg-red-500" : "bg-black dark:bg-white"
                        }`}
                        style={{ width: `${Math.min(entry.percentageConsumed, 1) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {snapshot.creditsPaid.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-medium text-zinc-500">Pagado a créditos</h2>
              <ul className="flex flex-col gap-1 text-sm">
                {snapshot.creditsPaid.map((credit) => (
                  <li key={credit.creditId} className="flex justify-between">
                    <span>{credit.name}</span>
                    <span className="font-mono">{formatMoney(credit.paidAmount)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {snapshot.goalsProgress.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-medium text-zinc-500">Objetivos</h2>
              <ul className="flex flex-col gap-2">
                {snapshot.goalsProgress.map((goal) => (
                  <li key={goal.goalId} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm">
                      <span>{goal.name}</span>
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
            </section>
          )}
        </>
      )}

      {showForm && <RegisterMovementForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className={`text-lg font-semibold ${
          tone === "positive" ? "text-green-600" : tone === "negative" ? "text-red-500" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
