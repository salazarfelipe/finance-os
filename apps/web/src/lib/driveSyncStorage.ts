const STORAGE_KEY = "finance-os:drive-sync";

// Metadata de sincronización (no financiera): dónde vive el archivo en Drive y
// cuándo fue la última vez que este dispositivo quedó al día con él. Vive en
// localStorage, no en finance.db, porque no es parte del dominio financiero.
export interface DriveSyncState {
  fileId?: string;
  lastSyncedModifiedTime?: string;
}

export function loadDriveSyncState(): DriveSyncState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DriveSyncState) : {};
  } catch {
    return {};
  }
}

export function saveDriveSyncState(state: DriveSyncState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
