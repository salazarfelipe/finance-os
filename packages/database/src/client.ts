import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";

let sqlJsPromise: Promise<SqlJsStatic> | null = null;

// sql.js necesita el .wasm servido como asset estático. En apps/web se copia
// a public/sql-wasm.wasm (ver README de database) para que funcione con
// output: 'export' en GitHub Pages.
function loadSqlJs(wasmUrl: string): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({ locateFile: () => wasmUrl });
  }
  return sqlJsPromise;
}

export interface OpenDatabaseOptions {
  wasmUrl?: string;
  data?: Uint8Array;
}

export async function openDatabase(options: OpenDatabaseOptions = {}): Promise<Database> {
  const SQL = await loadSqlJs(options.wasmUrl ?? "/sql-wasm.wasm");
  return new SQL.Database(options.data);
}
