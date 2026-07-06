import { useEffect, useMemo, useState } from "react";
import KpiCard from "../components/KpiCard";
import QuickApplicantForm from "../components/QuickApplicantForm";
import { getAdminApplicants, getInitials } from "../../../service/adminService";
import { downloadText } from "../utils/downloadText";

const PAGE_SIZE = 15;

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

function ApplicantDetail({ item }) {
  const userEntries = Object.entries(item.raw.user || {});
  const studentEntries = Object.entries(item.raw.student || {});

  return (
    <div className="applicant-detail">
      <section>
        <h3>Data Akun</h3>
        <dl>
          {userEntries.map(([key, value]) => (
            <div key={key}>
              <dt>{formatFieldLabel(key)}</dt>
              <dd>{formatDetailValue(value)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section>
        <h3>Data Calon Santri</h3>
        {studentEntries.length ? (
          <dl>
            {studentEntries.map(([key, value]) => (
              <div key={key}>
                <dt>{formatFieldLabel(key)}</dt>
                <dd>{formatDetailValue(value)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>Data santri belum tersimpan untuk akun ini.</p>
        )}
      </section>
    </div>
  );
}

export default function ProfilePage({ openModal, notify }) {
  const [filter, setFilter] = useState("Semua Status");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [santri, setSantri] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getAdminApplicants()
      .then((data) => {
        if (!active) return;
        setUsers(data.users);
        setSantri(data.santri);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Gagal mengambil data calon santri.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo(() => {
    const santriByUser = new Map(santri.map((item) => [item.user_id, item]));

    return users
      .filter((user) => user.role === "calon_santri")
      .map((user) => {
        const student = santriByUser.get(user.user_id);
        const name = student?.nama_lengkap || user.username;
        const status = student ? "Verified" : "Pending";

        return {
          id: user.user_id,
          initials: getInitials(name),
          name,
          region: student?.alamat || user.role,
          nisn: student?.nisn || "-",
          status,
          date: user.created_at ? new Date(user.created_at).toLocaleDateString("id-ID") : "-",
          raw: { user, student },
        };
      });
  }, [users, santri]);

  const filtered = filter === "Semua Status" ? rows : rows.filter((item) => item.status === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const verifiedCount = rows.filter((item) => item.status === "Verified").length;
  const pendingCount = rows.filter((item) => item.status === "Pending").length;
  const csv = [
    "nama,username,status,tanggal_daftar",
    ...filtered.map((item) => `${item.name},${item.raw.user.username},${item.status},${item.date}`),
  ].join("\n");

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
    setPage(1);
  };

  const openApplicantDetail = (item) => {
    openModal(
      item.name,
      `Username: ${item.raw.user.username}. Status data santri: ${item.status}.`,
      <ApplicantDetail item={item} />,
      "Detail Calon Santri",
    );
  };

  return (
    <section className="admin-page">
      <div className="admin-page-head">
        <div>
          <span className="admin-year">TA 2024/2025</span>
          <h1>Profil Calon Santri</h1>
          <p>{loading ? "Mengambil data calon santri dari database..." : "Kelola akun dan data calon santri dari backend."}</p>
        </div>
        <div className="admin-head-actions">
          <button className="admin-outline" type="button" onClick={() => downloadText("data-calon-santri.csv", csv)}>Ekspor Data</button>
          <button className="admin-primary" type="button" onClick={() => openModal("Tambah Manual", "Tambahkan calon santri dari loket administrasi.", <QuickApplicantForm notify={notify} />)}>+ Tambah Manual</button>
        </div>
      </div>

      <div className="profile-stats">
        <KpiCard title="Total Pendaftar" value={rows.length} note="Akun role calon_santri" />
        <KpiCard title="Menunggu Data Santri" value={pendingCount} note="Belum punya record santri" badge="!" tone="pink" />
        <article className="admin-success-card reveal-card"><p>Data Santri Tersimpan</p><strong>{verifiedCount}</strong><small>Dari endpoint santri</small></article>
      </div>

      {error && <div className="admin-panel reveal-card">{error}</div>}

      <article className="admin-table-card reveal-card">
        <div className="admin-table-tools">
          <select value={filter} onChange={handleFilterChange}>
            <option>Semua Status</option>
            <option>Pending</option>
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
                <td><span className={`admin-status admin-status--${item.status.toLowerCase()}`}>{item.status}</span></td>
                <td>{item.date}</td>
                <td><button type="button" onClick={() => openApplicantDetail(item)}>Lihat Detail</button></td>
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
