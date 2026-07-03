"use client";

import { useState, type FormEvent } from "react";
import type { AccountKind, AccountSubtype } from "@finance-os/domain";
import { useFinanceStore } from "@/store/useFinanceStore";
import { Modal } from "@/components/Modal";

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

export function NewAccountModal({ onClose }: { onClose: () => void }) {
  const app = useFinanceStore((state) => state.app);
  const refresh = useFinanceStore((state) => state.refresh);

  const [name, setName] = useState("");
  const [kind, setKind] = useState<AccountKind>("asset");
  const [subtype, setSubtype] = useState<AccountSubtype>("bank");
  const [institution, setInstitution] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

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
    setMessage(undefined);
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
      setMessage(`"${name.trim()}" creada.`);
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
    <Modal title="Nueva cuenta" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
        {message && <p className="text-sm text-green-600">{message}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {submitting ? "Guardando…" : "Crear cuenta"}
        </button>
      </form>
    </Modal>
  );
}
