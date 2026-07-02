import type { Id, ISODateString } from "@finance-os/shared";

export type CategoryKind = "income" | "expense";

export interface Category {
  id: Id;
  name: string;
  kind: CategoryKind;
  parentId?: Id;
  createdAt: ISODateString;
}
