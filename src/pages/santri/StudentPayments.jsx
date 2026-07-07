import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStudentPortal } from "../../components/useStudentPortal";
import {
  BANK_ACCOUNT,
  REGISTRATION_FEE,
  formatCurrency,
  submitManualPayment,
} from "../../service/paymentService";
import { openUploadedFile } from "../../service/filePreview";

const statusLabels = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

function getPaymentTimestamp(payment) {
  const value = payment?.updatedAt || payment?.submittedAt || payment?.uploadedAt || 0;
  return new Date(value).getTime() || 0;
}

function pickLatestPayment(currentPayment, contextPayment) {
  if (!currentPayment) return contextPayment || null;
  if (!contextPayment) return currentPayment;
  return getPaymentTimestamp(contextPayment) >= getPaymentTimestamp(currentPayment)
    ? contextPayment
    : currentPayment;
}

export default function StudentPayments() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { paymentProof, setPaymentProof, progress, syncing, refreshPayment } = useStudentPortal();
  const [payment, setPayment] = useState(null);
  const [selectedProof, setSelectedProof] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;

    refreshPayment?.()
      .then((currentPayment) => {
        if (active) setPayment(currentPayment);
      })
      .catch((error) => {
        if (active) console.warn("Gagal mengambil pembayaran:", error);
      });

    return () => {
      active = false;
    };
  }, [refreshPayment]);

  const copyRekening = async () => {
    try {
      await navigator.clipboard.writeText(BANK_ACCOUNT.number);
      alert("Nomor rekening berhasil disalin.");
    } catch {
      alert(`Nomor rekening: ${BANK_ACCOUNT.number}`);
    }
  };

  const handleProof = async (file) => {
    if (!file) return;
    setUploading(true);

    try {
      const submission = await submitManualPayment(file);
      setPayment(submission);
      setPaymentProof({
        name: submission.fileName,
        size: submission.fileSize,
        type: submission.fileType,
        status: submission.status,
        uploadedAt: submission.submittedAt,
        submittedAt: submission.submittedAt,
        updatedAt: submission.updatedAt || submission.submittedAt,
        fileName: submission.fileName,
        fileType: submission.fileType,
        fileDataUrl: submission.fileDataUrl,
      });
      setSelectedProof(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      alert(`${file.name} berhasil dikirim. Menunggu verifikasi admin.`);
    } catch (error) {
      alert(error.message || "Gagal mengirim bukti pembayaran.");
    } finally {
      setUploading(false);
    }
  };

  const displayedPayment = pickLatestPayment(payment, paymentProof);
  const status = displayedPayment?.status || "unpaid";
  const loadingStatus = syncing;
  const statusText = loadingStatus
    ? "Sinkron..."
    : statusLabels[status] || "Belum Ada Pembayaran";
  const statusDescription = loadingStatus
    ? "Memuat data terbaru."
    : displayedPayment
      ? `${displayedPayment.fileName || displayedPayment.name} - ${new Date(displayedPayment.submittedAt || displayedPayment.uploadedAt).toLocaleString("id-ID")}`
      : "Belum ada bukti.";

  return (
    <section className="student-page">
      <div className="student-page-title">
        <h1>Payments</h1>
        <p>Upload bukti transfer dan lihat statusnya.</p>
      </div>

      <div className="payment-summary">
        <article className="student-card">
          <span>Total Tagihan</span>
          <strong>{formatCurrency(REGISTRATION_FEE)}</strong>
          <p>Biaya pendaftaran calon santri baru</p>
        </article>
        <article className="student-card">
          <span>Status</span>
          <strong>{statusText}</strong>
          <p>{statusDescription}</p>
        </article>
      </div>

      <article className="student-card payment-upload-card">
        <div>
          <span className="student-badge student-badge--pink">Upload ke Admin</span>
          <h2>Upload Bukti Pembayaran</h2>
          <p>Upload bukti transfer.</p>
        </div>
        <input
          accept=".pdf,.jpg,.jpeg,.png"
          className="payment-upload-input"
          ref={fileInputRef}
          type="file"
          onChange={(event) => setSelectedProof(event.target.files?.[0] || null)}
        />
        <div className="payment-upload-card__actions">
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {displayedPayment ? "Ganti File" : "Pilih File"}
          </button>
          <button type="button" className="student-primary-action" onClick={() => handleProof(selectedProof)} disabled={!selectedProof || uploading}>
            {uploading ? "Kirim..." : "Kirim"}
          </button>
        </div>
        <small>{selectedProof ? selectedProof.name : "PDF, JPG, JPEG, PNG. Maksimal 5120 KB atau 5 MB."}</small>
      </article>

      <article className="student-card payment-detail">
        <h2>Rekening</h2>
        <div className="bank-box">
          <span>{BANK_ACCOUNT.bank}</span>
          <strong>{BANK_ACCOUNT.number}</strong>
          <p>a.n. {BANK_ACCOUNT.name}</p>
        </div>
        <div className="payment-actions">
          <button type="button" onClick={copyRekening}>Salin</button>
          <button type="button" className="is-outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>Upload</button>
        </div>
      </article>

      <article className="student-card payment-history">
        <h2>Status</h2>
        <div>
          <span>{loadingStatus ? "Sinkron..." : displayedPayment ? statusLabels[displayedPayment.status] : "Belum ada bukti."}</span>
          <small>{loadingStatus ? "Memuat data terbaru." : displayedPayment ? `${displayedPayment.fileName || displayedPayment.name} - ${new Date(displayedPayment.submittedAt || displayedPayment.uploadedAt).toLocaleString("id-ID")}` : "Upload bukti transfer."}</small>
          {displayedPayment?.reviewNote && <small>Catatan admin: {displayedPayment.reviewNote}</small>}
          {displayedPayment?.fileDataUrl && (
            <button type="button" onClick={() => openUploadedFile(displayedPayment.fileDataUrl, displayedPayment.fileName || displayedPayment.name, displayedPayment.fileType || displayedPayment.type)}>
              Lihat File
            </button>
          )}
        </div>
      </article>

      <div className="student-action-row">
        <button className="student-secondary-action" type="button" onClick={() => navigate("/santri/dokumen")}>Kembali ke Dokumen</button>
        <button
          className="student-primary-action"
          type="button"
          onClick={() => progress.examAvailable ? navigate("/santri/ujian") : alert(progress.santriId ? "Pembayaran harus disetujui admin sebelum lanjut ujian." : "Belum menjadi peserta ujian.")}
        >
          Lanjut Ujian
        </button>
      </div>
    </section>
  );
}
