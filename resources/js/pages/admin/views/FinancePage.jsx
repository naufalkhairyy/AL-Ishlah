import { useEffect, useMemo, useState } from "react";
import DocumentMock from "../components/DocumentMock";
import { downloadText } from "../utils/downloadText";
import {
  formatCurrency,
  getPayments,
  reviewPayment,
} from "../../../service/paymentService";
import { getPreviewUrl, openUploadedFile } from "../../../service/filePreview";
import { getAuthToken } from "../../../service/api";

const statusLabels = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

function PaymentProofPreview({ payment }) {
  const sourceUrl = getPreviewUrl(payment.fileDataUrl || payment.bukti_bayar || payment.bukti_pembayaran_url || "");
  const [authorizedPreview, setAuthorizedPreview] = useState(null);
  const previewSource = authorizedPreview?.sourceUrl === sourceUrl ? authorizedPreview.url : sourceUrl;
  const isImage = payment.fileType?.startsWith("image/") || previewSource.startsWith("data:image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(payment.fileName || "");
  const isPdf = payment.fileType === "application/pdf" || payment.fileName?.toLowerCase().endsWith(".pdf") || previewSource.startsWith("data:application/pdf");

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    if (!sourceUrl || sourceUrl.startsWith("data:") || sourceUrl.startsWith("blob:")) return undefined;

    const token = getAuthToken("admin");
    fetch(sourceUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((response) => {
        if (!response.ok) throw new Error("Gagal mengambil bukti transfer.");
        return response.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (active) setAuthorizedPreview({ sourceUrl, url: objectUrl });
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [sourceUrl]);

  return (
    <div className="payment-proof-viewer">
      <div className="payment-proof-viewer__bar">
        <div>
          <strong>{payment.fileName}</strong>
          <small>{payment.fileType || "File bukti transfer"}</small>
        </div>
        <button type="button" onClick={() => openUploadedFile(sourceUrl, payment.fileName, payment.fileType)}>
          Buka Tab Baru
        </button>
      </div>
      <div className="payment-proof-viewer__canvas">
        {isImage && <img src={previewSource} alt={`Bukti transfer ${payment.studentName || payment.username}`} />}
        {isPdf && !isImage && <iframe title={`Bukti transfer ${payment.id}`} src={previewSource} />}
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

export default function FinancePage({ notify }) {
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  const loadPayments = async () => {
    try {
      const nextPayments = await getPayments();
      setPayments(nextPayments);
      setSelectedPayment((current) => (
        current
          ? nextPayments.find((payment) => String(payment.id) === String(current.id)) || current
          : current
      ));
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Gagal mengambil data pembayaran dari backend.");
    }
  };

  useEffect(() => {
    let active = true;
    const refreshPayments = () => {
      getPayments()
        .then((nextPayments) => {
          if (!active) return;
          setPayments(nextPayments);
          setSelectedPayment((current) => (
            current
              ? nextPayments.find((payment) => String(payment.id) === String(current.id)) || current
              : current
          ));
          setError("");
        })
        .catch((loadError) => {
          if (!active) return;
          setError(loadError.message || "Gagal mengambil data pembayaran dari backend.");
        });
    };

    refreshPayments();
    const intervalId = window.setInterval(refreshPayments, 10000);
    const refreshOnFocus = () => {
      if (!document.hidden) refreshPayments();
    };
    window.addEventListener("manual-payments-updated", refreshPayments);
    window.addEventListener("focus", refreshPayments);
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("manual-payments-updated", refreshPayments);
      window.removeEventListener("focus", refreshPayments);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, []);

  const pendingPayments = useMemo(
    () => payments.filter((payment) => payment.status === "pending"),
    [payments],
  );
  const approvedPayments = useMemo(
    () => payments.filter((payment) => payment.status === "approved"),
    [payments],
  );
  const rejectedPayments = useMemo(
    () => payments.filter((payment) => payment.status === "rejected"),
    [payments],
  );
  const approvedTotal = approvedPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0);

  const handleReview = async (payment, status) => {
    try {
      const updated = await reviewPayment(payment.id, status, reviewNote);
      await loadPayments();
      setSelectedPayment(updated);
      setReviewNote("");
      notify(
        status === "approved" ? "Pembayaran disetujui" : "Pembayaran ditolak",
        `${payment.studentName || payment.username} ditandai ${statusLabels[status]}.`,
      );
    } catch (reviewError) {
      notify("Gagal update status", reviewError.message || "Status pembayaran gagal diperbarui di backend.");
    }
  };

  const exportCsv = [
    "id,username,nominal,status,tanggal_kirim,tanggal_review",
    ...payments.map((payment) => [
      payment.id,
      payment.username,
      payment.amount,
      payment.status,
      payment.submittedAt,
      payment.reviewedAt || "",
    ].join(",")),
  ].join("\n");

  return (
    <section className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Manajemen Keuangan</h1>
          <p>Pantau arus kas, verifikasi pembayaran santri baru, dan kelola rekening pesantren.</p>
        </div>
      </div>

      <div className="finance-stats">
        <article className="finance-balance reveal-card"><p>Total Disetujui</p><strong>{formatCurrency(approvedTotal)}</strong><small>{approvedPayments.length} pembayaran valid</small><span>Transfer manual calon santri</span></article>
        <article className="finance-pending reveal-card"><p>Antrian Verifikasi</p><strong>{pendingPayments.length}</strong><span>Disetujui <b>{approvedPayments.length}</b></span><span>Ditolak <b>{rejectedPayments.length}</b></span></article>
        <article className="finance-report reveal-card"><DocumentMock compact /><h2>Laporan Pembayaran</h2><p>Export data pembayaran manual.</p><button className="admin-primary" type="button" onClick={() => downloadText("laporan-pembayaran.csv", exportCsv)}>Unduh CSV</button></article>
      </div>

      <div className="finance-layout">
        <aside className="admin-panel finance-form reveal-card">
          <h2>Review Bukti Transfer</h2>
          {selectedPayment ? (
            <>
              <div className="payment-review-summary">
                <span className={`admin-status admin-status--${selectedPayment.status === "approved" ? "verified" : "pending"}`}>
                  {statusLabels[selectedPayment.status]}
                </span>
                <h3>{selectedPayment.studentName || selectedPayment.username}</h3>
                <p>{selectedPayment.id}</p>
                <dl>
                  <div><dt>Nominal</dt><dd>{formatCurrency(selectedPayment.amount)}</dd></div>
                  <div><dt>Dikirim</dt><dd>{new Date(selectedPayment.submittedAt).toLocaleString("id-ID")}</dd></div>
                  <div><dt>Metode</dt><dd>{selectedPayment.method}</dd></div>
                </dl>
              </div>
              <PaymentProofPreview payment={selectedPayment} />
              <label>Catatan Admin<textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Opsional, isi alasan jika ditolak" /></label>
              <div className="payment-review-actions">
                <button className="admin-primary" type="button" onClick={() => handleReview(selectedPayment, "approved")}>Setujui</button>
                <button className="admin-outline" type="button" onClick={() => handleReview(selectedPayment, "rejected")}>Tolak</button>
              </div>
            </>
          ) : (
            <p>Pilih salah satu transaksi di tabel untuk melihat bukti transfer dan melakukan verifikasi.</p>
          )}
        </aside>
        <article className="admin-table-card finance-table reveal-card">
          <div className="admin-table-card__head"><div><h2>Transaksi Pembayaran Manual</h2><p>Menampilkan bukti transfer yang diupload calon santri.</p></div><button type="button" onClick={() => { loadPayments(); notify("Data diperbarui", "Daftar pembayaran manual disegarkan."); }}>Refresh</button></div>
          {error && <div className="backend-inline-note">{error}</div>}
          <table>
            <thead><tr><th>Santri</th><th>Bukti</th><th>Nominal</th><th>Update</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {payments.length ? payments.map((payment) => (
                <tr key={payment.id}>
                  <td><span className="admin-avatar admin-avatar--small">{payment.initials}</span><div><strong>{payment.studentName || payment.username}</strong><small>ID: {payment.id}</small></div></td>
                  <td><span className={`admin-status admin-status--${payment.status === "approved" ? "verified" : "pending"}`}>{payment.category}</span><small>{payment.fileName}</small></td>
                  <td><strong>{formatCurrency(payment.amount)}</strong><small>{payment.method}</small></td>
                  <td>{new Date(payment.updatedAt || payment.submittedAt).toLocaleString("id-ID")}</td>
                  <td><span className={`admin-status admin-status--${payment.status === "approved" ? "verified" : "pending"}`}>{statusLabels[payment.status]}</span></td>
                  <td><button type="button" onClick={() => { setSelectedPayment(payment); setReviewNote(payment.reviewNote || ""); }}>Review</button></td>
                </tr>
              )) : (
                <tr><td colSpan="6">Belum ada bukti pembayaran yang diupload calon santri.</td></tr>
              )}
            </tbody>
          </table>
          <div className="admin-pagination"><span>Halaman {page} dari 1</span><button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Sebelumnya</button><button type="button" disabled onClick={() => setPage((value) => Math.min(1, value + 1))}>Berikutnya</button></div>
        </article>
      </div>
    </section>
  );
}
