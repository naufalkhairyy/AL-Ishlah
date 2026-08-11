import { useEffect, useMemo, useState } from "react";
import KpiCard from "../components/KpiCard";
import QuickApplicantForm from "../components/QuickApplicantForm";
import { getAdminResources, getInitials } from "../../../service/adminService";

export default function DashboardPage({ openModal, notify, setSection }) {
  const [expanded, setExpanded] = useState(false);
  const [resources, setResources] = useState({ users: [], santri: [], ujian: [], jadwal: [], jawaban: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getAdminResources()
      .then((data) => {
        if (active) setResources(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Gagal mengambil data dashboard.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const calonUsers = useMemo(
    () => resources.users.filter((user) => user.role === "calon_santri"),
    [resources.users],
  );

  const activeExams = useMemo(
    () => resources.ujian.filter((exam) => exam.status === "aktif"),
    [resources.ujian],
  );

  const queue = resources.santri.map((student) => [
    getInitials(student.nama_lengkap),
    student.nama_lengkap,
    student.kelas || "Data santri",
    student.created_at ? new Date(student.created_at).toLocaleDateString("id-ID") : "-",
    "Normal",
  ]);
  const visibleQueue = expanded ? queue : queue.slice(0, 3);

  return (
    <section className="admin-page admin-page--dashboard">
      <div className="admin-page-head">
        <div>
          <h1>Assalamu'alaikum, Admin</h1>
          <p>{loading ? "Mengambil ringkasan..." : "Ringkasan pendaftaran terbaru."}</p>
        </div>
        <button className="admin-primary" type="button" onClick={() => openModal("Pendaftaran Baru", "Form input cepat siap digunakan untuk menambahkan calon santri manual.", <QuickApplicantForm notify={notify} />)}>
          <span>+</span> Input Pendaftaran Baru
        </button>
      </div>

      {error && <div className="admin-panel reveal-card">{error}</div>}

      <div className="admin-kpi-grid">
        <KpiCard title="Akun Calon Santri" value={calonUsers.length} note="Akun terdaftar" badge="Aktif" />
        <KpiCard title="Data Santri" value={resources.santri.length} note="Profil tersimpan" badge="Live" />
        <KpiCard title="Ujian Aktif" value={activeExams.length} note={`${resources.ujian.length} total ujian`} badge="Aktif" tone="pink" />
        <KpiCard title="Jadwal Ujian" value={resources.jadwal.length} note="Jadwal tersusun" badge="Total" tone="gray" />
      </div>

      <div className="dashboard-panels">
        <article className="admin-panel chart-panel reveal-card">
          <div className="admin-panel__head">
            <div>
              <h2>Tren Pendaftaran</h2>
              <p>Perbandingan mingguan pendaftar baru</p>
            </div>
            <button className="admin-filter" type="button" onClick={() => notify("Filter aktif", "Grafik menampilkan Mei 2024.")}>Mei 2024</button>
          </div>
          <div className="admin-chart" aria-label="Grafik tren pendaftaran">
            {[calonUsers.length, resources.santri.length, resources.ujian.length, resources.jadwal.length].map((count, index) => {
              const max = Math.max(calonUsers.length, resources.santri.length, resources.ujian.length, resources.jadwal.length, 1);
              const height = Math.max(10, Math.round((count / max) * 100));
              return (
              <button key={index} type="button" style={{ "--height": `${height}%` }} onClick={() => notify("Data minggu dipilih", `Minggu ${index + 1} ditampilkan.`)}>
                <span />
                <small>{["User", "Santri", "Ujian", "Jadwal"][index]}</small>
              </button>
              );
            })}
          </div>
          <div className="admin-legend"><span /> Data pendaftaran <i /> Statistik sistem</div>
        </article>

        <aside className="admin-panel activity-panel reveal-card">
          <h2>Aktivitas Terbaru</h2>
          {[
            [`${calonUsers.length} akun`, "calon santri tercatat.", "Pendaftaran"],
            [`${resources.santri.length} santri`, "sudah punya profil.", "Profil santri"],
            [`${resources.ujian.length} ujian`, "tersedia di sistem.", "Manajemen ujian"],
            [`${resources.jawaban.length} jawaban`, "tersimpan untuk penilaian.", "Hasil ujian"],
          ].map((item, index) => (
            <button className="activity-item" type="button" key={item[0]} onClick={() => notify("Aktivitas dibuka", `${item[0]} ${item[1]}`)}>
              <span>{index + 1}</span>
              <p><strong>{item[0]}</strong> {item[1]} <small>{item[2]}</small></p>
            </button>
          ))}
          <button className="admin-outline" type="button" onClick={() => openModal("Semua Aktivitas", "Daftar aktivitas lengkap untuk admin.")}>Lihat Semua Aktivitas</button>
        </aside>
      </div>

      <article className="admin-table-card reveal-card">
        <div className="admin-table-card__head">
          <h2>Antrean Verifikasi Dokumen</h2>
          <div><span className="admin-pill admin-pill--pink">12 Mendesak</span><span className="admin-pill">34 Standar</span></div>
        </div>
        <table>
          <thead><tr><th>Nama Santri</th><th>Jenis Dokumen</th><th>Tanggal Unggah</th><th>Prioritas</th><th>Aksi</th></tr></thead>
          <tbody>
            {visibleQueue.length ? visibleQueue.map((row) => (
              <tr key={row[1]}>
                <td><span className="admin-avatar admin-avatar--small">{row[0]}</span><strong>{row[1]}</strong></td>
                <td>{row[2]}</td>
                <td>{row[3]}</td>
                <td><span className={`admin-status admin-status--${row[4].toLowerCase()}`}>{row[4]}</span></td>
                <td><button type="button" onClick={() => setSection("dokumen")}>Periksa</button></td>
              </tr>
            )) : (
              <tr><td colSpan="5">Belum ada data santri.</td></tr>
            )}
          </tbody>
        </table>
        <button className="admin-load" type="button" onClick={() => setExpanded((current) => !current)}>{expanded ? "Tutup Antrean" : "Muat Antrean Lainnya"}</button>
      </article>
    </section>
  );
}
