import type { Id, ISODateString, Money } from "@finance-os/shared";

// ¿Dónde está el dinero? -> Account. ¿Para qué existe? -> Reserve.
export interface Reserve {
  id: Id;
  name: string;
  accountId: Id;
  targetAmount?: Money;
  createdAt: ISODateString;
}
