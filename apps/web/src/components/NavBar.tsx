"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/movimientos", label: "Movimientos" },
  { href: "/cuentas", label: "Cuentas" },
  { href: "/objetivos", label: "Objetivos" },
  { href: "/automatizaciones", label: "Automatizaciones" },
  { href: "/sincronizar", label: "Sincronizar" },
];

export function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function linkClass(href: string): string {
    const isActive = href === "/" ? pathname === "/" : pathname?.startsWith(href);
    return isActive
      ? "font-medium text-black dark:text-zinc-50"
      : "text-zinc-500 hover:text-black dark:hover:text-zinc-50";
  }

  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between px-6 py-3">
        <span className="text-sm font-semibold">Finance OS</span>

        <div className="hidden gap-4 text-sm sm:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="rounded border border-zinc-300 px-2 py-1 text-sm sm:hidden dark:border-zinc-700"
          aria-label="Abrir menú"
        >
          {open ? "Cerrar" : "Menú"}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-1 border-t border-zinc-200 px-6 py-3 text-sm sm:hidden dark:border-zinc-800">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`py-1 ${linkClass(link.href)}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
