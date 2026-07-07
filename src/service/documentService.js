import { getAuthUser } from "./api";
import { apiRequest } from "./api";
import { getInitials } from "./adminService";

export const DOCUMENT_STORAGE_KEY = "manual_document_submissions";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export const DOCUMENT_TYPES = [
  { key: "raportSemester4", backendField: "raport_semester_4", title: "Fotocopy Raport Semester 4", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "fotocopyAkte", backendField: "akta_kelahiran", title: "Fotocopy Akte Kelahiran", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "pasFoto", backendField: "pas_foto", title: "Pas Foto 3x4", required: true, accept: ".jpg,.jpeg,.png" },
  { key: "kartuKeluarga", backendField: "kartu_keluarga", title: "Kartu Keluarga", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "ktp", backendField: "ktp", title: "KTP Calon Santri", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "ijazahSkl", backendField: "ijazah_skl", title: "Ijazah / SKL", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "suratPernyataanLulus", backendField: "surat_pernyataan_lulus", title: "Surat Pernyataan Lulus", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "ktpOrangTua", backendField: "ktp_orang_tua", title: "KTP Orang Tua", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
];

const DOCUMENT_SCHEMA_VERSION = 2;

export const DOCUMENT_STATUS_LABELS = {
  pending: "Menunggu Verifikasi",
  verified: "Diverifikasi",
  rejected: "Ditolak",
  diterima: "Diterima",
  ditolak: "Ditolak",
};

function mapDocumentReviewStatus(statusDokumen) {
  const status = String(statusDokumen || "").toLowerCase();
  if (status === "diterima" || status === "verified" || status === "approved") return "verified";
  if (status === "ditolak" || status === "rejected") return "rejected";
  return "pending";
}

function getValueByPath(record, path) {
  return path.reduce((value, key) => (
    value && typeof value === "object" ? value[key] : undefined
  ), record);
}

function stripStoredDocumentFileData(document) {
  return {
    ...document,
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    fileDataUrl: document.fileDataUrl && !String(document.fileDataUrl).startsWith("data:")
      ? document.fileDataUrl
      : "",
  };
}

function writeDocuments(documents) {
  const lightweightDocuments = documents.map(stripStoredDocumentFileData);
  try {
    localStorage.setItem(DOCUMENT_STORAGE_KEY, JSON.stringify(lightweightDocuments));
  } catch {
    localStorage.removeItem(DOCUMENT_STORAGE_KEY);
    localStorage.setItem(DOCUMENT_STORAGE_KEY, JSON.stringify(lightweightDocuments.slice(0, 100)));
  }
  window.dispatchEvent(new Event("manual-documents-updated"));
}

export function clearDocumentCache() {
  localStorage.removeItem(DOCUMENT_STORAGE_KEY);
}

function readStoredDocuments() {
  try {
    const value = localStorage.getItem(DOCUMENT_STORAGE_KEY);
    const documents = value ? JSON.parse(value) : [];
    if (!Array.isArray(documents)) return [];
    return documents
      .filter((document) => document.schemaVersion === DOCUMENT_SCHEMA_VERSION)
      .filter((document) => DOCUMENT_TYPES.some((type) => type.key === document.documentKey))
      .map(stripStoredDocumentFileData);
  } catch {
    return [];
  }
}

function getCurrentUser() {
  return getAuthUser("student");
}

function getBackendFields(documentType) {
  return [...new Set(documentType.backendFields || [documentType.backendField])];
}

function getCalonSantriId(record) {
  return record?.calon_santri_id ||
    record?.id_calon_santri ||
    record?.calonSantriId ||
    record?.calon_santri?.calon_santri_id ||
    record?.calonSantri?.calon_santri_id ||
    record?.calon_santri?.id ||
    record?.calonSantri?.id ||
    record?.id ||
    "";
}

function getDocumentPreviewPathById(calonSantriId, backendField) {
  const apiBase = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
  return calonSantriId ? new URL(`calon-santri/${calonSantriId}/dokumen/${backendField}`, apiBase).href : "";
}

function getDocumentPreviewPath(record, backendField, scope) {
  const apiBase = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;

  if (scope === "admin") {
    return getDocumentPreviewPathById(getCalonSantriId(record), backendField);
  }

  return new URL(`calon-santri/dokumen/${backendField}`, apiBase).href;
}

function isUploadedFlag(value) {
  if (value === true || value === 1) return true;
  const normalized = String(value ?? "").trim().toLowerCase();
  return ["1", "true", "yes", "y", "uploaded", "terupload", "ada"].includes(normalized);
}

function isNotUploadedFlag(value) {
  if (value === false || value === 0) return true;
  const normalized = String(value ?? "").trim().toLowerCase();
  return ["0", "false", "no", "n", "belum", "not_uploaded"].includes(normalized);
}

function hasBackendDocumentMeta(record, backendField) {
  return Boolean(
    record?.[`${backendField}_nama_file`] ||
    record?.[`${backendField}_mime_type`] ||
    record?.[`${backendField}_size`],
  );
}

function getBackendDocumentUrl(record, documentType, scope = "student") {
  const backendFields = getBackendFields(documentType);
  const dokumenUploaded = record?.dokumen_uploaded || record?.dokumenUploaded || {};
  const explicitlyNotUploaded = backendFields.some((field) => isNotUploadedFlag(dokumenUploaded?.[field]));
  if (explicitlyNotUploaded) return null;

  const dokumenUrl = record?.dokumen_url || record?.dokumenUrl || record?.dokumen || record?.documents || {};
  const nestedField = backendFields.find((field) => (
    dokumenUrl?.[field] ||
    dokumenUrl?.[`${field}_url`] ||
    dokumenUrl?.[`${field}_path`] ||
    dokumenUrl?.[`${field}_file`]
  ));
  if (nestedField) {
    return {
      backendField: nestedField,
      fileUrl: dokumenUrl[nestedField] ||
        dokumenUrl[`${nestedField}_url`] ||
        dokumenUrl[`${nestedField}_path`] ||
        dokumenUrl[`${nestedField}_file`],
    };
  }

  const arrayDocument = [
    record?.dokumen,
    record?.documents,
    record?.dokumen_calon_santri,
    record?.dokumenCalonSantri,
  ]
    .find(Array.isArray)
    ?.find((item) => {
      const key = item?.document_key || item?.documentKey || item?.jenis_dokumen || item?.tipe_dokumen || item?.field || item?.nama_field;
      return backendFields.includes(String(key || "").toLowerCase());
    });

  if (arrayDocument) {
    const fileUrl = arrayDocument.url ||
      arrayDocument.file_url ||
      arrayDocument.fileUrl ||
      arrayDocument.path ||
      arrayDocument.file_path ||
      arrayDocument.filePath ||
      arrayDocument.nama_file ||
      arrayDocument.fileName ||
      "";
    if (fileUrl) {
      const key = arrayDocument.document_key || arrayDocument.documentKey || arrayDocument.jenis_dokumen || arrayDocument.tipe_dokumen || arrayDocument.field || arrayDocument.nama_field;
      return { backendField: String(key || documentType.backendField).toLowerCase(), fileUrl };
    }
  }

  const directField = backendFields.find((field) => record?.[field]);
  if (directField) return { backendField: directField, fileUrl: record[directField] };

  const urlField = backendFields.find((field) => record?.[`${field}_url`]);
  if (urlField) return { backendField: urlField, fileUrl: record[`${urlField}_url`] };

  const uploadedField = backendFields.find((field) => (
    isUploadedFlag(dokumenUploaded?.[field]) ||
    hasBackendDocumentMeta(record, field)
  ));
  if (uploadedField) {
    const fallbackPath = getDocumentPreviewPath(record, uploadedField, scope);
    if (fallbackPath) return { backendField: uploadedField, fileUrl: fallbackPath };
  }

  return null;
}

function getBackendDocumentMeta(record, backendField, fallbackUrl) {
  const arrayDocument = [
    record?.dokumen,
    record?.documents,
    record?.dokumen_calon_santri,
    record?.dokumenCalonSantri,
  ]
    .find(Array.isArray)
    ?.find((item) => {
      const key = item?.document_key || item?.documentKey || item?.jenis_dokumen || item?.tipe_dokumen || item?.field || item?.nama_field;
      return String(key || "").toLowerCase() === backendField;
    });

  return {
    fileName: record?.[`${backendField}_nama_file`] ||
      record?.[`${backendField}_name`] ||
      arrayDocument?.nama_file ||
      arrayDocument?.fileName ||
      arrayDocument?.file_name ||
      String(fallbackUrl).split("/").pop() ||
      backendField,
    fileType: record?.[`${backendField}_mime_type`] ||
      record?.[`${backendField}_mime`] ||
      arrayDocument?.mime_type ||
      arrayDocument?.mimeType ||
      arrayDocument?.fileType ||
      "File dokumen",
    fileSize: record?.[`${backendField}_size`] || arrayDocument?.size || arrayDocument?.fileSize || null,
  };
}

function getBackendDocumentStatus(record, documentType, globalStatus, allRequiredUploaded) {
  const backendFields = getBackendFields(documentType);
  const containers = [
    "dokumen_status",
    "status_dokumen_detail",
    "status_dokumen_per_file",
    "dokumen_verifikasi",
  ];

  for (const field of backendFields) {
    const directCandidates = [
      record?.[`${field}_status`],
      record?.[`status_${field}`],
      record?.[`${field}_status_dokumen`],
      record?.[`${field}_verifikasi`],
      record?.[`${field}_review_status`],
    ];
    const nestedCandidates = containers.map((container) => getValueByPath(record, [container, field]));
    const status = [...directCandidates, ...nestedCandidates].find((value) => value !== undefined && value !== null && value !== "");
    if (status) return mapDocumentReviewStatus(status);
  }

  const mappedGlobalStatus = mapDocumentReviewStatus(globalStatus);
  if (mappedGlobalStatus === "verified") return allRequiredUploaded ? "verified" : "pending";
  if (mappedGlobalStatus === "rejected") return "rejected";
  return "pending";
}

function getBackendDocumentNote(record, backendField) {
  return record?.dokumen_catatan?.[backendField] ||
    record?.dokumenCatatan?.[backendField] ||
    record?.catatan_dokumen_detail?.[backendField] ||
    record?.[`${backendField}_catatan`] ||
    record?.[`${backendField}_note`] ||
    record?.catatan_dokumen ||
    "";
}

export function formatFileSize(size) {
  if (!size) return "-";
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

export function getManualDocuments() {
  return readStoredDocuments();
}

export function getCurrentUserDocuments() {
  const user = getCurrentUser();
  if (!user?.user_id) return [];
  return getManualDocuments().filter((document) => document.userId === user.user_id);
}

export function getDocumentByKey(documents, key) {
  return documents
    .filter((document) => document.documentKey === key)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0] || null;
}

export function mapBackendDocuments(calonSantri, options = {}) {
  const scope = options.scope || "student";
  const statusDokumen = String(calonSantri?.status_dokumen || "").toLowerCase();
  const requiredDocumentsUploaded = DOCUMENT_TYPES
    .filter((type) => type.required)
    .every((type) => Boolean(getBackendDocumentUrl(calonSantri, type, scope)?.fileUrl));

  return DOCUMENT_TYPES
    .map((type) => {
      const documentUrl = getBackendDocumentUrl(calonSantri, type, scope);
      return documentUrl ? { type, ...documentUrl } : null;
    })
    .filter(Boolean)
    .map(({ type, backendField, fileUrl }) => ({
      id: `BACKEND-${calonSantri.calon_santri_id || calonSantri.id || calonSantri.user_id}-${backendField}`,
      userId: calonSantri.user_id,
      calonSantriId: getCalonSantriId(calonSantri),
      santriId: calonSantri.santri_id || calonSantri.santri?.santri_id || "",
      username: "backend",
      studentName: calonSantri.nama_lengkap || "Calon Santri",
      initials: getInitials(calonSantri.nama_lengkap || "CS"),
      documentKey: type.key,
      documentTitle: type.title,
      required: type.required,
      backendField,
      ...getBackendDocumentMeta(calonSantri, backendField, fileUrl),
      fileDataUrl: fileUrl
  ? fileUrl.replace(/^http:\/\//i, "https://")
  : fileUrl,
      status: getBackendDocumentStatus(calonSantri, type, statusDokumen, requiredDocumentsUploaded),
      statusDokumen,
      source: "backend",
      submittedAt: calonSantri.updated_at || calonSantri.created_at || new Date().toISOString(),
      reviewedAt: calonSantri.updated_at || null,
      reviewNote: getBackendDocumentNote(calonSantri, backendField),
    }));
}

export async function getBackendDocumentsForCurrentUser() {
  const response = await apiRequest("/calon-santri", { authScope: "student" });
  return mapBackendDocuments(response.data, { scope: "student" });
}

export async function getDocumentsForCurrentUser() {
  clearDocumentCache();
  const backendDocuments = await getBackendDocumentsForCurrentUser();
  return mergeDocumentSubmissions(backendDocuments);
}

async function getCurrentCalonSantriForUpload() {
  try {
    const response = await apiRequest("/calon-santri", { authScope: "student" });
    return response.data;
  } catch (error) {
    if (error.status === 404) {
      throw new Error("Data calon santri belum dibuat. Lengkapi dan simpan profil terlebih dahulu sebelum upload dokumen.");
    }
    throw error;
  }
}

export async function submitManualDocument(documentKey, file) {
  if (!file) throw new Error("File dokumen wajib dipilih.");
  if (file.size > 5120 * 1024) throw new Error("Ukuran file maksimal 5120 KB atau 5 MB.");

  const user = getCurrentUser();
  if (!user?.user_id) throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");

  const documentType = DOCUMENT_TYPES.find((item) => item.key === documentKey);
  if (!documentType) throw new Error("Jenis dokumen tidak dikenal.");
  const lowerName = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || lowerName.endsWith(".pdf");
  const isImage = ["image/jpeg", "image/png"].includes(file.type) || /\.(jpg|jpeg|png)$/i.test(lowerName);
  if (documentType.backendField === "pas_foto" && !isImage) {
    throw new Error("Pas foto hanya boleh berformat JPG, JPEG, atau PNG.");
  }
  if (documentType.backendField !== "pas_foto" && !isImage && !isPdf) {
    throw new Error("Dokumen hanya boleh berformat JPG, JPEG, PNG, atau PDF.");
  }

  await getCurrentCalonSantriForUpload();

  const formData = new FormData();
  formData.append(documentType.backendField, file);
  await apiRequest("/calon-santri/dokumen", {
    authScope: "student",
    method: "POST",
    body: formData,
  });
  const refreshedDocuments = await getDocumentsForCurrentUser();
  const refreshedDocument = getDocumentByKey(refreshedDocuments, documentKey);
  const fallbackCalonSantri = await getCurrentCalonSantriForUpload();
  const fallbackUrl = getDocumentPreviewPath(fallbackCalonSantri, documentType.backendField, "admin");
  const now = new Date().toISOString();
  const submission = refreshedDocument || {
    id: `BACKEND-${getCalonSantriId(fallbackCalonSantri) || user.user_id}-${documentType.backendField}`,
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    userId: user.user_id,
    calonSantriId: getCalonSantriId(fallbackCalonSantri),
    santriId: fallbackCalonSantri?.santri_id || fallbackCalonSantri?.santri?.santri_id || "",
    username: user.username,
    studentName: fallbackCalonSantri?.nama_lengkap || user.username,
    initials: getInitials(fallbackCalonSantri?.nama_lengkap || user.username),
    documentKey,
    documentTitle: documentType.title,
    required: documentType.required,
    fileName: file.name,
    fileType: file.type || "File dokumen",
    fileSize: file.size,
    fileDataUrl: fallbackUrl,
    status: "pending",
    statusDokumen: fallbackCalonSantri?.status_dokumen || "pending",
    source: "backend-upload",
    submittedAt: now,
    reviewedAt: null,
    reviewNote: "",
  };

  const storedDocuments = readStoredDocuments();
  const nextDocuments = [
    stripStoredDocumentFileData(submission),
    ...storedDocuments.filter((document) => getDocumentIdentity(document) !== getDocumentIdentity(submission)),
  ];
  writeDocuments(nextDocuments);

  return submission;
}

export function reviewManualDocument(documentId, status, reviewNote = "") {
  const documents = getManualDocuments();
  const nextDocuments = documents.map((document) => (
    document.id === documentId
      ? {
          ...document,
          status,
          reviewNote,
          reviewedAt: new Date().toISOString(),
        }
      : document
  ));

  writeDocuments(nextDocuments);
  return nextDocuments.find((document) => document.id === documentId);
}

export function reviewDocumentSubmission(document, status, reviewNote = "") {
  clearDocumentCache();
  return {
    ...document,
    status,
    statusDokumen: status === "verified" ? "diterima" : status === "rejected" ? "ditolak" : "",
    reviewNote,
    reviewedAt: new Date().toISOString(),
  };
}

function mapDocumentRows(rows) {
  return rows.flatMap((row) => mapBackendDocuments(row, { scope: "admin" }));
}

function extractAdminDocumentRows(response) {
  const items = response?.data?.data;
  if (Array.isArray(items)) return items;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

async function getAdminDocumentRows() {
  const endpoints = [
    `/admin/dokumen-calon-santri?_=${Date.now()}`,
    `/calon-santri/dokumen-list?_=${Date.now()}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await apiRequest(endpoint, {
        authScope: "admin",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      const rows = extractAdminDocumentRows(response);
      const documents = mapDocumentRows(rows);
      if (documents.length) return documents;
    } catch (error) {
      if (![404, 405, 403].includes(error.status)) throw error;
    }
  }

  return [];
}

function getDocumentIdentity(document) {
  return [
    document.userId || "",
    document.calonSantriId || "",
    document.documentKey || "",
  ].join(":");
}

function mergeDocumentSubmissions(documents) {
  const byIdentity = new Map();

  documents.forEach((document) => {
    const identity = getDocumentIdentity(document);
    const current = byIdentity.get(identity);
    const currentTime = new Date(current?.submittedAt || 0).getTime() || 0;
    const nextTime = new Date(document?.submittedAt || 0).getTime() || 0;
    const localDocument = document.source !== "backend" ? document : current?.source !== "backend" ? current : null;
    const backendDocument = document.source === "backend" ? document : current?.source === "backend" ? current : null;
    const localTime = new Date(localDocument?.reviewedAt || localDocument?.submittedAt || 0).getTime() || 0;
    const backendTime = new Date(backendDocument?.reviewedAt || backendDocument?.submittedAt || 0).getTime() || 0;
    const localOverridesBackend = localDocument && (
      localDocument.source === "local-review" ||
      !backendDocument ||
      localTime >= backendTime
    );
    const statusSource = localOverridesBackend ? localDocument : backendDocument || document || current;

    if (!current || nextTime >= currentTime) {
      byIdentity.set(identity, {
        ...current,
        ...document,
        fileDataUrl: document.fileDataUrl || current?.fileDataUrl || "",
        localFileKey: document.localFileKey || current?.localFileKey || "",
        status: statusSource?.status || "pending",
        statusDokumen: statusSource?.statusDokumen || "",
        reviewNote: statusSource?.reviewNote || document.reviewNote || current?.reviewNote || "",
        santriId: backendDocument?.santriId || document.santriId || current?.santriId || "",
        calonSantriId: backendDocument?.calonSantriId || document.calonSantriId || current?.calonSantriId || "",
      });
    } else if (current) {
      byIdentity.set(identity, {
        ...document,
        ...current,
        fileDataUrl: current.fileDataUrl || document.fileDataUrl || "",
        localFileKey: current.localFileKey || document.localFileKey || "",
        status: statusSource?.status || "pending",
        statusDokumen: statusSource?.statusDokumen || "",
        reviewNote: statusSource?.reviewNote || current.reviewNote || document.reviewNote || "",
        santriId: backendDocument?.santriId || current.santriId || document.santriId || "",
        calonSantriId: backendDocument?.calonSantriId || current.calonSantriId || document.calonSantriId || "",
      });
    }
  });

  return Array.from(byIdentity.values()).sort((a, b) => (
    (new Date(b.submittedAt).getTime() || 0) - (new Date(a.submittedAt).getTime() || 0)
  ));
}

export async function getAdminDocumentSubmissions() {
  const directDocuments = await getAdminDocumentRows();
  return mergeDocumentSubmissions([...directDocuments, ...readStoredDocuments()]);
}

export async function updateCalonSantriDocumentStatus(calonSantriId, statusDokumen, note = "") {
  if (!calonSantriId) throw new Error("calon_santri_id tidak ditemukan untuk dokumen ini.");

  const response = await apiRequest(`/calon-santri/${calonSantriId}/dokumen/status`, {
    authScope: "admin",
    method: "PUT",
    body: JSON.stringify({
      status_dokumen: statusDokumen,
      catatan_dokumen: note || (statusDokumen === "diterima" ? "Dokumen lengkap" : ""),
    }),
  });
  return response;
}

export async function updateCalonSantriDocumentFieldStatus(calonSantriId, field, status, note = "") {
  if (!calonSantriId) throw new Error("calon_santri_id tidak ditemukan untuk dokumen ini.");
  if (!field) throw new Error("Field dokumen tidak ditemukan.");

  return apiRequest(`/calon-santri/${calonSantriId}/dokumen/${field}/status`, {
    authScope: "admin",
    method: "PUT",
    body: JSON.stringify({
      status,
      catatan: note,
    }),
  });
}

export function areRequiredDocumentsVerified(documents) {
  return DOCUMENT_TYPES
    .filter((item) => item.required)
    .every((item) => getDocumentByKey(documents, item.key)?.status === "verified");
}

export function getCurrentUserDocumentSummary() {
  const documents = getCurrentUserDocuments();
  return getDocumentSummary(documents);
}

export function getDocumentSummary(documents) {
  const requiredTypes = DOCUMENT_TYPES.filter((item) => item.required);
  const latestRequiredDocuments = requiredTypes
    .map((item) => getDocumentByKey(documents, item.key))
    .filter(Boolean);

  return {
    requiredTotal: requiredTypes.length,
    uploadedTotal: latestRequiredDocuments.length,
    verifiedTotal: latestRequiredDocuments.filter((document) => document.status === "verified").length,
    pendingTotal: latestRequiredDocuments.filter((document) => document.status === "pending").length,
    rejectedTotal: latestRequiredDocuments.filter((document) => document.status === "rejected").length,
    complete: requiredTypes.every((item) => getDocumentByKey(documents, item.key)?.status === "verified"),
  };
}
