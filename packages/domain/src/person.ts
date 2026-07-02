import type { Id, ISODateString } from "@finance-os/shared";

export interface Person {
  id: Id;
  name: string;
  relationship?: string;
  createdAt: ISODateString;
}
