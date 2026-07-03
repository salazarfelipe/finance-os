"use client";

import { useState, type FormEvent } from "react";
import type { AccountKind, AccountSubtype } from "@finance-os/domain";
import { useFinanceStore } from "@/store/useFinanceStore";
import { Modal } from "@/components/Modal";

const IMPORTABLE_KINDS: AccountKind[] = ["asset", "liability"];
const IMPORTABLE_SUBTYPES: AccountSubtype[] = [
  "bank",
  "cash",
  "investment",
  "physical_asset",
  "other",
  "credit",
  "credit_card",
];

export function ImportAccountsModal({ onClose }: { onClose: () => void }) {
  const app = useFinanceStore((state) => state.app);
  const refresh = useFinanceStore((state) => state.refresh);

  const [importText, setImportText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  async function handleImport(event: FormEvent) {
    event.preventDefault();
    if (!app) return;

    setSubmitting(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const parsed: unknown = JSON.parse(importText);
      if (!Array.isArray(parsed)) throw new Error("El JSON debe ser un arreglo de cuentas");

      for (const [index, raw] of parsed.entries()) {
        const entry = raw as Record<string, unknown>;
        if (typeof entry.name !== "string" || !entry.name.trim()) {
          throw new Error(`Cuenta #${index + 1}: falta "name"`);
        }
        if (!IMPORTABLE_KINDS.includes(entry.kind as AccountKind)) {
          throw new Error(`Cuenta #${index + 1}: "kind" debe ser asset o liability`);
        }
        if (!IMPORTABLE_SUBTYPES.includes(entry.subtype as AccountSubtype)) {
          throw new Error(`Cuenta #${index + 1}: "subtype" inválido`);
        }
        if (typeof entry.openingBalance !== "number") {
          throw new Error(`Cuenta #${index + 1}: "openingBalance" debe ser numérico`);
        }

        app.accounts.insert({
          id: app.ids.generate(),
          name: entry.name.trim(),
          kind: entry.kind as AccountKind,
          subtype: entry.subtype as AccountSubtype,
          institution:
            typeof entry.institution === "string" && entry.institution.trim()
              ? entry.institution.trim()
              : undefined,
          openingBalance: entry.openingBalance,
          isArchived: false,
          createdAt: app.clock.now(),
        });
      }

      await app.db.save();
      refresh();
      setMessage(`${parsed.length} cuenta(s) importada(s).`);
      setImportText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Importar cuentas (JSON)" onClose={onClose}>
      <form onSubmit={handleImport} className="flex flex-col gap-3">
        <p className="text-xs text-zinc-500">
          Pega un arreglo de cuentas y créalas todas de una vez. Útil para cargar tus cuentas
          reales sin escribirlas una por una.
        </p>
        <textarea
          className="h-40 rounded border border-zinc-300 px-2 py-1 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          placeholder='[{"name":"Bancolombia","kind":"asset","subtype":"bank","institution":"Bancolombia","openingBalance":14870000}]'
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}
        <button
          type="submit"
          disabled={submitting || !importText.trim()}
          className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-zinc-700"
        >
          {submitting ? "Importando…" : "Importar"}
        </button>
      </form>
    </Modal>
  );
}
