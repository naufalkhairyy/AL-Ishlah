import { useEffect, useMemo, useState } from "react";
import KpiCard from "../components/KpiCard";
import QuickApplicantForm from "../components/QuickApplicantForm";
import { getAdminApplicants, getApplicantDisplayName, getInitials, updateAdminSantri } from "../../../service/adminService";
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

function parseEditValue(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }
  return value;
}

function ApplicantDetail({ item, onEdit }) {
  const mappedProfile = mapProfileFromApi(item.raw);
  const backendSections = [
    ["Data Akun", item.raw.user],
    ["Data Profil Pendaftaran Backend", item.raw.calon],
    ["Data Santri Backend", item.raw.student],
  ].map(([title, value]) => [title, getPrimitiveDetailRows(value)]);

  return (
    <div className="applicant-detail">
      <div className="applicant-detail__actions">
        <button className="admin-primary" type="button" onClick={() => onEdit(item)} disabled={!Object.keys(item.raw.student || {}).length}>
          Edit Data Santri
        </button>
        {!Object.keys(item.raw.student || {}).length && <small>Data santri belum ada, jadi belum bisa diedit dari panel ini.</small>}
      </div>
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

function ApplicantEditForm({ item, onSaved, notify }) {
  const student = item.raw.student || {};
  const [form, setForm] = useState(() => Object.fromEntries(
    Object.entries(student).map(([key, value]) => [key, typeof value === "object" && value !== null ? JSON.stringify(value, null, 2) : String(value ?? "")]),
  ));
  const [saving, setSaving] = useState(false);
  const studentId = getStudentRecordId(student);

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, parseEditValue(value)]));
      await updateAdminSantri(studentId, payload);
      notify("Data santri diperbarui", `${item.name} berhasil disimpan.`);
      await onSaved();
    } catch (requestError) {
      notify("Gagal menyimpan data", requestError.message || "Data santri belum dapat diperbarui.");
    } finally {
      setSaving(false);
    }
  };

  if (!studentId) {
    return <p>Data santri belum memiliki ID, edit belum bisa dikirim.</p>;
  }

  return (
    <form className="applicant-edit-form" onSubmit={handleSubmit}>
      {Object.entries(form).map(([key, value]) => (
        <label key={key}>
          <span>{formatFieldLabel(key)}</span>
          {String(value).length > 90 || String(value).includes("\n") ? (
            <textarea value={value} onChange={(event) => setField(key, event.target.value)} />
          ) : (
            <input value={value} onChange={(event) => setField(key, event.target.value)} />
          )}
        </label>
      ))}
      <div className="applicant-edit-form__actions">
        <button className="admin-primary" type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan Perubahan"}</button>
      </div>
    </form>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    const santriByUser = new Map(santri.map((item) => [String(item.user_id || item.user?.user_id || ""), item]));
    const calonByUser = new Map(calonSantri.map((item) => [String(item.user_id || item.user?.user_id || ""), item]));

    return users
      .filter((user) => user.role === "calon_santri")
      .map((user) => {
        const student = santriByUser.get(String(user.user_id));
        const calon = calonByUser.get(String(user.user_id));
        const profile = student || calon || {};
        const name = getApplicantDisplayName(profile, "Calon Santri");
        const status = student ? "Verified" : calon ? "Profil Terisi" : "Pending";

        return {
          id: user.user_id,
          initials: getInitials(name),
          name,
          region: profile.alamat || user.role,
          nisn: profile.nisn || "-",
          status,
          date: user.created_at ? new Date(user.created_at).toLocaleDateString("id-ID") : "-",
          raw: { user, student, calon },
        };
      });
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
      <ApplicantDetail item={item} onEdit={openApplicantEdit} />,
      "Detail Calon Santri",
    );
  };
  const getStatusTone = (status) => status.toLowerCase().replace(/\s+/g, "-");

  const openApplicantEdit = (item) => {
    openModal(
      `Edit ${item.name}`,
      "Ubah data santri yang tersimpan di sistem.",
      <ApplicantEditForm item={item} notify={notify} onSaved={() => loadApplicants(true)} />,
      "Edit Data Santri",
    );
  };

  return (
    <section className="admin-page">
      <div className="admin-page-head">
        <div>
          <span className="admin-year">TA 2024/2025</span>
          <h1>Profil Calon Santri</h1>
          <p>{loading ? "Mengambil data calon santri dari database..." : "Kelola akun dan data calon santri."}</p>
        </div>
        <div className="admin-head-actions">
          <button className="admin-outline" type="button" onClick={() => downloadText("data-calon-santri.csv", csv)}>Ekspor Data</button>
          <button className="admin-primary" type="button" onClick={() => openModal("Tambah Manual", "Tambahkan calon santri dari loket administrasi.", <QuickApplicantForm notify={notify} />)}>+ Tambah Manual</button>
        </div>
      </div>

      <div className="profile-stats">
        <KpiCard title="Total Pendaftar" value={rows.length} note="Akun role calon_santri" />
        <KpiCard title="Menunggu Data Santri" value={pendingCount} note="Belum punya record santri" badge="!" tone="pink" />
        <article className="admin-success-card reveal-card"><p>Data Santri Tersimpan</p><strong>{verifiedCount}</strong><small>Dari data santri</small></article>
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
                    <button type="button" onClick={() => openApplicantEdit(item)} disabled={!item.raw.student}>Edit</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5">Belum ada akun calon santri di database.</td></tr>
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
