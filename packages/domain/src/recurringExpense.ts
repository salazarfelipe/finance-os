import type { Id, ISODateString, Money } from "@finance-os/shared";

// Plantilla de un gasto fijo (arriendo, servicios, gimnasio, etc). CloseMonth la usa
// para generar el ExpenseEvent del período automáticamente en vez de que el usuario
// lo escriba cada mes (Principio 6: reducir trabajo manual).
export interface RecurringExpense {
  id: Id;
  name: string;
  accountId: Id;
  categoryId?: Id;
  amount: Money;
  dayOfMonth: number;
  isActive: boolean;
  createdAt: ISODateString;
}
