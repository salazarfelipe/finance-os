import { create } from "zustand";
import { createFinanceApp, type FinanceApp } from "@/lib/financeApp";
import { seedDefaultCategories } from "@/lib/seedDefaultCategories";

interface FinanceStoreState {
  status: "idle" | "loading" | "ready" | "error";
  error?: string;
  app?: FinanceApp;
  // Se incrementa después de cada mutación para que los componentes vuelvan a leer.
  version: number;
  init(): Promise<void>;
  refresh(): void;
}

export const useFinanceStore = create<FinanceStoreState>((set, get) => ({
  status: "idle",
  version: 0,

  async init() {
    if (get().status !== "idle") return;
    set({ status: "loading" });
    try {
      const app = await createFinanceApp();
      await seedDefaultCategories(app);
      set({ status: "ready", app });
    } catch (error) {
      set({ status: "error", error: error instanceof Error ? error.message : String(error) });
    }
  },

  refresh() {
    set((state) => ({ version: state.version + 1 }));
  },
}));
