import { getAuthToken } from "./api";

function getApiOrigin() {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
    return new URL(apiBaseUrl, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
}

export function getPreviewUrl(url) {
  if (!url) return "";
  const value = String(url).trim();

  if (
    value.startsWith("data:") ||
    value.startsWith("blob:") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  if (value.startsWith("//")) {
    return `${window.location.protocol}${value}`;
  }

  return new URL(value.replace(/^\/+/, "/"), getApiOrigin()).href;
}

function dataUrlToBlobUrl(dataUrl) {
  if (!dataUrl.startsWith("data:")) return dataUrl;

  const [meta, encodedData] = dataUrl.split(",");
  const mime = meta.match(/^data:([^;]+)/)?.[1] || "application/octet-stream";
  const isBase64 = /;base64/i.test(meta);
  const binary = isBase64
    ? atob(encodedData || "")
    : decodeURIComponent(encodedData || "");
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

export async function getAuthenticatedPreviewUrl(url, authScope) {
  if (!url) return "";

  const normalizedUrl = getPreviewUrl(url);
  if (normalizedUrl.startsWith("data:")) return dataUrlToBlobUrl(normalizedUrl);
  if (normalizedUrl.startsWith("blob:")) return normalizedUrl;

  const token = getAuthToken(authScope);
  const response = await fetch(normalizedUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) throw new Error("Gagal mengambil file preview.");

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

function openDirect(url, fileName = "File terupload", canPreview = true) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  if (!canPreview) {
    link.download = fileName || "File terupload";
  }

  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function openUploadedFile(url, fileName = "File terupload", fileType = "", authScope) {
  if (!url) return;

  const normalizedUrl = getPreviewUrl(url);
  const lowerName = String(fileName || normalizedUrl).toLowerCase();
  const canPreview = (
    String(fileType).startsWith("image/") ||
    fileType === "application/pdf" ||
    normalizedUrl.startsWith("data:image/") ||
    normalizedUrl.startsWith("data:application/pdf") ||
    /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(lowerName)
  );

  if (normalizedUrl.startsWith("data:")) {
    openDirect(dataUrlToBlobUrl(normalizedUrl), fileName, canPreview);
    return;
  }

  if (normalizedUrl.startsWith("blob:")) {
    openDirect(normalizedUrl, fileName, canPreview);
    return;
  }

  const previewWindow = window.open("", "_blank");
  if (!previewWindow) {
    openDirect(normalizedUrl, fileName, canPreview);
    return;
  }

  try {
    previewWindow.document.write("<p style=\"font-family:Arial,sans-serif;padding:16px\">Membuka file...</p>");
    const token = getAuthToken(authScope);
    const response = await fetch(normalizedUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) throw new Error("Gagal mengambil file.");

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    previewWindow.location.href = blobUrl;
  } catch {
    if (authScope) {
      previewWindow.document.body.innerHTML = "<p style=\"font-family:Arial,sans-serif;padding:16px\">Gagal membuka file dengan sesi admin. Silakan login ulang atau pastikan URL dokumen bisa diakses admin.</p>";
      return;
    }
    previewWindow.location.href = normalizedUrl;
  }
}
