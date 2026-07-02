"use client";

import { useEffect } from "react";
import { useFinanceStore } from "@/store/useFinanceStore";

export function AppGate({ children }: { children: React.ReactNode }) {
  const status = useFinanceStore((state) => state.status);
  const error = useFinanceStore((state) => state.error);
  const init = useFinanceStore((state) => state.init);

  useEffect(() => {
    init();
  }, [init]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        Cargando finance.db…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-red-500">
        No se pudo abrir la base de datos: {error}
      </div>
    );
  }

  return <>{children}</>;
}
