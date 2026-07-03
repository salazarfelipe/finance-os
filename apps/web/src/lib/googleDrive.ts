"use client";

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const FILE_NAME = "finance.db";
const MIME_TYPE = "application/x-sqlite3";

interface TokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

interface TokenResponse {
  access_token?: string;
  error?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
          }): TokenClient;
        };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Identity Services solo funciona en el navegador"));
  }
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Google Identity Services"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

// Pide un access token vía el flujo de OAuth para SPA (sin backend, sin client secret).
// Abre el popup de consentimiento de Google la primera vez de cada sesión.
export async function requestAccessToken(clientId: string): Promise<string> {
  await loadGoogleIdentityScript();
  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error ?? "No se obtuvo el token de acceso"));
          return;
        }
        resolve(response.access_token);
      },
    });
    client.requestAccessToken();
  });
}

export interface DriveFileMeta {
  id: string;
  modifiedTime: string;
}

async function driveRequest(url: string, accessToken: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Drive respondió ${response.status}: ${body.slice(0, 200)}`);
  }
  return response;
}

// drive.file solo ve archivos creados por esta app, así que basta buscar por nombre.
export async function findFinanceFile(accessToken: string): Promise<DriveFileMeta | undefined> {
  const params = new URLSearchParams({
    q: `name='${FILE_NAME}' and trashed=false`,
    fields: "files(id,modifiedTime)",
    spaces: "drive",
  });
  const response = await driveRequest(
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
    accessToken,
  );
  const data = (await response.json()) as { files?: DriveFileMeta[] };
  return data.files?.[0];
}

export async function getFileMetadata(accessToken: string, fileId: string): Promise<DriveFileMeta> {
  const response = await driveRequest(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,modifiedTime`,
    accessToken,
  );
  return response.json();
}

// Multipart upload: crea el archivo si no existe fileId, o sobrescribe su contenido si existe.
export async function uploadFinanceFile(
  accessToken: string,
  fileId: string | undefined,
  data: Uint8Array,
): Promise<DriveFileMeta> {
  const boundary = "finance_os_boundary";
  const metadata = fileId ? {} : { name: FILE_NAME, mimeType: MIME_TYPE };
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\nContent-Type: ${MIME_TYPE}\r\n\r\n`,
    data.slice(),
    `\r\n--${boundary}--`,
  ]);

  const url = fileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&fields=id,modifiedTime`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime`;

  const response = await driveRequest(url, accessToken, {
    method: fileId ? "PATCH" : "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
  return response.json();
}

export async function downloadFinanceFile(accessToken: string, fileId: string): Promise<Uint8Array> {
  const response = await driveRequest(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    accessToken,
  );
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}
