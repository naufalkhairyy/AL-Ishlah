import { apiRequest } from "./api";

const emptyToNull = (value) => {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
};

const required = (value) => String(value ?? "").trim();

function mapGender(value) {
  if (value === "Laki-laki") return "L";
  if (value === "Perempuan") return "P";
  return value || "";
}

function firstObject(...values) {
  return values.find((value) => value && typeof value === "object" && !Array.isArray(value)) || {};
}

function getNestedProfileData(data = {}) {
  const rootCalon = firstObject(data.calonSantri, data.calon_santri, data.calon, data);
  const calon = firstObject(rootCalon.calonSantri, rootCalon.calon_santri, rootCalon.calon, rootCalon);

  return {
    calon,
    sekolah: firstObject(data.sekolah, data.sekolahAsal, data.sekolah_asal, rootCalon.sekolah, rootCalon.sekolah_asal),
    ayah: firstObject(data.ayah, rootCalon.ayah, rootCalon.ayah_calon_santri),
    ibu: firstObject(data.ibu, rootCalon.ibu, rootCalon.ibu_calon_santri),
    wali: firstObject(
      data.wali,
      data.waliCalonSantri,
      data.wali_calon_santri,
      rootCalon.wali,
      rootCalon.waliCalonSantri,
      rootCalon.wali_calon_santri,
      calon.wali,
      calon.waliCalonSantri,
      calon.wali_calon_santri,
    ),
  };
}

function findFirstValueByKeys(value, keys) {
  if (!value || typeof value !== "object") return "";
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstValueByKeys(item, keys);
      if (found) return found;
    }
    return "";
  }

  for (const key of keys) {
    if (value[key] !== undefined && value[key] !== null && value[key] !== "") return value[key];
  }

  for (const child of Object.values(value)) {
    const found = findFirstValueByKeys(child, keys);
    if (found) return found;
  }

  return "";
}

export function mapProfileFromApi(data = {}) {
  const { calon, sekolah, ayah, ibu, wali } = getNestedProfileData(data);
  const authUser = firstObject(data.authUser, data.user);

  const profile = {
    santri_id: authUser.santri_id ||
      calon.santri_id ||
      calon.id_santri ||
      calon.santriId ||
      calon.idSantri ||
      calon.santri?.santri_id ||
      authUser.santri?.santri_id ||
      calon.santri?.id ||
      findFirstValueByKeys(data, ["santri_id", "id_santri", "santriId", "idSantri"]) ||
      "",
    calon_santri_id: authUser.calon_santri_id || calon.calon_santri_id || calon.id_calon_santri || calon.id || "",
    user_id: authUser.user_id || calon.user_id || "",
    namaLengkap: calon.nama_lengkap || "",
    namaPanggilan: calon.nama_panggilan || "",
    tempatLahir: calon.tempat_lahir || "",
    tanggalLahir: calon.tanggal_lahir || "",
    jenisKelamin: calon.jenis_kelamin || "",
    golonganDarah: calon.golongan_darah || "",
    jumlahSaudara: calon.jumlah_saudara ?? "",
    anakKe: calon.anak_ke ?? "",
    alamat: calon.alamat || "",
    nisn: calon.nisn || "",

    namaSekolah: sekolah.nama_sekolah || "",
    alamatSekolah: sekolah.alamat_sekolah || "",
    kotaSekolah: sekolah.kota || "",
    provinsiSekolah: sekolah.provinsi || "",
    tahunLulus: sekolah.tahun_lulus ?? "",

    namaAyah: ayah.nama || "",
    tempatLahirAyah: ayah.tempat_lahir || "",
    tanggalLahirAyah: ayah.tanggal_lahir || "",
    pekerjaanAyah: ayah.pekerjaan || "",
    pendidikanAyah: ayah.pendidikan || "",
    penghasilanAyah: ayah.penghasilan ?? "",
    alamatAyah: ayah.alamat || "",
    desaAyah: ayah.desa || "",
    kecamatanAyah: ayah.kecamatan || "",
    kotaAyah: ayah.kota || "",
    provinsiAyah: ayah.provinsi || "",
    hpAyah: ayah.no_hp || "",

    namaIbu: ibu.nama || "",
    tempatLahirIbu: ibu.tempat_lahir || "",
    tanggalLahirIbu: ibu.tanggal_lahir || "",
    pekerjaanIbu: ibu.pekerjaan || "",
    pendidikanIbu: ibu.pendidikan || "",
    penghasilanIbu: ibu.penghasilan ?? "",
    alamatIbu: ibu.alamat || "",
    desaIbu: ibu.desa || "",
    kecamatanIbu: ibu.kecamatan || "",
    kotaIbu: ibu.kota || "",
    provinsiIbu: ibu.provinsi || "",
    hpIbu: ibu.no_hp || "",
    hpPondokIbu: ibu.no_hp_pondok || "",

    namaWali: wali.nama || calon.nama_wali || "",
    tempatLahirWali: wali.tempat_lahir || calon.tempat_lahir_wali || "",
    tanggalLahirWali: wali.tanggal_lahir || calon.tanggal_lahir_wali || "",
    pekerjaanWali: wali.pekerjaan || calon.pekerjaan_wali || "",
    pendidikanWali: wali.pendidikan || calon.pendidikan_wali || "",
    alamatWali: wali.alamat || calon.alamat_wali || "",
    desaWali: wali.desa || calon.desa_wali || "",
    kecamatanWali: wali.kecamatan || calon.kecamatan_wali || "",
    kotaWali: wali.kota || calon.kota_wali || "",
    provinsiWali: wali.provinsi || calon.provinsi_wali || "",
    hpWaliTambahan: wali.no_hp || calon.no_hp_wali || calon.hp_wali || "",
    hubunganWali: wali.hubungan || calon.hubungan_wali || "",
  };

  return profile;
}

export function buildRegistrationPayloads(form) {
  const calonSantri = {
    nama_lengkap: required(form.namaLengkap),
    nama_panggilan: required(form.namaPanggilan),
    tempat_lahir: required(form.tempatLahir),
    tanggal_lahir: required(form.tanggalLahir),
    jenis_kelamin: mapGender(form.jenisKelamin),
    golongan_darah: required(form.golonganDarah),
    jumlah_saudara: Number(form.jumlahSaudara),
    anak_ke: Number(form.anakKe),
    alamat: required(form.alamat),
    nisn: required(form.nisn),
  };

  const sekolah = {
    nama_sekolah: required(form.namaSekolah),
    alamat_sekolah: required(form.alamatSekolah),
    kota: required(form.kotaSekolah),
    provinsi: required(form.provinsiSekolah),
    tahun_lulus: Number(form.tahunLulus),
  };

  const ayah = {
    nama: required(form.namaAyah),
    tempat_lahir: required(form.tempatLahirAyah),
    tanggal_lahir: required(form.tanggalLahirAyah),
    pekerjaan: required(form.pekerjaanAyah),
    pendidikan: required(form.pendidikanAyah),
    penghasilan: Number(form.penghasilanAyah),
    alamat: required(form.alamatAyah),
    desa: required(form.desaAyah),
    kecamatan: required(form.kecamatanAyah),
    kota: required(form.kotaAyah),
    provinsi: required(form.provinsiAyah),
    no_hp: required(form.hpAyah),
  };

  const ibu = {
    nama: required(form.namaIbu),
    tempat_lahir: required(form.tempatLahirIbu),
    tanggal_lahir: required(form.tanggalLahirIbu),
    pekerjaan: required(form.pekerjaanIbu),
    pendidikan: required(form.pendidikanIbu),
    penghasilan: Number(form.penghasilanIbu),
    alamat: required(form.alamatIbu),
    desa: required(form.desaIbu),
    kecamatan: required(form.kecamatanIbu),
    kota: required(form.kotaIbu),
    provinsi: required(form.provinsiIbu),
    no_hp: required(form.hpIbu),
    no_hp_pondok: emptyToNull(form.hpPondokIbu),
  };

  const wali = {
    nama: required(form.namaWali),
    tempat_lahir: required(form.tempatLahirWali),
    tanggal_lahir: required(form.tanggalLahirWali),
    pekerjaan: required(form.pekerjaanWali),
    pendidikan: required(form.pendidikanWali),
    alamat: required(form.alamatWali),
    desa: required(form.desaWali),
    kecamatan: required(form.kecamatanWali),
    kota: required(form.kotaWali),
    provinsi: required(form.provinsiWali),
    no_hp: required(form.hpWaliTambahan),
    hubungan: required(form.hubunganWali),
  };

  return { calonSantri, sekolah, ayah, ibu, wali };
}

async function getOptional(path) {
  try {
    return (await apiRequest(path, { authScope: "student" })).data;
  } catch (error) {
    if (error.status === 404 || error.message?.toLowerCase().includes("tidak ditemukan")) return null;
    throw error;
  }
}

export async function getRegistrationProfile() {
  const [authUser, calonSantri, sekolah, ayah, ibu, wali] = await Promise.all([
    getOptional("/auth-user"),
    getOptional("/calon-santri"),
    getOptional("/sekolah-asal-calon-santri"),
    getOptional("/ayah-calon-santri"),
    getOptional("/ibu-calon-santri"),
    getOptional("/wali-calon-santri"),
  ]);

  return mapProfileFromApi({ authUser, calonSantri, sekolah, ayah, ibu, wali });
}

function getResponseRecord(response) {
  return firstObject(
    response?.data?.data,
    response?.data?.calonSantri,
    response?.data?.calon_santri,
    response?.data,
    response?.calonSantri,
    response?.calon_santri,
    response,
  );
}

function getSavedProfileSnapshot(form, calonResponse) {
  const calon = getResponseRecord(calonResponse);

  return {
    ...form,
    santri_id: calon.santri_id ||
      calon.id_santri ||
      calon.santri?.santri_id ||
      form.santri_id ||
      "",
    calon_santri_id: calon.calon_santri_id ||
      calon.id_calon_santri ||
      calon.id ||
      form.calon_santri_id ||
      "",
    user_id: calon.user_id || form.user_id || "",
  };
}

export async function saveRegistrationProfile(form) {
  const payloads = buildRegistrationPayloads(form);
  const hasWaliData = Object.values(payloads.wali).some((value) => String(value ?? "").trim());

  const calonResponse = await apiRequest("/calon-santri", {
    authScope: "student",
    method: "POST",
    body: JSON.stringify(payloads.calonSantri),
  });

  const requests = [
    apiRequest("/sekolah-asal-calon-santri", {
      authScope: "student",
      method: "POST",
      body: JSON.stringify(payloads.sekolah),
    }),
    apiRequest("/ayah-calon-santri", {
      authScope: "student",
      method: "POST",
      body: JSON.stringify(payloads.ayah),
    }),
    apiRequest("/ibu-calon-santri", {
      authScope: "student",
      method: "POST",
      body: JSON.stringify(payloads.ibu),
    }),
  ];

  if (hasWaliData) {
    requests.push(apiRequest("/wali-calon-santri", {
      authScope: "student",
      method: "POST",
      body: JSON.stringify(payloads.wali),
    }));
  }

  await Promise.all(requests);
  return getSavedProfileSnapshot(form, calonResponse);
}
