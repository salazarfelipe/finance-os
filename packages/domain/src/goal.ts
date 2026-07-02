import type { Id, ISODateString, Money } from "@finance-os/shared";

export type GoalStatus = "active" | "completed" | "cancelled";

export interface Goal {
  id: Id;
  name: string;
  targetAmount: Money;
  targetDate?: ISODateString;
  reserveId?: Id;
  status: GoalStatus;
  createdAt: ISODateString;
}
