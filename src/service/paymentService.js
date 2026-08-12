import { getAuthUser, apiRequest } from "./api";
import { getInitials } from "./adminService";

export const PAYMENT_STORAGE_KEY = "manual_payment_submissions";
export const REGISTRATION_FEE = 350000;
export const BANK_ACCOUNT = {
  bank: "Bank Syariah Indonesia",
  number: "71340000202415",
  name: "Pesantren Al Ishlah Al Islamy",
};

export function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function clearPaymentCache() {
  localStorage.removeItem(PAYMENT_STORAGE_KEY);
}

function stripInlinePaymentFiles(payments) {
  return payments.map((payment) => ({
    ...payment,
    fileDataUrl: payment.fileDataUrl?.startsWith("data:") ? "" : payment.fileDataUrl,
    bukti_bayar: payment.bukti_bayar?.startsWith("data:") ? "" : payment.bukti_bayar,
    bukti_bayar_url: payment.bukti_bayar_url?.startsWith("data:") ? "" : payment.bukti_bayar_url,
    bukti_bayar_nama_file: payment.bukti_bayar_nama_file,
    bukti_bayar_mime_type: payment.bukti_bayar_mime_type,
    bukti_pembayaran: payment.bukti_pembayaran?.startsWith("data:") ? "" : payment.bukti_pembayaran,
    bukti_pembayaran_url: payment.bukti_pembayaran_url?.startsWith("data:") ? "" : payment.bukti_pembayaran_url,
  }));
}

function getSafeUploadFileName(file) {
  const originalName = file?.name || "bukti-bayar";
  const extension = originalName.includes(".") ? originalName.split(".").pop().toLowerCase() : "";
  const nameOnly = originalName.replace(/\.[^/.]+$/, "");
  const safeName = nameOnly
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "bukti-bayar";

  return extension ? `${safeName}.${extension}` : safeName;
}

function writePayments(payments) {
  try {
    localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(stripInlinePaymentFiles(payments)));
  } catch (error) {
    if (error.name !== "QuotaExceededError") throw error;
    localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(stripInlinePaymentFiles(payments)));
  }
  window.dispatchEvent(new Event("manual-payments-updated"));
}

export function getCurrentUser() {
  return getAuthUser("student");
}

export function getManualPayments() {
  const payments = readJson(PAYMENT_STORAGE_KEY, []);
  const safePayments = stripInlinePaymentFiles(payments);
  if (payments.some((payment) => payment.fileDataUrl?.startsWith("data:"))) {
    localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(safePayments));
  }
  return safePayments;
}

function normalizeHttpsUrl(url) {
  if (!url) return "";
  return String(url).replace(/^http:\/\//i, "https://");
}

function getPaymentStudentName(payment, username, calonByUser = new Map(), calonById = new Map()) {
  const calon = calonByUser.get(String(payment.user_id || payment.userId || ""));
  const calonByPaymentId = calonById.get(String(
    payment.calon_santri_id ||
    payment.id_calon_santri ||
    payment.calonSantriId ||
    payment.calon_santri?.calon_santri_id ||
    payment.calonSantri?.calon_santri_id ||
    "",
  ));
  return payment.student_name ||
    payment.studentName ||
    payment.nama_lengkap ||
    payment.calon_santri?.nama_lengkap ||
    payment.calonSantri?.nama_lengkap ||
    calon?.nama_lengkap ||
    calonByPaymentId?.nama_lengkap ||
    "Calon Santri";
}

async function getPaymentCalonSantriMap() {
  try {
    const response = await apiRequest("/calon-santri", { authScope: "admin" });
    const rows = extractPaymentRows(response);
    return {
      byUser: new Map(rows.map((item) => [String(item.user_id || item.user?.user_id || ""), item]).filter(([key]) => key)),
      byId: new Map(rows.map((item) => [String(item.calon_santri_id || item.id_calon_santri || item.id || ""), item]).filter(([key]) => key)),
    };
  } catch {
    return { byUser: new Map(), byId: new Map() };
  }
}

function normalizePayment(payment, calonMaps = { byUser: new Map(), byId: new Map() }) {
  if (!payment) return null;
  if (payment.bukti_bayar_uploaded === false) return null;

  const user = getCurrentUser();
  const username = payment.username || user?.username || "Calon Santri";
  const studentName = getPaymentStudentName(payment, username, calonMaps.byUser, calonMaps.byId);

  const fileName =
    payment.bukti_bayar_nama_file ||
    payment.bukti_bayar_nama ||
    payment.bukti_pembayaran_nama ||
    payment.fileName ||
    "Bukti pembayaran";

  const fileDataUrl = normalizeHttpsUrl(
    payment.bukti_bayar_url ||
    payment.bukti_bayar ||
    payment.bukti_pembayaran ||
    payment.bukti_pembayaran_url ||
    payment.fileDataUrl ||
    ""
  );

  return {
    id: payment.pembayaran_id || payment.id,
    userId: payment.user_id || payment.userId,
    username,
    studentName,
    initials: getInitials(studentName),

    category:
      payment.jenis_pembayaran ||
      payment.kategori ||
      payment.category ||
      payment.jenisPembayaran ||
      "Pembayaran Ujian",

    amount: Number(
      payment.jumlah_bayar ||
      payment.nominal ||
      payment.amount ||
      REGISTRATION_FEE
    ),

    method:
      payment.metode_pembayaran ||
      payment.metode ||
      payment.method ||
      "Transfer Bank Manual",

    bankAccount: {
      bank:
        payment.bank ||
        payment.bankAccount?.bank ||
        BANK_ACCOUNT.bank,

      number:
        payment.nomor_rekening ||
        payment.bankAccount?.number ||
        BANK_ACCOUNT.number,

      name:
        payment.nama_rekening ||
        payment.bankAccount?.name ||
        BANK_ACCOUNT.name,
    },

    fileName,

    fileType:
      payment.bukti_bayar_mime_type ||
      payment.bukti_bayar_mime ||
      payment.bukti_pembayaran_mime ||
      payment.fileType ||
      "application/octet-stream",

    fileSize:
      payment.bukti_bayar_size ||
      payment.bukti_pembayaran_size ||
      payment.fileSize ||
      null,

    fileDataUrl,

    status: normalizePaymentStatus(payment.status),

    submittedAt:
      payment.created_at ||
      payment.submittedAt ||
      new Date().toISOString(),

    updatedAt:
      payment.updated_at ||
      payment.updatedAt ||
      payment.created_at ||
      payment.submittedAt ||
      new Date().toISOString(),

    reviewedAt:
      payment.reviewed_at ||
      payment.reviewedAt ||
      null,

    reviewNote:
      payment.catatan_review ||
      payment.reviewNote ||
      "",
  };
}

function normalizePaymentStatus(status) {
  const value = String(status || "pending").toLowerCase();
  if ([
    "approved",
    "verified",
    "terverifikasi",
    "diterima",
    "lunas",
    "success",
    "paid",
    "disetujui",
    "setuju",
    "acc",
    "accepted",
    "confirm",
    "confirmed",
    "valid",
  ].includes(value)) {
    return "approved";
  }
  if (["rejected", "ditolak", "gagal", "failed", "invalid", "batal"].includes(value)) {
    return "rejected";
  }
  return "pending";
}

function extractPaymentRows(response) {
  const candidates = [
    response.data,
    response.data?.data,
    response.data?.pembayaran,
    response.data?.payments,
    response.data?.items,
    response.pembayaran,
    response.payments,
    response.items,
  ];

  return candidates.find(Array.isArray) || [];
}

function extractPaymentRecord(response) {
  const candidates = [
    response.data?.data,
    response.data?.payment,
    response.data?.pembayaran,
    response.data,
    response.payment,
    response.pembayaran,
  ];

  return candidates.find((value) => value && !Array.isArray(value)) || null;
}

export async function getPayments() {
  clearPaymentCache();
  const [response, calonByUser] = await Promise.all([
    apiRequest(`/pembayaran?_=${Date.now()}`, {
      authScope: "admin",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    }),
    getPaymentCalonSantriMap(),
  ]);

  return extractPaymentRows(response)
    .map((payment) => normalizePayment(payment, calonByUser))
    .filter(Boolean)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export async function getCurrentUserPayment() {
  clearPaymentCache();
  const endpoints = ["/pembayaran/saya", "/pembayaran/current"];

  for (const endpoint of endpoints) {
    try {
      const response = await apiRequest(`${endpoint}?_=${Date.now()}`, {
        authScope: "student",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      const payment = normalizePayment(extractPaymentRecord(response));
      if (payment) return payment;
    } catch (error) {
      if (error.status === 404) continue;
    }
  }

  return null;
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Gagal membaca file bukti pembayaran."));
    reader.readAsDataURL(file);
  });
}

export async function submitManualPayment(file) {
  if (!file) throw new Error("File bukti pembayaran wajib dipilih.");
  if (file.size > 5120 * 1024) throw new Error("Ukuran file maksimal 5120 KB atau 5 MB.");
  const lowerName = file.name.toLowerCase();
  const isAllowedFile = (
    file.type === "application/pdf" ||
    ["image/jpeg", "image/png"].includes(file.type) ||
    /\.(jpg|jpeg|png|pdf)$/i.test(lowerName)
  );
  if (!isAllowedFile) throw new Error("Bukti pembayaran hanya boleh berformat JPG, JPEG, PNG, atau PDF.");

  const user = getCurrentUser();
  if (!user?.user_id) throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");

  try {
    await apiRequest("/calon-santri", { authScope: "student" });
  } catch (error) {
    if (error.status === 404) {
      throw new Error("Data calon santri belum dibuat. Lengkapi dan simpan profil terlebih dahulu sebelum upload bukti pembayaran.");
    }
    throw error;
  }

  const payload = new FormData();
  payload.append("bukti_bayar", file, getSafeUploadFileName(file));

  try {
    const response = await apiRequest("/pembayaran", {
      authScope: "student",
      method: "POST",
      body: payload,
    });
    clearPaymentCache();
    const savedPayment = await getCurrentUserPayment();
    return savedPayment || normalizePayment(extractPaymentRecord(response));
  } catch (error) {
    throw new Error(
      error.message ||
      "Upload bukti bayar gagal. Pastikan server aktif, data sudah siap, dan coba upload ulang.",
    );
  }
}

export function reviewManualPayment(paymentId, status, reviewNote = "") {
  const payments = getManualPayments();
  const nextPayments = payments.map((payment) => (
    String(payment.id) === String(paymentId)
      ? {
          ...payment,
          status,
          reviewNote,
          reviewedAt: new Date().toISOString(),
        }
      : payment
  ));

  writePayments(nextPayments);
  return nextPayments.find((payment) => payment.id === paymentId);
}

export async function reviewPayment(paymentId, status, reviewNote = "") {
  const statusValues = status === "approved"
    ? ["verified", "approved", "lunas", "diterima"]
    : ["rejected", "ditolak"];
  const attempts = [
    { path: `/pembayaran/${paymentId}/review`, method: "PUT" },
    { path: `/pembayaran/${paymentId}/review`, method: "POST" },
    { path: `/pembayaran/${paymentId}/status`, method: "PUT" },
    { path: `/pembayaran/${paymentId}`, method: "PUT" },
  ];
  let lastError = null;

  for (const attempt of attempts) {
    for (const statusValue of statusValues) {
      try {
        const response = await apiRequest(attempt.path, {
          authScope: "admin",
          method: attempt.method,
          body: JSON.stringify({
            status: statusValue,
            status_pembayaran: statusValue,
            status_verifikasi: statusValue,
            catatan: reviewNote,
            catatan_review: reviewNote,
          }),
        });
        const updated = normalizePayment(extractPaymentRecord(response));
        const payments = await getPayments();
        const saved = payments.find((payment) => String(payment.id) === String(paymentId));

        if (saved?.status === status) return saved;
        if (updated?.status === status) return updated;

        throw new Error("Server merespons berhasil, tetapi status pembayaran di database belum berubah.");
      } catch (error) {
        lastError = error;
        if (![404, 405, 422].includes(error.status)) throw error;
      }
    }
  }

  throw lastError || new Error("Status pembayaran gagal diperbarui.");
}
