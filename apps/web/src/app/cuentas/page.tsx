"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { Account, AccountKind, AccountSubtype } from "@finance-os/domain";
import { useFinanceStore } from "@/store/useFinanceStore";
import { formatMoney } from "@/lib/money";

const SUBTYPES_BY_KIND: Record<AccountKind, { value: AccountSubtype; label: string }[]> = {
  asset: [
    { value: "bank", label: "Banco" },
    { value: "cash", label: "Efectivo" },
    { value: "investment", label: "Inversión" },
    { value: "physical_asset", label: "Activo físico" },
    { value: "other", label: "Otro" },
  ],
  liability: [
    { value: "credit", label: "Crédito" },
    { value: "credit_card", label: "Tarjeta de crédito" },
    { value: "other", label: "Otro" },
  ],
};

export default function CuentasPage() {
  const app = useFinanceStore((state) => state.app);
  const version = useFinanceStore((state) => state.version);
  const refresh = useFinanceStore((state) => state.refresh);

  // version fuerza a releer las cuentas después de cada mutación.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const accounts = useMemo<Account[]>(() => app?.accounts.findAll() ?? [], [app, version]);

  const [name, setName] = useState("");
  const [kind, setKind] = useState<AccountKind>("asset");
  const [subtype, setSubtype] = useState<AccountSubtype>("bank");
  const [institution, setInstitution] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!app) return;

    const amount = Number(openingBalance || 0);
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    setSubmitting(true);
    setError(undefined);
    try {
      app.accounts.insert({
        id: app.ids.generate(),
        name: name.trim(),
        kind,
        subtype,
        institution: institution.trim() || undefined,
        openingBalance: amount,
        isArchived: false,
        createdAt: app.clock.now(),
      });
      await app.db.save();
      refresh();
      setName("");
      setInstitution("");
      setOpeningBalance("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold">Cuentas</h1>
        <p className="text-sm text-zinc-500">
          Tus cuentas y saldos viven solo en este navegador (IndexedDB), nunca en el código.
        </p>
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
            <p className="font-mono">{formatMoney(account.openingBalance)}</p>
          </li>
        ))}
      </ul>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <h2 className="text-sm font-medium">Nueva cuenta</h2>

        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <input
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Bancolombia"
          />
        </label>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Tipo
            <select
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={kind}
              onChange={(event) => {
                const nextKind = event.target.value as AccountKind;
                setKind(nextKind);
                setSubtype(SUBTYPES_BY_KIND[nextKind][0].value);
              }}
            >
              <option value="asset">Activo</option>
              <option value="liability">Pasivo</option>
            </select>
          </label>

          <label className="flex flex-1 flex-col gap-1 text-sm">
            Subtipo
            <select
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={subtype}
              onChange={(event) => setSubtype(event.target.value as AccountSubtype)}
            >
              {SUBTYPES_BY_KIND[kind].map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Institución (opcional)
          <input
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={institution}
            onChange={(event) => setInstitution(event.target.value)}
            placeholder="Bancolombia"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Saldo inicial
          <input
            type="number"
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={openingBalance}
            onChange={(event) => setOpeningBalance(event.target.value)}
            placeholder="0"
          />
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {submitting ? "Guardando…" : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}
