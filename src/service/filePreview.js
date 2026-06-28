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

  console.log("========== getPreviewUrl ==========");
  console.log("URL asli :", url);
  console.log("Value    :", value);
  console.log("API Origin :", getApiOrigin());

  if (
    value.startsWith("data:") ||
    value.startsWith("blob:") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    console.log("RETURN (langsung):", value);
    return value;
  }

  if (value.startsWith("//")) {
    const result = `${window.location.protocol}${value}`;
    console.log("RETURN (protocol):", result);
    return result;
  }

  const result = new URL(value.replace(/^\/+/, "/"), getApiOrigin()).href;
  console.log("RETURN (gabungan):", result);
  return result;
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

  console.log("=== getAuthenticatedPreviewUrl ===");
  console.log("Normalized URL:", normalizedUrl);

  if (normalizedUrl.startsWith("data:")) return dataUrlToBlobUrl(normalizedUrl);
  if (normalizedUrl.startsWith("blob:")) return normalizedUrl;

  const token = getAuthToken(authScope);

  console.log("Token:", token);
  console.log("Fetch:", normalizedUrl);

  const response = await fetch(normalizedUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  console.log("Status:", response.status);

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

  console.log("======================================");
  console.log("openUploadedFile()");
  console.log("URL diterima :", url);

  const normalizedUrl = getPreviewUrl(url);

  console.log("Normalized URL :", normalizedUrl);
  console.log("Window Origin  :", window.location.origin);
  console.log("API Origin     :", getApiOrigin());

  const lowerName = String(fileName || normalizedUrl).toLowerCase();
  const canPreview =
    String(fileType).startsWith("image/") ||
    fileType === "application/pdf" ||
    normalizedUrl.startsWith("data:image/") ||
    normalizedUrl.startsWith("data:application/pdf") ||
    /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(lowerName);

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

    console.log("Authorization:", token);
    console.log("FETCH URL:", normalizedUrl);

    const response = await fetch(normalizedUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    console.log("Response Status:", response.status);
    console.log("Response URL:", response.url);

    if (!response.ok) throw new Error("Gagal mengambil file.");

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    console.log("Blob URL:", blobUrl);

    previewWindow.location.href = blobUrl;
  } catch (e) {
    console.error("ERROR openUploadedFile()", e);

    if (authScope) {
      previewWindow.document.body.innerHTML =
        "<p style=\"font-family:Arial,sans-serif;padding:16px\">Gagal membuka file dengan sesi admin.</p>";
      return;
    }

    previewWindow.location.href = normalizedUrl;
  }
}