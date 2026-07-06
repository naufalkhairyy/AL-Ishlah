import { apiRequest } from "./api";

const fallbackArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.santri)) return value.santri;
  if (Array.isArray(value?.ujian)) return value.ujian;
  if (Array.isArray(value?.jadwal)) return value.jadwal;
  if (Array.isArray(value?.jawaban)) return value.jawaban;
  return [];
};

async function getOptionalAdminArray(path) {
  try {
    const response = await apiRequest(path, { authScope: "admin" });
    return fallbackArray(response.data || response);
  } catch (error) {
    if ([401, 403, 404, 405].includes(error.status)) return [];
    return [];
  }
}

export function getApplicantDisplayName(record = {}, fallback = "Calon Santri") {
  return record.nama_lengkap ||
    record.namaLengkap ||
    record.studentName ||
    record.student_name ||
    record.name ||
    record.full_name ||
    record.calon_santri?.nama_lengkap ||
    record.calonSantri?.nama_lengkap ||
    record.data_calon_santri?.nama_lengkap ||
    record.dataCalonSantri?.nama_lengkap ||
    record.santri?.nama_lengkap ||
    fallback;
}

export async function getAdminResources() {
  const [users, santri, calonSantri, ujian, jadwal, jawaban] = await Promise.all([
    apiRequest("/users", { authScope: "admin" }).then((response) => fallbackArray(response.data)),
    apiRequest("/santri", { authScope: "admin" }).then((response) => fallbackArray(response.data)),
    getOptionalAdminArray("/calon-santri"),
    apiRequest("/ujian", { authScope: "admin" }).then((response) => fallbackArray(response.data)),
    apiRequest("/jadwal-ujian", { authScope: "admin" }).then((response) => fallbackArray(response.data)),
    apiRequest("/jawaban", { authScope: "admin" }).then((response) => fallbackArray(response.data)),
  ]);

  return { users, santri, calonSantri, ujian, jadwal, jawaban };
}

export async function getAdminApplicants() {
  const [users, santri, calonSantri] = await Promise.all([
    apiRequest("/users", { authScope: "admin" }).then((response) => fallbackArray(response.data)),
    apiRequest("/santri", { authScope: "admin" }).then((response) => fallbackArray(response.data)),
    getOptionalAdminArray("/calon-santri"),
  ]);

  return { users, santri, calonSantri };
}

export async function updateAdminSantri(santriId, payload) {
  if (!santriId) throw new Error("santri_id tidak ditemukan.");

  try {
    return await apiRequest(`/santri/${santriId}`, {
      authScope: "admin",
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error.status && ![404, 405].includes(error.status)) throw error;

    return apiRequest(`/santri/${santriId}`, {
      authScope: "admin",
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }
}

export async function getAdminExamData() {
  const [ujian, jadwal, jawaban, santri] = await Promise.all([
    apiRequest("/ujian", { authScope: "admin" }).then((response) => fallbackArray(response.data)),
    apiRequest("/jadwal-ujian", { authScope: "admin" }).then((response) => fallbackArray(response.data)),
    apiRequest("/jawaban", { authScope: "admin" }).then((response) => fallbackArray(response.data)),
    apiRequest("/santri", { authScope: "admin" }).then((response) => fallbackArray(response.data)),
  ]);

  return { ujian, jadwal, jawaban, santri };
}

export function getInitials(name = "") {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CS";
}
