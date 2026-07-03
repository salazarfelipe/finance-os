import Link from "next/link";

export function NavBar() {
  return (
    <nav className="flex gap-4 border-b border-zinc-200 px-6 py-3 text-sm dark:border-zinc-800">
      <Link href="/" className="font-medium text-black dark:text-zinc-50">
        Dashboard
      </Link>
      <Link
        href="/movimientos"
        className="text-zinc-500 hover:text-black dark:hover:text-zinc-50"
      >
        Movimientos
      </Link>
      <Link href="/cuentas" className="text-zinc-500 hover:text-black dark:hover:text-zinc-50">
        Cuentas
      </Link>
      <Link href="/objetivos" className="text-zinc-500 hover:text-black dark:hover:text-zinc-50">
        Objetivos
      </Link>
      <Link
        href="/automatizaciones"
        className="text-zinc-500 hover:text-black dark:hover:text-zinc-50"
      >
        Automatizaciones
      </Link>
      <Link
        href="/sincronizar"
        className="text-zinc-500 hover:text-black dark:hover:text-zinc-50"
      >
        Sincronizar
      </Link>
    </nav>
  );
}
