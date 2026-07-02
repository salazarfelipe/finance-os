import { createRequire } from "node:module";
import { copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const wasmSource = require.resolve("sql.js/dist/sql-wasm.wasm");
const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

copyFileSync(wasmSource, path.join(publicDir, "sql-wasm.wasm"));
console.log(`Copiado sql-wasm.wasm -> ${publicDir}`);
