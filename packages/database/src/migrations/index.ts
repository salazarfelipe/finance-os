import type { Migration } from "./types";
import { migration001Initial } from "./001_initial";

// Ordenadas por version ascendente. Cada migración se aplica una sola vez.
export const migrations: Migration[] = [migration001Initial];

export type { Migration };
