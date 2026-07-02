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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const credits = useMemo(() => app?.credits.findAll() ?? [], [app, version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const creditCards = useMemo(() => app?.creditCards.findAll() ?? [], [app, version]);
  const creditAccounts = accounts.filter(
    (account) => account.kind === "liability" && account.subtype === "credit",
  );
  const creditCardAccounts = accounts.filter(
    (account) => account.kind === "liability" && account.subtype === "credit_card",
  );

  const [name, setName] = useState("");
  const [kind, setKind] = useState<AccountKind>("asset");
  const [subtype, setSubtype] = useState<AccountSubtype>("bank");
  const [institution, setInstitution] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const [importText, setImportText] = useState("");
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importError, setImportError] = useState<string>();
  const [importMessage, setImportMessage] = useState<string>();

  const [creditName, setCreditName] = useState("");
  const [creditAccountId, setCreditAccountId] = useState("");
  const [creditPrincipal, setCreditPrincipal] = useState("");
  const [creditStartDate, setCreditStartDate] = useState("");
  const [creditTermMonths, setCreditTermMonths] = useState("");
  const [creditMonthlyPayment, setCreditMonthlyPayment] = useState("");
  const [creditSubmitting, setCreditSubmitting] = useState(false);
  const [creditError, setCreditError] = useState<string>();

  const [cardName, setCardName] = useState("");
  const [cardAccountId, setCardAccountId] = useState("");
  const [cardLimit, setCardLimit] = useState("");
  const [cardClosingDay, setCardClosingDay] = useState("");
  const [cardDueDay, setCardDueDay] = useState("");
  const [cardSubmitting, setCardSubmitting] = useState(false);
  const [cardError, setCardError] = useState<string>();

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

  const importableKinds: AccountKind[] = ["asset", "liability"];
  const importableSubtypes = Array.from(
    new Set(importableKinds.flatMap((k) => SUBTYPES_BY_KIND[k].map((s) => s.value))),
  );

  async function handleImport(event: FormEvent) {
    event.preventDefault();
    if (!app) return;

    setImportSubmitting(true);
    setImportError(undefined);
    setImportMessage(undefined);
    try {
      const parsed: unknown = JSON.parse(importText);
      if (!Array.isArray(parsed)) throw new Error("El JSON debe ser un arreglo de cuentas");

      for (const [index, raw] of parsed.entries()) {
        const entry = raw as Record<string, unknown>;
        if (typeof entry.name !== "string" || !entry.name.trim()) {
          throw new Error(`Cuenta #${index + 1}: falta "name"`);
        }
        if (!importableKinds.includes(entry.kind as AccountKind)) {
          throw new Error(`Cuenta #${index + 1}: "kind" debe ser asset o liability`);
        }
        if (!importableSubtypes.includes(entry.subtype as AccountSubtype)) {
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
      setImportMessage(`${parsed.length} cuenta(s) importada(s).`);
      setImportText("");
    } catch (err) {
      setImportError(err instanceof Error ? err.message : String(err));
    } finally {
      setImportSubmitting(false);
    }
  }

  async function handleCreateCredit(event: FormEvent) {
    event.preventDefault();
    if (!app) return;
    const principal = Number(creditPrincipal);
    const term = Number(creditTermMonths);
    const monthlyPayment = Number(creditMonthlyPayment);
    if (
      !creditName.trim() ||
      !creditAccountId ||
      !creditStartDate ||
      !principal ||
      !term ||
      !monthlyPayment
    ) {
      setCreditError("Todos los campos son obligatorios");
      return;
    }

    setCreditSubmitting(true);
    setCreditError(undefined);
    try {
      app.credits.insert({
        id: app.ids.generate(),
        name: creditName.trim(),
        accountId: creditAccountId,
        principalAmount: principal,
        startDate: creditStartDate,
        termMonths: term,
        monthlyPayment,
        createdAt: app.clock.now(),
      });
      await app.db.save();
      refresh();
      setCreditName("");
      setCreditAccountId("");
      setCreditPrincipal("");
      setCreditStartDate("");
      setCreditTermMonths("");
      setCreditMonthlyPayment("");
    } catch (err) {
      setCreditError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreditSubmitting(false);
    }
  }

  async function handleCreateCard(event: FormEvent) {
    event.preventDefault();
    if (!app) return;
    if (!cardName.trim() || !cardAccountId) {
      setCardError("Nombre y cuenta son obligatorios");
      return;
    }

    setCardSubmitting(true);
    setCardError(undefined);
    try {
      app.creditCards.insert({
        id: app.ids.generate(),
        name: cardName.trim(),
        accountId: cardAccountId,
        creditLimit: cardLimit ? Number(cardLimit) : undefined,
        closingDay: cardClosingDay ? Number(cardClosingDay) : undefined,
        dueDay: cardDueDay ? Number(cardDueDay) : undefined,
        createdAt: app.clock.now(),
      });
      await app.db.save();
      refresh();
      setCardName("");
      setCardAccountId("");
      setCardLimit("");
      setCardClosingDay("");
      setCardDueDay("");
    } catch (err) {
      setCardError(err instanceof Error ? err.message : String(err));
    } finally {
      setCardSubmitting(false);
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

      <form
        onSubmit={handleImport}
        className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <h2 className="text-sm font-medium">Importar cuentas (JSON)</h2>
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
        {importError && <p className="text-sm text-red-500">{importError}</p>}
        {importMessage && <p className="text-sm text-green-600">{importMessage}</p>}
        <button
          type="submit"
          disabled={importSubmitting || !importText.trim()}
          className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-zinc-700"
        >
          {importSubmitting ? "Importando…" : "Importar"}
        </button>
      </form>

      <div>
        <h2 className="text-lg font-semibold">Créditos y tarjetas</h2>
        <p className="text-sm text-zinc-500">
          Registrar el crédito o la tarjeta (con su cuota/cupo) es lo que permite usar
          &ldquo;Pago de crédito&rdquo; y &ldquo;Pago de tarjeta&rdquo; en &ldquo;+ Registrar
          movimiento&rdquo;. El saldo sigue viviendo en la cuenta pasiva asociada.
        </p>
      </div>

      <ul className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {credits.length === 0 && creditCards.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-zinc-500">
            Todavía no has registrado ningún crédito ni tarjeta.
          </li>
        )}
        {credits.map((credit) => (
          <li key={credit.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{credit.name}</p>
              <p className="text-zinc-500">
                Cuota {formatMoney(credit.monthlyPayment)} · {credit.termMonths} meses desde{" "}
                {credit.startDate}
              </p>
            </div>
            <p className="font-mono">{formatMoney(credit.principalAmount)}</p>
          </li>
        ))}
        {creditCards.map((creditCard) => (
          <li key={creditCard.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{creditCard.name}</p>
              <p className="text-zinc-500">
                {creditCard.closingDay ? `Corte día ${creditCard.closingDay}` : "Sin corte"} ·{" "}
                {creditCard.dueDay ? `Pago día ${creditCard.dueDay}` : "Sin fecha de pago"}
              </p>
            </div>
            <p className="font-mono">
              {creditCard.creditLimit ? formatMoney(creditCard.creditLimit) : "—"}
            </p>
          </li>
        ))}
      </ul>

      <form
        onSubmit={handleCreateCredit}
        className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <h2 className="text-sm font-medium">Nuevo crédito</h2>

        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <input
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={creditName}
            onChange={(event) => setCreditName(event.target.value)}
            placeholder="Crédito Comfamiliar"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Cuenta (pasivo · crédito)
          <select
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={creditAccountId}
            onChange={(event) => setCreditAccountId(event.target.value)}
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
              value={creditPrincipal}
              onChange={(event) => setCreditPrincipal(event.target.value)}
              placeholder="0"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Fecha de inicio
            <input
              type="date"
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={creditStartDate}
              onChange={(event) => setCreditStartDate(event.target.value)}
            />
          </label>
        </div>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Plazo (meses)
            <input
              type="number"
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={creditTermMonths}
              onChange={(event) => setCreditTermMonths(event.target.value)}
              placeholder="60"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Cuota mensual
            <input
              type="number"
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={creditMonthlyPayment}
              onChange={(event) => setCreditMonthlyPayment(event.target.value)}
              placeholder="0"
            />
          </label>
        </div>

        {creditError && <p className="text-sm text-red-500">{creditError}</p>}

        <button
          type="submit"
          disabled={creditSubmitting || creditAccounts.length === 0}
          className="mt-2 rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {creditSubmitting ? "Guardando…" : "Crear crédito"}
        </button>
        {creditAccounts.length === 0 && (
          <p className="text-center text-xs text-zinc-500">
            Primero crea una cuenta pasiva de tipo &ldquo;Crédito&rdquo; arriba.
          </p>
        )}
      </form>

      <form
        onSubmit={handleCreateCard}
        className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <h2 className="text-sm font-medium">Nueva tarjeta</h2>

        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <input
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={cardName}
            onChange={(event) => setCardName(event.target.value)}
            placeholder="Tarjeta Nu"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Cuenta (pasivo · tarjeta de crédito)
          <select
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={cardAccountId}
            onChange={(event) => setCardAccountId(event.target.value)}
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
              value={cardLimit}
              onChange={(event) => setCardLimit(event.target.value)}
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
              value={cardClosingDay}
              onChange={(event) => setCardClosingDay(event.target.value)}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Día de pago (opcional)
            <input
              type="number"
              min={1}
              max={31}
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
              value={cardDueDay}
              onChange={(event) => setCardDueDay(event.target.value)}
            />
          </label>
        </div>

        {cardError && <p className="text-sm text-red-500">{cardError}</p>}

        <button
          type="submit"
          disabled={cardSubmitting || creditCardAccounts.length === 0}
          className="mt-2 rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {cardSubmitting ? "Guardando…" : "Crear tarjeta"}
        </button>
        {creditCardAccounts.length === 0 && (
          <p className="text-center text-xs text-zinc-500">
            Primero crea una cuenta pasiva de tipo &ldquo;Tarjeta de crédito&rdquo; arriba.
          </p>
        )}
      </form>
    </div>
  );
}
