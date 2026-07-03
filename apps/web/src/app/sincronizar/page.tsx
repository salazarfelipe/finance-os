"use client";

import { useState } from "react";
import { FinanceDatabase } from "@finance-os/database";
import { useFinanceStore } from "@/store/useFinanceStore";
import { wasmUrl } from "@/lib/financeApp";
import {
  downloadFinanceFile,
  findFinanceFile,
  getFileMetadata,
  requestAccessToken,
  uploadFinanceFile,
  type DriveFileMeta,
} from "@/lib/googleDrive";
import { loadDriveSyncState, saveDriveSyncState, type DriveSyncState } from "@/lib/driveSyncStorage";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

function formatDate(iso?: string): string {
  if (!iso) return "nunca";
  return new Date(iso).toLocaleString("es-CO");
}

export default function SincronizarPage() {
  const app = useFinanceStore((state) => state.app);

  const [syncState, setSyncState] = useState<DriveSyncState>(() => loadDriveSyncState());
  const [accessToken, setAccessToken] = useState<string>();
  const [driveFile, setDriveFile] = useState<DriveFileMeta>();
  const [connecting, setConnecting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  async function handleConnect() {
    setConnecting(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const token = await requestAccessToken(CLIENT_ID);
      setAccessToken(token);
      const file = await findFinanceFile(token);
      setDriveFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConnecting(false);
    }
  }

  async function handleUpload() {
    if (!app || !accessToken) return;
    setUploading(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const fileId = driveFile?.id ?? syncState.fileId;
      const currentMeta = fileId ? await getFileMetadata(accessToken, fileId) : undefined;

      const driveHasNewerData =
        currentMeta &&
        (!syncState.lastSyncedModifiedTime ||
          new Date(currentMeta.modifiedTime) > new Date(syncState.lastSyncedModifiedTime));

      if (driveHasNewerData) {
        const proceed = window.confirm(
          "Drive tiene cambios que este dispositivo no ha descargado. " +
            "¿Subir de todas formas y sobrescribirlos?",
        );
        if (!proceed) {
          setUploading(false);
          return;
        }
      }

      const data = app.db.raw.export();
      const uploaded = await uploadFinanceFile(accessToken, fileId, data);
      setDriveFile(uploaded);
      const nextSyncState: DriveSyncState = {
        fileId: uploaded.id,
        lastSyncedModifiedTime: uploaded.modifiedTime,
      };
      saveDriveSyncState(nextSyncState);
      setSyncState(nextSyncState);
      setMessage("Datos subidos a Drive.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload() {
    if (!accessToken) return;
    setDownloading(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const fileId = driveFile?.id ?? syncState.fileId;
      if (!fileId) {
        throw new Error("Todavía no hay ninguna copia en Drive. Sube tus datos primero.");
      }

      const proceed = window.confirm(
        "Esto va a reemplazar los datos de este dispositivo con los de Drive. ¿Continuar?",
      );
      if (!proceed) {
        setDownloading(false);
        return;
      }

      const data = await downloadFinanceFile(accessToken, fileId);
      const meta = await getFileMetadata(accessToken, fileId);

      const downloadedDb = await FinanceDatabase.open({ wasmUrl: wasmUrl(), data });
      await downloadedDb.save();

      saveDriveSyncState({ fileId, lastSyncedModifiedTime: meta.modifiedTime });
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setDownloading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold">Sincronizar con Google Drive</h1>
        <p className="text-sm text-zinc-500">
          Sincronización manual: no ocurre sola en segundo plano. Sube o descarga cuando tú lo
          decidas, un dispositivo a la vez.
        </p>
      </div>

      {!CLIENT_ID && (
        <p className="rounded-lg border border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800">
          Google Drive no está configurado todavía (falta NEXT_PUBLIC_GOOGLE_CLIENT_ID).
        </p>
      )}

      {CLIENT_ID && (
        <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          {!accessToken ? (
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {connecting ? "Conectando…" : "Conectar con Google"}
            </button>
          ) : (
            <>
              <div className="text-sm text-zinc-500">
                <p>Conectado a Google Drive.</p>
                <p>
                  Archivo en Drive:{" "}
                  {driveFile ? `modificado ${formatDate(driveFile.modifiedTime)}` : "no existe todavía"}
                </p>
                <p>Última sincronización de este dispositivo: {formatDate(syncState.lastSyncedModifiedTime)}</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading || !app}
                  className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
                >
                  {uploading ? "Subiendo…" : "Subir a Drive"}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-zinc-700"
                >
                  {downloading ? "Descargando…" : "Descargar de Drive"}
                </button>
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}
        </div>
      )}
    </div>
  );
}
