import type { Id, ISODateString } from "@finance-os/shared";

export type AssetType = "vehicle" | "severance" | "real_estate" | "other";

// Metadata del activo físico/financiero. El valor vive en la Account (asset) referenciada
// y se actualiza mediante eventos de revaluación (RegisterRevaluation, Sprint 2).
export interface Asset {
  id: Id;
  accountId: Id;
  name: string;
  assetType: AssetType;
  acquisitionDate?: ISODateString;
  createdAt: ISODateString;
}
