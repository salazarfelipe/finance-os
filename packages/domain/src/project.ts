import type { Id, ISODateString, Money } from "@finance-os/shared";

export type ProjectStatus = "active" | "completed" | "cancelled";

export interface Project {
  id: Id;
  name: string;
  targetAmount?: Money;
  status: ProjectStatus;
  createdAt: ISODateString;
}
