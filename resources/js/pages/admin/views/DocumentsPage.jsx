import { useEffect, useMemo, useState } from "react";
import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPES,
  formatFileSize,
  getAdminDocumentSubmissions,
  updateCalonSantriDocumentStatus,
  updateCalonSantriDocumentFieldStatus,
} from "../../../service/documentService";
import { getAuthenticatedPreviewUrl, openUploadedFile } from "../../../service/filePreview";
import { getLocalFileUrl } from "../../../service/localFileStore";

const statusFilters = [
  { key: "Semua", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "verified", label: "Diterima" },
  { key: "rejected", label: "Ditolak" },
];

function getStatusClass(status) {
  if (status === "verified") return "verified";
  if (status === "rejected") return "rejected";
  return "pending";
}

function formatDocumentTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DocumentPreview({ document }) {
  const [previewSource, setPreviewSource] = useState("");

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    const loadPreview = async () => {
      try {
        let source = "";
        if (document.fileDataUrl) {
          try {
            source = await getAuthenticatedPreviewUrl(document.fileDataUrl, "admin");
          } catch {
            source = document.localFileKey ? await getLocalFileUrl(document.localFileKey) : "";
          }
        } else {
          source = await getLocalFileUrl(document.localFileKey);
        }
        objectUrl = source;
        if (active) setPreviewSource(source);
      } catch {
        if (active) setPreviewSource("");
      }
    };

    loadPreview();

    return () => {
      active = false;
      if (objectUrl?.startsWith("blob:")) URL.revokeObjectURL(objectUrl);
    };
  }, [document.fileDataUrl, document.localFileKey]);

  if (!previewSource) {
    return (
      <div className="payment-proof-viewer document-proof-viewer">
        <div className="payment-proof-viewer__fallback">
          <strong>Preview sedang disiapkan</strong>
          <span>Refresh halaman admin jika file baru saja diunggah.</span>
        </div>
      </div>
    );
  }

  const lowerName = String(document.fileName || previewSource).toLowerCase();
  const isImage = document.fileType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(lowerName);
  const isPdf = document.fileType === "application/pdf" || lowerName.endsWith(".pdf");

  return (
    <div className="payment-proof-viewer document-proof-viewer">
      <div className="payment-proof-viewer__bar">
        <div>
          <strong>{document.fileName}</strong>
          <small>{document.fileType || "File dokumen"} - {formatFileSize(document.fileSize)}</small>
        </div>
        <button type="button" onClick={() => openUploadedFile(document.fileDataUrl || previewSource, document.fileName, document.fileType, "admin")}>Buka Tab Baru</button>
      </div>
      <div className="payment-proof-viewer__canvas">
        {isImage && <img src={previewSource} alt={`${document.documentTitle} ${document.studentName || document.username}`} />}
        {isPdf && !isImage && <iframe title={`Dokumen ${document.id}`} src={previewSource} />}
        {!isImage && !isPdf && (
          <div className="payment-proof-viewer__fallback">
            <strong>Preview file tidak tersedia</strong>
            <span>Gunakan tombol Buka Tab Baru untuk memeriksa file ini.</span>
          </div>
        )}
      </div>
    </div>
  );
}

function OpenDocumentButton({ document, children = "Perbesar" }) {
  const [opening, setOpening] = useState(false);

  const handleOpen = async () => {
    setOpening(true);
    try {
      let previewUrl = "";
      if (document.fileDataUrl) {
        try {
          previewUrl = await getAuthenticatedPreviewUrl(document.fileDataUrl, "admin");
        } catch {
          previewUrl = document.localFileKey ? await getLocalFileUrl(document.localFileKey) : "";
        }
      } else {
        previewUrl = await getLocalFileUrl(document.localFileKey);
      }

      if (!previewUrl) throw new Error("Preview file belum tersedia.");
      await openUploadedFile(document.fileDataUrl || previewUrl, document.fileName, document.fileType, "admin");
    } catch (error) {
      alert(error.message || "Gagal membuka preview dokumen.");
    } finally {
      setOpening(false);
    }
  };

  return (
    <button type="button" disabled={opening || (!document.fileDataUrl && !document.localFileKey)} onClick={handleOpen}>
      {opening ? "Membuka..." : children}
    </button>
  );
}

export default function DocumentsPage({ notify }) {
  const [category, setCategory] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [promoting, setPromoting] = useState(false);

  const loadDocuments = async () => {
    setLoading(true);
    setError("");
    try {
      const nextDocuments = await getAdminDocumentSubmissions();
      setDocuments(nextDocuments);
      setSelected((current) => {
        if (current && nextDocuments.some((item) => item.id === current.id)) {
          return nextDocuments.find((item) => item.id === current.id);
        }
        return nextDocuments[0] || null;
      });
    } catch (requestError) {
      setError(requestError.message || "Gagal mengambil dokumen calon santri.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const refreshDocuments = () => {
      Promise.resolve().then(loadDocuments);
    };
    refreshDocuments();
    window.addEventListener("manual-documents-updated", refreshDocuments);
    return () => window.removeEventListener("manual-documents-updated", refreshDocuments);
  }, []);

  const queue = useMemo(() => documents.filter((document) => {
    const categoryMatches = category === "Semua" || document.documentTitle === category;
    const statusMatches = statusFilter === "Semua" || document.status === statusFilter;
    return categoryMatches && statusMatches;
  }), [category, documents, statusFilter]);

  const current = selected && queue.some((item) => item.id === selected.id)
    ? selected
    : queue[0] || null;

  const pendingCount = documents.filter((document) => document.status === "pending").length;
  const verifiedCount = documents.filter((document) => document.status === "verified").length;
  const rejectedCount = documents.filter((document) => document.status === "rejected").length;
  const completeDocument = async (status) => {
    if (!current) return;
    setReviewing(true);
    try {
      if (!current.calonSantriId) throw new Error("calon_santri_id tidak ditemukan untuk dokumen ini.");
      if (!current.backendField) throw new Error("Field dokumen tidak ditemukan untuk berkas ini.");

      const nextStatus = status === "verified" ? "diterima" : "ditolak";
      await updateCalonSantriDocumentFieldStatus(
        current.calonSantriId,
        current.backendField,
        nextStatus,
        note || (status === "verified" ? "File jelas" : ""),
      );

      await loadDocuments();
      notify(
        status === "verified" ? "Dokumen diterima" : "Berkas ditolak",
        `${current.documentTitle} milik ${current.studentName || current.username} diproses.`,
      );
      setNote("");
    } catch (requestError) {
      notify("Verifikasi gagal", requestError.message || "Gagal memperbarui status dokumen.");
    } finally {
      setReviewing(false);
    }
  };

  const promoteCurrentCalonSantri = async () => {
    if (!current) return;
    setPromoting(true);
    try {
      if (!current.calonSantriId) throw new Error("calon_santri_id tidak ditemukan untuk dokumen ini.");

      await updateCalonSantriDocumentStatus(
        current.calonSantriId,
        "diterima",
        note || "Dokumen lengkap, calon santri dipromote menjadi santri.",
      );

      await loadDocuments();
      notify(
        "ID santri dibuat",
        `${current.studentName || current.username} sudah dipromote menjadi santri dan dapat dijadwalkan ujian.`,
      );
      setNote("");
    } catch (requestError) {
      notify("Gagal membuat ID santri", requestError.message || "Gagal promote calon santri.");
    } finally {
      setPromoting(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Antrean Verifikasi</h1>
          <p>{loading ? "Mengambil dokumen dari backend..." : "Tinjau kelengkapan berkas calon santri tahun ajaran 2024/2025."}</p>
        </div>
        <div className="admin-head-actions">
          <span className="admin-pill admin-pill--pink">{pendingCount} Menunggu</span>
          <span className="admin-pill">{verifiedCount} Diterima</span>
          <span className="admin-pill admin-pill--gray">{rejectedCount} Ditolak</span>
        </div>
      </div>

      <div className="document-layout">
        <aside className="doc-categories reveal-card">
          <h3>Status</h3>
          <div className="doc-status-tabs">
            {statusFilters.map((item) => (
              <button className={statusFilter === item.key ? "is-active" : ""} type="button" key={item.key} onClick={() => setStatusFilter(item.key)}>
                <span>{item.label}</span>
                <b>{item.key === "Semua" ? documents.length : documents.filter((document) => document.status === item.key).length}</b>
              </button>
            ))}
          </div>

          <h3>Kategori</h3>
          {["Semua", ...DOCUMENT_TYPES.map((item) => item.title)].map((item) => (
            <button className={category === item ? "is-active" : ""} type="button" key={item} onClick={() => setCategory(item)}>
              <span>{item}</span><b>{item === "Semua" ? documents.length : documents.filter((document) => document.documentTitle === item).length}</b>
            </button>
          ))}
          <div className="doc-guide"><h3>Panduan Verifikasi</h3><p>Pastikan file jelas, nama dokumen sesuai, dan data dapat dibaca sebelum disetujui.</p></div>
        </aside>
        <article className="doc-queue reveal-card">
          <h3>Antrean Saat Ini</h3>
          {queue.map((item) => (
            <button className={current?.id === item.id ? "is-active" : ""} type="button" key={item.id} onClick={() => setSelected(item)}>
              <span className="empty-thumb">{item.initials || item.documentTitle.slice(0, 2).toUpperCase()}</span>
              <span className="doc-queue__text">
                <strong>{item.studentName || item.username}</strong>
                <small>{item.documentTitle}</small>
                <em>{formatDocumentTime(item.submittedAt)}</em>
              </span>
              <span className={`doc-review-badge is-${getStatusClass(item.status)}`}>{DOCUMENT_STATUS_LABELS[item.status]}</span>
            </button>
          ))}
          {error && <p>{error}</p>}
          {!queue.length && !error && <p>{loading ? "Memuat dokumen..." : "Belum ada dokumen pada kategori ini."}</p>}
        </article>
        <section className="doc-detail reveal-card">
          {current ? (
            <>
              <div className="admin-panel__head">
                <div><h2>Detail Dokumen</h2><p>{current.documentTitle} - {current.studentName || current.username}</p></div>
                <OpenDocumentButton document={current}>Perbesar</OpenDocumentButton>
              </div>
              <DocumentPreview document={current} />
              <div className="doc-review-summary">
                <span className={`doc-review-badge is-${getStatusClass(current.status)}`}>{DOCUMENT_STATUS_LABELS[current.status]}</span>
                <strong>{current.studentName || current.username}</strong>
                <small>{current.documentTitle}</small>
              </div>
              <div className="doc-meta"><span>Status <b>{DOCUMENT_STATUS_LABELS[current.status]}</b></span><span>Santri ID <b>{current.santriId || "Belum dibuat"}</b></span><span>Calon Santri ID <b>{current.calonSantriId || "-"}</b></span><span>Tipe File <b>{current.fileType || "File"} ({formatFileSize(current.fileSize)})</b></span><span>Waktu Upload <b>{new Date(current.submittedAt).toLocaleString("id-ID")}</b></span></div>
              <div className={`doc-santri-status${current.santriId ? " is-ready" : ""}`}>
                <div>
                  <strong>{current.santriId ? `Peserta ujian #${current.santriId}` : "Belum resmi menjadi santri"}</strong>
                  <span>{current.santriId ? "Santri sudah bisa masuk daftar generate jadwal ujian." : "Klik Buat ID Santri setelah berkas calon lengkap dan diterima."}</span>
                </div>
                {!current.santriId && (
                  <button className="admin-primary" type="button" disabled={promoting || reviewing} onClick={promoteCurrentCalonSantri}>
                    {promoting ? "Membuat ID..." : "Buat ID Santri"}
                  </button>
                )}
              </div>
              <div className="doc-actions"><button className="admin-danger" type="button" disabled={reviewing || promoting || current.status === "rejected"} onClick={() => completeDocument("rejected")}>Tolak Berkas</button><button className="admin-primary" type="button" disabled={reviewing || promoting || current.status === "verified"} onClick={() => completeDocument("verified")}>{reviewing ? "Memproses..." : "Terima Dokumen"}</button></div>
              <label className="doc-note">Catatan Verifikasi (Opsional)<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Contoh: Foto kurang jelas atau tidak sesuai background..." /></label>
            </>
          ) : <div className="empty-state">Semua dokumen pada kategori ini sudah diproses.</div>}
        </section>
      </div>
    </section>
  );
}
