import { getAuthToken } from "./api";

function getApiOrigin() {
  try {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

    return new URL(apiBaseUrl, window.location.origin).origin.replace(
      /^http:\/\//i,
      "https://"
    );
  } catch {
    return window.location.origin;
  }
}

export function getPreviewUrl(url) {
  if (!url) return "";

  const value = String(url).trim();

  console.log("========== getPreviewUrl ==========");
  console.log("URL asli :", value);

  // data url
  if (value.startsWith("data:")) {
    console.log("RETURN DATA");
    return value;
  }

  // blob
  if (value.startsWith("blob:")) {
    console.log("RETURN BLOB");
    return value;
  }

  // absolute url
  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    const result = value.replace(/^http:\/\//i, "https://");

    console.log("RETURN HTTPS :", result);

    return result;
  }

  // protocol relative
  if (value.startsWith("//")) {
    const result = `https:${value}`;

    console.log("RETURN // :", result);

    return result;
  }

  // relative url
  const result = new URL(
    value.replace(/^\/+/, "/"),
    getApiOrigin()
  ).href.replace(/^http:\/\//i, "https://");

  console.log("RETURN RELATIVE :", result);

  return result;
}

function dataUrlToBlobUrl(dataUrl) {
  if (!dataUrl.startsWith("data:")) return dataUrl;

  const [meta, encodedData] = dataUrl.split(",");

  const mime =
    meta.match(/^data:([^;]+)/)?.[1] ||
    "application/octet-stream";

  const isBase64 = /;base64/i.test(meta);

  const binary = isBase64
    ? atob(encodedData || "")
    : decodeURIComponent(encodedData || "");

  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return URL.createObjectURL(
    new Blob([bytes], { type: mime })
  );
}

export async function getAuthenticatedPreviewUrl(url, authScope) {
  if (!url) return "";

  const normalizedUrl = getPreviewUrl(url);

  console.log("=== getAuthenticatedPreviewUrl ===");
  console.log(normalizedUrl);

  if (normalizedUrl.startsWith("data:")) {
    return dataUrlToBlobUrl(normalizedUrl);
  }

  if (normalizedUrl.startsWith("blob:")) {
    return normalizedUrl;
  }

  const token = getAuthToken(authScope);

  const response = await fetch(normalizedUrl, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  });

  console.log("STATUS :", response.status);

  if (!response.ok) {
    throw new Error("Gagal mengambil preview.");
  }

  const blob = await response.blob();

  return URL.createObjectURL(blob);
}

function openDirect(url, fileName = "File", canPreview = true) {
  const a = document.createElement("a");

  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";

  if (!canPreview) {
    a.download = fileName;
  }

  document.body.appendChild(a);

  a.click();

  a.remove();
}

export async function openUploadedFile(
  url,
  fileName = "File",
  fileType = "",
  authScope
) {
  if (!url) return;

  console.log("==============================");
  console.log("openUploadedFile()");
  console.log("URL diterima :", url);

  const normalizedUrl = getPreviewUrl(url);

  console.log("Normalized :", normalizedUrl);

  const lowerName = String(fileName).toLowerCase();

  const canPreview =
    String(fileType).startsWith("image/") ||
    fileType === "application/pdf" ||
    /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(lowerName);

  if (normalizedUrl.startsWith("data:")) {
    openDirect(
      dataUrlToBlobUrl(normalizedUrl),
      fileName,
      canPreview
    );
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

  previewWindow.document.write(
    "<p style='padding:20px;font-family:Arial'>Membuka file...</p>"
  );

  try {
    const token = getAuthToken(authScope);

    console.log("TOKEN :", token);
    console.log("FETCH :", normalizedUrl);

    const response = await fetch(normalizedUrl, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    });

    console.log("STATUS :", response.status);

    if (!response.ok) {
      throw new Error("Gagal mengambil file.");
    }

    const blob = await response.blob();

    const blobUrl = URL.createObjectURL(blob);

    console.log("BLOB :", blobUrl);

    previewWindow.location.href = blobUrl;
  } catch (err) {
    console.error(err);

    previewWindow.document.body.innerHTML = `
      <div style="padding:20px;font-family:Arial">
        <h3>Preview gagal dibuka</h3>
        <p>${err.message}</p>
        <p>${normalizedUrl}</p>
      </div>
    `;
  }
}