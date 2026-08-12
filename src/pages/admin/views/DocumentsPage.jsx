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
import { getInitials } from "../../../service/adminService";

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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getSafeFileName(value) {
  return String(value || "dokumen-santri")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "dokumen-santri";
}

function isImageDocument(document, source = "") {
  const lowerName = String(document.fileName || source).toLowerCase();
  return document.fileType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(lowerName);
}

function isPdfDocument(document, source = "") {
  const lowerName = String(document.fileName || source).toLowerCase();
  return document.fileType === "application/pdf" || lowerName.endsWith(".pdf");
}

async function getDocumentPreviewSource(document) {
  if (document.fileDataUrl) {
    try {
      return await getAuthenticatedPreviewUrl(document.fileDataUrl, "admin");
    } catch {
      return document.localFileKey ? getLocalFileUrl(document.localFileKey) : "";
    }
  }

  return document.localFileKey ? getLocalFileUrl(document.localFileKey) : "";
}

async function printApplicantDocumentsPdf(group) {
  if (!group?.documents?.length) throw new Error("Dokumen calon santri belum tersedia.");

  const previewDocuments = await Promise.all(group.documents.map(async (document) => ({
    ...document,
    previewSource: await getDocumentPreviewSource(document),
  })));
  const printableName = `${getSafeFileName(group.name)}-dokumen.pdf`;
  const generatedAt = new Date().toLocaleString("id-ID");
  const rows = previewDocuments.map((document, index) => {
    const statusLabel = DOCUMENT_STATUS_LABELS[document.status] || document.status || "-";
    const meta = [
      ["Status", statusLabel],
      ["File", document.fileName || "-"],
      ["Tipe", `${document.fileType || "File"} (${formatFileSize(document.fileSize)})`],
      ["Upload", document.submittedAt ? new Date(document.submittedAt).toLocaleString("id-ID") : "-"],
      ["Catatan", document.reviewNote || "-"],
    ];
    const preview = (() => {
      if (!document.previewSource) return "<div class='empty'>Preview file tidak tersedia.</div>";
      if (isImageDocument(document, document.previewSource)) {
        return `<img src="${escapeHtml(document.previewSource)}" alt="${escapeHtml(document.documentTitle)}" />`;
      }
      if (isPdfDocument(document, document.previewSource)) {
        return `<iframe src="${escapeHtml(document.previewSource)}" title="${escapeHtml(document.documentTitle)}"></iframe>`;
      }
      return `<a href="${escapeHtml(document.previewSource)}" target="_blank" rel="noreferrer">Buka file dokumen</a>`;
    })();

    return `
      <section class="doc-page">
        <h2>${index + 1}. ${escapeHtml(document.documentTitle)}</h2>
        <dl>${meta.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>
        <div class="preview">${preview}</div>
      </section>
    `;
  }).join("");

  const printWindow = window.open("", "_blank");
  if (!printWindow) throw new Error("Popup browser diblokir. Izinkan popup untuk mengunduh PDF dokumen.");

  printWindow.document.write(`<!doctype html>
    <html>
      <head>
        <title>${escapeHtml(printableName)}</title>
        <style>
          @page { size: A4; margin: 14mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #172218; font-family: Arial, sans-serif; }
          header { margin-bottom: 18px; padding-bottom: 14px; border-bottom: 2px solid #087020; }
          h1 { margin: 0 0 6px; font-size: 24px; }
          h2 { margin: 0 0 12px; font-size: 18px; color: #087020; }
          p { margin: 0; color: #52604e; }
          dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin: 0 0 14px; }
          dl div { padding: 9px 10px; border: 1px solid #d6e5d1; border-radius: 6px; }
          dt { color: #52604e; font-size: 10px; font-weight: 700; text-transform: uppercase; }
          dd { margin: 3px 0 0; font-weight: 700; word-break: break-word; }
          .doc-page { page-break-after: always; }
          .doc-page:last-child { page-break-after: auto; }
          .preview { min-height: 620px; display: grid; place-items: center; border: 1px solid #d6e5d1; border-radius: 8px; overflow: hidden; background: #f7fbf4; }
          img, iframe { width: 100%; height: 620px; border: 0; object-fit: contain; }
          .empty { color: #52604e; font-weight: 700; }
        </style>
      </head>
      <body>
        <header>
          <h1>Dokumen Calon Santri - ${escapeHtml(group.name)}</h1>
          <p>ID Calon Santri: ${escapeHtml(group.calonSantriId || "-")} | ID Santri: ${escapeHtml(group.santriId || "-")} | Dicetak: ${escapeHtml(generatedAt)}</p>
        </header>
        ${rows}
        <script>
          document.title = ${JSON.stringify(printableName)};
          window.addEventListener("load", () => setTimeout(() => window.print(), 700));
        </script>
      </body>
    </html>`);
  printWindow.document.close();
}

function getApplicantKey(document) {
  return String(document.calonSantriId || document.userId || document.studentName || document.username || "unknown");
}

function buildApplicantGroups(documents) {
  const groups = new Map();

  documents.forEach((document) => {
    const key = getApplicantKey(document);
    const current = groups.get(key) || {
      key,
      name: document.studentName || document.username || "Calon Santri",
      username: document.username,
      initials: document.initials || getInitials(document.studentName || document.username || "CS"),
      calonSantriId: document.calonSantriId,
      santriId: document.santriId,
      latestSubmittedAt: document.submittedAt,
      documents: [],
    };

    current.documents.push(document);
    current.latestSubmittedAt = [current.latestSubmittedAt, document.submittedAt]
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))[0] || current.latestSubmittedAt;
    current.santriId = current.santriId || document.santriId;
    current.calonSantriId = current.calonSantriId || document.calonSantriId;
    groups.set(key, current);
  });

  return Array.from(groups.values()).sort((a, b) => (
    (new Date(b.latestSubmittedAt).getTime() || 0) - (new Date(a.latestSubmittedAt).getTime() || 0)
  ));
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
  const [selectedApplicantKey, setSelectedApplicantKey] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [note, setNote] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [printingApplicant, setPrintingApplicant] = useState(false);

  const loadDocuments = async () => {
    setLoading(true);
    setError("");
    try {
      const nextDocuments = await getAdminDocumentSubmissions();
      setDocuments(nextDocuments);
      setSelectedApplicantKey((current) => (
        current && nextDocuments.some((item) => getApplicantKey(item) === current)
          ? current
          : nextDocuments[0] ? getApplicantKey(nextDocuments[0]) : ""
      ));
      setSelectedDocumentId((current) => (
        current && nextDocuments.some((item) => item.id === current)
          ? current
          : nextDocuments[0]?.id || ""
      ));
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

  const filteredDocuments = useMemo(() => documents.filter((document) => {
    const categoryMatches = category === "Semua" || document.documentTitle === category;
    const statusMatches = statusFilter === "Semua" || document.status === statusFilter;
    return categoryMatches && statusMatches;
  }), [category, documents, statusFilter]);

  const applicantGroups = useMemo(() => buildApplicantGroups(filteredDocuments), [filteredDocuments]);
  const currentGroup = applicantGroups.find((group) => group.key === selectedApplicantKey) || applicantGroups[0] || null;
  const groupDocuments = currentGroup?.documents || [];
  const current = groupDocuments.find((item) => item.id === selectedDocumentId) || groupDocuments[0] || null;

  const pendingCount = documents.filter((document) => document.status === "pending").length;
  const verifiedCount = documents.filter((document) => document.status === "verified").length;
  const rejectedCount = documents.filter((document) => document.status === "rejected").length;

  useEffect(() => {
    if (!currentGroup) {
      setSelectedApplicantKey("");
      setSelectedDocumentId("");
      return;
    }

    if (selectedApplicantKey !== currentGroup.key) {
      setSelectedApplicantKey(currentGroup.key);
    }

    if (!current || selectedDocumentId !== current.id) {
      setSelectedDocumentId(current?.id || "");
    }
  }, [current, currentGroup, selectedApplicantKey, selectedDocumentId]);
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
        note,
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
        note,
      );

      await loadDocuments();
      notify(
        "ID santri dibuat",
        `${current.studentName || current.username} sudah dipromote menjadi santri dan dapat dijadwalkan ujian.`,
      );
      setNote("");
    } catch (requestError) {
      notify("Gagal membuat ID santri", requestError.message || "Gagal mengaktifkan calon santri.");
    } finally {
      setPromoting(false);
    }
  };

  const downloadCurrentApplicantPdf = async () => {
    if (!currentGroup) return;
    setPrintingApplicant(true);
    try {
      await printApplicantDocumentsPdf(currentGroup);
      notify("PDF dokumen disiapkan", `Pilih Save as PDF untuk dokumen ${currentGroup.name}.`);
    } catch (requestError) {
      notify("PDF gagal dibuat", requestError.message || "Gagal menyiapkan PDF dokumen.");
    } finally {
      setPrintingApplicant(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Antrean Verifikasi</h1>
          <p>{loading ? "Mengambil dokumen..." : "Tinjau kelengkapan berkas calon santri tahun ajaran 2024/2025."}</p>
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
        </aside>
        <article className="doc-queue reveal-card">
          <h3>Calon Santri</h3>
          {applicantGroups.map((group) => {
            const groupPending = group.documents.filter((document) => document.status === "pending").length;
            const groupVerified = group.documents.filter((document) => document.status === "verified").length;
            return (
            <button
              className={currentGroup?.key === group.key ? "is-active" : ""}
              type="button"
              key={group.key}
              onClick={() => {
                setSelectedApplicantKey(group.key);
                setSelectedDocumentId(group.documents[0]?.id || "");
                setNote("");
              }}
            >
              <span className="empty-thumb">{group.initials}</span>
              <span className="doc-queue__text">
                <strong>{group.name}</strong>
                <small>{group.documents.length} dokumen, {groupPending} menunggu</small>
                <em>Update {formatDocumentTime(group.latestSubmittedAt)}</em>
              </span>
              <span className={`doc-review-badge is-${groupPending ? "pending" : "verified"}`}>{groupVerified}/{group.documents.length}</span>
            </button>
            );
          })}
          {error && <p>{error}</p>}
          {!applicantGroups.length && !error && <p>{loading ? "Memuat dokumen..." : "Belum ada calon santri pada filter ini."}</p>}
        </article>
        <section className="doc-detail reveal-card">
          {current ? (
            <>
              <div className="admin-panel__head">
                <div><h2>{currentGroup?.name || "Detail Calon Santri"}</h2><p>Pilih dokumen di bawah, lalu verifikasi satu per satu.</p></div>
                <div className="doc-detail-actions">
                  <button className="admin-outline" type="button" disabled={printingApplicant} onClick={downloadCurrentApplicantPdf}>
                    {printingApplicant ? "Menyiapkan..." : "Unduh PDF"}
                  </button>
                  <OpenDocumentButton document={current}>Perbesar</OpenDocumentButton>
                </div>
              </div>
              <div className="doc-document-tabs">
                {groupDocuments.map((document) => (
                  <button
                    className={current.id === document.id ? "is-active" : ""}
                    type="button"
                    key={document.id}
                    onClick={() => {
                      setSelectedDocumentId(document.id);
                      setNote(document.reviewNote || "");
                    }}
                  >
                    <span>
                      <strong>{document.documentTitle}</strong>
                      <small>{formatDocumentTime(document.submittedAt)}</small>
                    </span>
                    <em className={`doc-review-badge is-${getStatusClass(document.status)}`}>{DOCUMENT_STATUS_LABELS[document.status]}</em>
                  </button>
                ))}
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
