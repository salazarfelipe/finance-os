import type { CategoryKind } from "@finance-os/domain";
import type { FinanceApp } from "./financeApp";

// Solo nombres de categoría (sin montos ni saldos): es seguro tenerlos hardcodeados.
const DEFAULT_CATEGORIES: Array<{ name: string; kind: CategoryKind }> = [
  { name: "Salario", kind: "income" },
  { name: "Arriendo", kind: "expense" },
  { name: "Servicios", kind: "expense" },
  { name: "Internet", kind: "expense" },
  { name: "Ayuda familia", kind: "expense" },
  { name: "Celular", kind: "expense" },
  { name: "Cuota hijo", kind: "expense" },
  { name: "Gimnasio", kind: "expense" },
  { name: "Seguros", kind: "expense" },
  { name: "Suscripciones", kind: "expense" },
  { name: "Mercado", kind: "expense" },
  { name: "Restaurantes", kind: "expense" },
  { name: "Gasolina", kind: "expense" },
  { name: "Ropa", kind: "expense" },
  { name: "Regalos", kind: "expense" },
];

export async function seedDefaultCategories(app: FinanceApp): Promise<void> {
  if (app.categories.findAll().length > 0) return;

  for (const category of DEFAULT_CATEGORIES) {
    app.categories.insert({
      id: app.ids.generate(),
      name: category.name,
      kind: category.kind,
      createdAt: app.clock.now(),
    });
  }

  await app.db.save();
}
