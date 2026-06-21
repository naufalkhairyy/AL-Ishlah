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

export async function getAdminResources() {
  const [users, santri, ujian, jadwal, jawaban] = await Promise.all([
    apiRequest("/users", { authScope: "admin" }).then((response) => fallbackArray(response.data)),
    apiRequest("/santri", { authScope: "admin" }).then((response) => fallbackArray(response.data)),
    apiRequest("/ujian", { authScope: "admin" }).then((response) => fallbackArray(response.data)),
    apiRequest("/jadwal-ujian", { authScope: "admin" }).then((response) => fallbackArray(response.data)),
    apiRequest("/jawaban", { authScope: "admin" }).then((response) => fallbackArray(response.data)),
  ]);

  return { users, santri, ujian, jadwal, jawaban };
}

export async function getAdminApplicants() {
  const [users, santri] = await Promise.all([
    apiRequest("/users", { authScope: "admin" }).then((response) => fallbackArray(response.data)),
    apiRequest("/santri", { authScope: "admin" }).then((response) => fallbackArray(response.data)),
  ]);

  return { users, santri };
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
