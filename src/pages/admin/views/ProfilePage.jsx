import { useEffect, useMemo, useState } from "react";
import KpiCard from "../components/KpiCard";
import QuickApplicantForm from "../components/QuickApplicantForm";
import { getAdminApplicants, getApplicantDisplayName, getInitials } from "../../../service/adminService";
import { mapProfileFromApi } from "../../../service/registrationService";
import { downloadText } from "../utils/downloadText";

const PAGE_SIZE = 15;
const formDetailSections = [
  {
    title: "Data Calon Santri",
    fields: [
      ["namaLengkap", "Nama Lengkap"],
      ["namaPanggilan", "Nama Panggilan"],
      ["tempatLahir", "Tempat Lahir"],
      ["tanggalLahir", "Tanggal Lahir"],
      ["jenisKelamin", "Jenis Kelamin"],
      ["golonganDarah", "Golongan Darah"],
      ["jumlahSaudara", "Jumlah Saudara"],
      ["anakKe", "Anak Ke"],
      ["alamat", "Alamat / Domisili Anak"],
      ["nisn", "NISN"],
    ],
  },
  {
    title: "Data Sekolah Asal",
    fields: [
      ["namaSekolah", "Nama Sekolah"],
      ["alamatSekolah", "Alamat Sekolah"],
      ["kotaSekolah", "Kota / Kabupaten"],
      ["provinsiSekolah", "Provinsi"],
      ["tahunLulus", "Tahun Lulus"],
    ],
  },
  {
    title: "Data Ayah",
    fields: [
      ["namaAyah", "Nama Ayah"],
      ["tempatLahirAyah", "Tempat Lahir"],
      ["tanggalLahirAyah", "Tanggal Lahir"],
      ["pekerjaanAyah", "Pekerjaan"],
      ["pendidikanAyah", "Pendidikan"],
      ["penghasilanAyah", "Penghasilan"],
      ["alamatAyah", "Alamat"],
      ["desaAyah", "Desa"],
      ["kecamatanAyah", "Kecamatan"],
      ["kotaAyah", "Kota / Kabupaten"],
      ["provinsiAyah", "Provinsi"],
      ["hpAyah", "Telepon / HP"],
    ],
  },
  {
    title: "Data Ibu",
    fields: [
      ["namaIbu", "Nama Ibu"],
      ["tempatLahirIbu", "Tempat Lahir"],
      ["tanggalLahirIbu", "Tanggal Lahir"],
      ["pekerjaanIbu", "Pekerjaan"],
      ["pendidikanIbu", "Pendidikan"],
      ["penghasilanIbu", "Penghasilan"],
      ["alamatIbu", "Alamat"],
      ["desaIbu", "Desa"],
      ["kecamatanIbu", "Kecamatan"],
      ["kotaIbu", "Kota / Kabupaten"],
      ["provinsiIbu", "Provinsi"],
      ["hpIbu", "Telepon / HP"],
      ["hpPondokIbu", "Nomor WA Resmi Pesantren"],
    ],
  },
  {
    title: "Data Wali",
    fields: [
      ["namaWali", "Nama Wali"],
      ["tempatLahirWali", "Tempat Lahir"],
      ["tanggalLahirWali", "Tanggal Lahir"],
      ["pekerjaanWali", "Pekerjaan"],
      ["pendidikanWali", "Pendidikan"],
      ["alamatWali", "Alamat"],
      ["desaWali", "Desa"],
      ["kecamatanWali", "Kecamatan"],
      ["kotaWali", "Kota / Kabupaten"],
      ["provinsiWali", "Provinsi"],
      ["hpWaliTambahan", "Telepon / HP"],
      ["hubunganWali", "Hubungan Dengan Santri"],
    ],
  },
];

function formatDetailValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatFieldLabel(key) {
  return String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function getPrimitiveDetailRows(value, parentLabel = "") {
  if (!value || typeof value !== "object") return [];

  return Object.entries(value).flatMap(([key, item]) => {
    const label = parentLabel ? `${parentLabel} - ${formatFieldLabel(key)}` : formatFieldLabel(key);

    if (isPlainObject(item)) return getPrimitiveDetailRows(item, label);
    if (Array.isArray(item)) {
      if (!item.length) return [[label, "-"]];
      if (item.every((entry) => !isPlainObject(entry) && typeof entry !== "object")) {
        return [[label, item.join(", ")]];
      }
      return item.flatMap((entry, index) => getPrimitiveDetailRows(entry, `${label} ${index + 1}`));
    }

    return [[label, item]];
  });
}

function DetailList({ rows }) {
  if (!rows.length) return <p>Data belum tersedia.</p>;

  return (
    <dl>
      {rows.map(([label, value], index) => (
        <div key={`${label}-${index}`}>
          <dt>{label}</dt>
          <dd>{formatDetailValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function getStudentRecordId(student = {}) {
  return student.santri_id || student.id || student.id_santri || student.student_id || "";
}

function firstObject(...values) {
  return values.find((value) => value && typeof value === "object" && !Array.isArray(value)) || {};
}

function getRecordUserId(record = {}) {
  return record.user_id ||
    record.user?.user_id ||
    record.authUser?.user_id ||
    record.calon_santri?.user_id ||
    record.calonSantri?.user_id ||
    record.data_calon_santri?.user_id ||
    record.dataCalonSantri?.user_id ||
    "";
}

function getRecordCalonSantriId(record = {}) {
  return record.calon_santri_id ||
    record.id_calon_santri ||
    record.calonSantriId ||
    record.calon_santri?.calon_santri_id ||
    record.calonSantri?.calon_santri_id ||
    record.data_calon_santri?.calon_santri_id ||
    record.dataCalonSantri?.calon_santri_id ||
    record.calon_santri?.id ||
    record.calonSantri?.id ||
    "";
}

function getCalonRecord(student = {}, calon = {}) {
  return firstObject(
    calon,
    student.calon_santri,
    student.calonSantri,
    student.data_calon_santri,
    student.dataCalonSantri,
    student.calon,
  );
}

function getRelatedRecord(source = {}, relation) {
  const relationKeys = {
    sekolah: ["sekolah", "sekolahAsal", "sekolah_asal", "sekolah_asal_calon_santri", "sekolahAsalCalonSantri"],
    ayah: ["ayah", "ayah_calon_santri", "ayahCalonSantri"],
    ibu: ["ibu", "ibu_calon_santri", "ibuCalonSantri"],
    wali: ["wali", "wali_calon_santri", "waliCalonSantri"],
  };

  return firstObject(...(relationKeys[relation] || []).map((key) => source[key]));
}

function buildProfileSource(item) {
  const user = item.raw.user || {};
  const student = item.raw.student || {};
  const calon = getCalonRecord(student, item.raw.calon);

  return {
    authUser: user,
    user,
    student,
    santri: student,
    calon,
    calonSantri: calon,
    calon_santri: calon,
    sekolah: firstObject(getRelatedRecord(calon, "sekolah"), getRelatedRecord(student, "sekolah")),
    ayah: firstObject(getRelatedRecord(calon, "ayah"), getRelatedRecord(student, "ayah")),
    ibu: firstObject(getRelatedRecord(calon, "ibu"), getRelatedRecord(student, "ibu")),
    wali: firstObject(getRelatedRecord(calon, "wali"), getRelatedRecord(student, "wali")),
  };
}

function ApplicantDetail({ item }) {
  const profileSource = buildProfileSource(item);
  const mappedProfile = mapProfileFromApi(profileSource);
  const backendSections = [
    ["Data Akun", profileSource.user],
    ["Data Profil Pendaftaran", profileSource.calon],
    ["Data Santri", profileSource.student],
    ["Data Sekolah", profileSource.sekolah],
    ["Data Ayah", profileSource.ayah],
    ["Data Ibu", profileSource.ibu],
    ["Data Wali", profileSource.wali],
  ].map(([title, value]) => [title, getPrimitiveDetailRows(value)]);

  return (
    <div className="applicant-detail">
      {formDetailSections.map((section) => (
        <section key={section.title}>
          <h3>{section.title}</h3>
          <DetailList rows={section.fields.map(([key, label]) => [label, mappedProfile[key]])} />
        </section>
      ))}
      {backendSections.map(([title, rows]) => (
        <section key={title}>
          <h3>{title}</h3>
          <DetailList rows={rows} />
        </section>
      ))}
    </div>
  );
}

export default function ProfilePage({ openModal, notify }) {
  const [filter, setFilter] = useState("Semua Status");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [santri, setSantri] = useState([]);
  const [calonSantri, setCalonSantri] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadApplicants = (active = true) => getAdminApplicants()
      .then((data) => {
        if (!active) return;
        setUsers(data.users);
        setSantri(data.santri);
        setCalonSantri(data.calonSantri || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Gagal mengambil data calon santri.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

  useEffect(() => {
    let active = true;

    loadApplicants(active);

    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo(() => {
    const santriByUser = new Map(santri.map((item) => [String(getRecordUserId(item)), item]).filter(([key]) => key));
    const santriByCalonId = new Map(santri.map((item) => [String(getRecordCalonSantriId(item)), item]).filter(([key]) => key));
    const calonByUser = new Map(calonSantri.map((item) => [String(getRecordUserId(item)), item]).filter(([key]) => key));

    const buildRow = ({ user = {}, student, calon, idPrefix = "user" }) => {
      const calonProfile = getCalonRecord(student, calon);
      const profile = Object.keys(calonProfile).length ? calonProfile : student || calon || {};
      const name = getApplicantDisplayName(profile, user.username || "Calon Santri");
      const status = student ? "Verified" : calon ? "Profil Terisi" : "Pending";
      const userId = user.user_id || getRecordUserId(profile) || "";

      return {
        id: `${idPrefix}-${userId || getStudentRecordId(student) || getRecordCalonSantriId(profile) || name}`,
        initials: getInitials(name),
        name,
        region: profile.alamat || user.role || "calon_santri",
        nisn: profile.nisn || "-",
        status,
        date: user.created_at || profile.created_at ? new Date(user.created_at || profile.created_at).toLocaleDateString("id-ID") : "-",
        raw: { user, student, calon },
      };
    };

    const applicantUsers = users.filter((user) => ["calon_santri", "santri"].includes(user.role));
    const userRows = applicantUsers.map((user) => {
        const calon = calonByUser.get(String(user.user_id));
        const student = santriByUser.get(String(user.user_id)) || santriByCalonId.get(String(getRecordCalonSantriId(calon)));
        return buildRow({ user, student, calon });
      });

    const visibleUserIds = new Set(applicantUsers.map((user) => String(user.user_id)));
    const orphanCalonRows = calonSantri
      .filter((item) => {
        const userId = String(getRecordUserId(item));
        const calonId = String(getRecordCalonSantriId(item));
        return !visibleUserIds.has(userId) && !santriByCalonId.has(calonId);
      })
      .map((calon) => buildRow({ user: calon.user || {}, calon, idPrefix: "calon" }));
    const orphanSantriRows = santri
      .filter((item) => !visibleUserIds.has(String(getRecordUserId(item))))
      .map((student) => buildRow({
        user: student.user || {},
        student,
        calon: getCalonRecord(student),
        idPrefix: "santri",
      }));

    return [...userRows, ...orphanCalonRows, ...orphanSantriRows];
  }, [users, santri, calonSantri]);

  const filtered = filter === "Semua Status" ? rows : rows.filter((item) => item.status === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const verifiedCount = rows.filter((item) => item.status === "Verified").length;
  const pendingCount = rows.filter((item) => item.status === "Pending").length;
  const csv = [
    "nama,status,tanggal_daftar",
    ...filtered.map((item) => `${item.name},${item.status},${item.date}`),
  ].join("\n");

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
    setPage(1);
  };

  const openApplicantDetail = (item) => {
    openModal(
      item.name,
      `Status data santri: ${item.status}.`,
      <ApplicantDetail item={item} />,
      "Detail Calon Santri",
    );
  };
  const getStatusTone = (status) => status.toLowerCase().replace(/\s+/g, "-");

  return (
    <section className="admin-page">
      <div className="admin-page-head">
        <div>
          <span className="admin-year">TA 2024/2025</span>
          <h1>Profil Calon Santri</h1>
          <p>{loading ? "Mengambil data calon santri..." : "Kelola akun dan data calon santri."}</p>
        </div>
        <div className="admin-head-actions">
          <button className="admin-outline" type="button" onClick={() => downloadText("data-calon-santri.csv", csv)}>Ekspor Data</button>
          <button className="admin-primary" type="button" onClick={() => openModal("Tambah Manual", "Tambahkan calon santri dari loket administrasi.", <QuickApplicantForm notify={notify} />)}>+ Tambah Manual</button>
        </div>
      </div>

      <div className="profile-stats">
        <KpiCard title="Total Pendaftar" value={rows.length} note="Akun calon santri" />
        <KpiCard title="Menunggu Data Santri" value={pendingCount} note="Belum punya profil santri" badge="!" tone="pink" />
        <article className="admin-success-card reveal-card"><p>Data Santri Tersimpan</p><strong>{verifiedCount}</strong><small>Profil santri aktif</small></article>
      </div>

      {error && <div className="admin-panel reveal-card">{error}</div>}

      <article className="admin-table-card reveal-card">
        <div className="admin-table-tools">
          <select value={filter} onChange={handleFilterChange}>
            <option>Semua Status</option>
            <option>Pending</option>
            <option>Profil Terisi</option>
            <option>Verified</option>
          </select>
          <button className="admin-filter" type="button" onClick={() => notify("Filter lanjutan", "Panel filter berdasarkan tahun akademik dibuka.")}>Tahun Akademik</button>
          <span>Menampilkan {filtered.length} data dari {rows.length} hasil</span>
        </div>
        <table>
          <thead><tr><th>Nama Calon Santri</th><th>NISN</th><th>Status</th><th>Tanggal Daftar</th><th>Aksi</th></tr></thead>
          <tbody>
            {paginatedRows.length ? paginatedRows.map((item) => (
              <tr key={item.id}>
                <td><span className="admin-avatar">{item.initials}</span><div><strong>{item.name}</strong><small>{item.region}</small></div></td>
                <td>{item.nisn}</td>
                <td><span className={`admin-status admin-status--${getStatusTone(item.status)}`}>{item.status}</span></td>
                <td>{item.date}</td>
                <td>
                  <div className="question-table-actions">
                    <button type="button" onClick={() => openApplicantDetail(item)}>Lihat Detail</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5">Belum ada akun calon santri.</td></tr>
            )}
          </tbody>
        </table>
        <div className="admin-pagination">
          <span>Halaman {currentPage} dari {totalPages}</span>
          {totalPages > 1 && <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Sebelumnya</button>}
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <button className={currentPage === number ? "is-active" : ""} type="button" key={number} onClick={() => setPage(number)}>{number}</button>)}
          {totalPages > 1 && <button type="button" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Berikutnya</button>}
        </div>
      </article>
    </section>
  );
}
