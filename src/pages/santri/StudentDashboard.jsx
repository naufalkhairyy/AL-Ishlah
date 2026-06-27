import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useStudentPortal } from "../../components/useStudentPortal";
import { getDocumentSummary } from "../../service/documentService";

const exams = [
  {
    date: "15",
    title: "Ujian Tes Potensi Akademik (TPA)",
    time: "Pukul 08:00 - 10:00 WIB via Portal Digital",
    tags: "Matematika, IPA, IPS | Online Monitoring",
  },
  {
    date: "16",
    title: "Tes Wawancara & Baca Al-Qur'an",
    time: "Pukul 09:00 WIB - Selesai via Zoom Meeting",
    tags: "Wawancara Wali | Tahsin & Tahfidz",
  },
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { profile, documents, paymentProof, progress, syncing, refreshProgress } = useStudentPortal();

  useEffect(() => {
    refreshProgress?.();
  }, [refreshProgress]);

  const name = profile.namaPanggilan || profile.namaLengkap || "Calon Santri";
  const documentSummary = getDocumentSummary(Object.entries(documents || {}).map(([documentKey, document]) => ({
    ...document,
    documentKey,
    fileName: document.fileName || document.name,
    fileSize: document.fileSize || document.size,
  })));
  const documentMeta = progress.documentsComplete
    ? "Berkas sudah diverifikasi admin"
    : documentSummary.rejectedTotal
      ? "Ada dokumen yang ditolak admin"
      : documentSummary.pendingTotal
        ? "Menunggu verifikasi admin"
        : documentSummary.uploadedTotal
          ? "Lengkapi dokumen lainnya"
          : "Unggah dokumen wajib";
  const paymentMeta = syncing
    ? "Memuat status pembayaran..."
    : paymentProof?.status === "approved"
      ? "Pembayaran disetujui admin"
      : paymentProof?.status === "pending"
        ? "Menunggu verifikasi admin"
        : paymentProof?.status === "rejected"
          ? "Pembayaran ditolak admin"
          : "Upload bukti transfer";
  const paymentState = progress.documentsComplete
    ? (progress.paymentComplete ? "done" : "active")
    : "locked";
  const examMeta = progress.santriId
    ? (progress.examAvailable ? "Ujian sudah tersedia" : "Selesaikan tahap sebelumnya")
    : "Belum menjadi peserta ujian";

  const flow = [
    {
      title: "Isi Data Diri",
      meta: progress.profileComplete ? "Data sudah tersimpan" : "Lengkapi formulir profil",
      state: progress.profileComplete ? "done" : "active",
      to: "/santri/profil",
    },
    {
      title: "Upload Dokumen",
      meta: documentMeta,
      state: progress.profileComplete ? (progress.documentsComplete ? "done" : "active") : "locked",
      to: "/santri/dokumen",
    },
    {
      title: "Pembayaran",
      meta: paymentMeta,
      state: paymentState,
      to: "/santri/pembayaran",
    },
    {
      title: "Ujian Seleksi",
      meta: examMeta,
      state: progress.examAvailable ? "active" : "locked",
      to: "/santri/ujian",
    },
  ];

  const nextStep = flow.find((item) => item.state === "active") || flow[0];
  const statusText = progress.examAvailable
    ? "Siap Mengikuti Ujian"
    : !progress.santriId
      ? "Belum menjadi peserta ujian"
    : syncing
      ? "Memuat Status Pendaftaran"
    : progress.documentsComplete
      ? paymentMeta
      : progress.profileComplete
        ? "Upload Dokumen"
        : "Lengkapi Data Diri";

  return (
    <section className="student-page">
      <div className="student-hero">
        <p>Dashboard Santri</p>
        <h1>Ahlan wa Sahlan, {name}!</h1>
        <span>
          Selamat datang di portal pendaftaran Pesantren Al Ishhlah Al Islamy.
          Lanjutkan tahap pendaftaran sampai semua langkah selesai.
        </span>
      </div>

      <div className="verification-banner">
        <div className="verification-banner__icon">OK</div>
        <div>
          <strong>Status Pendaftaran: <u>{statusText}</u></strong>
          <span>Langkah berikutnya: {nextStep.title}. Klik kartu alur untuk berpindah ke halaman yang dibutuhkan.</span>
        </div>
        <button type="button" onClick={() => navigate(nextStep.to)}>Lanjutkan</button>
      </div>

      <article className="student-card dashboard-payment-upload">
        <div>
          <span className="student-badge student-badge--pink">Pembayaran</span>
          <h2>Upload Bukti Bayar Calon Santri</h2>
          <p>Kirim bukti transfer agar admin bisa melihat dan memverifikasi pembayaran.</p>
        </div>
        <button type="button" className="student-primary-action" onClick={() => navigate("/santri/pembayaran")}>
          Upload Bukti Bayar
        </button>
      </article>

      <article className="student-card flow-card">
        <div className="student-card__heading">
          <h2>Alur Pendaftaran</h2>
          <span className={`student-badge${syncing ? " student-badge--syncing" : ""}`}>
            {syncing ? "Sinkronisasi..." : `${flow.filter((item) => item.state === "done").length}/4 selesai`}
          </span>
        </div>
        <div className="flow-list">
          {flow.map((item, index) => (
            <button
              className={`flow-step is-${item.state}`}
              key={item.title}
              type="button"
              onClick={() => navigate(item.to)}
            >
              <div className="flow-step__dot">{item.state === "done" ? "OK" : index + 1}</div>
              <strong>{item.title}</strong>
              <span>{item.meta}</span>
            </button>
          ))}
        </div>
      </article>

      <div className="dashboard-grid">
        <article className="student-card announcement-card">
          <div className="student-card__heading">
            <h2>Pengumuman Ujian</h2>
            <span className="student-badge student-badge--pink">
              {progress.examAvailable ? "Terjadwal" : "Terkunci"}
            </span>
          </div>
          {exams.map((exam) => (
            <button className="exam-row" key={exam.date} type="button" onClick={() => navigate("/santri/ujian")}>
              <div className="exam-row__date">
                <span>NOV</span>
                <strong>{exam.date}</strong>
              </div>
              <div>
                <h3>{exam.title}</h3>
                <p>{exam.time}</p>
                <small>{exam.tags}</small>
              </div>
            </button>
          ))}
        </article>

        <aside className="question-panel">
          <h2>Punya Pertanyaan?</h2>
          <p>Hubungi admin jika ada kendala saat mengisi profil, upload dokumen, atau pembayaran.</p>
          <button type="button" onClick={() => window.open("https://wa.me/6281234567890", "_blank")}>Live Chat</button>
          <button type="button" onClick={() => window.location.href = "mailto:admin@alishhlah.sch.id"}>Email Admin</button>
        </aside>
      </div>

      <div className="quick-actions">
        <Link to="/santri/profil" className="quick-action">
          <span>01</span>
          <strong>Isi Data Diri</strong>
          <small>Form kosong siap diisi</small>
        </Link>
        <Link to="/santri/dokumen" className="quick-action">
          <span>02</span>
          <strong>Upload Berkas</strong>
          <small>Akta, KK, Pas Foto, Ijazah</small>
        </Link>
        <Link to="/santri/pembayaran" className="quick-action">
          <span>03</span>
          <strong>Bayar Sekarang</strong>
          <small>Upload bukti pembayaran</small>
        </Link>
      </div>
    </section>
  );
}
