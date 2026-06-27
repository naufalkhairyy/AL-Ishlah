import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStudentPortal } from "../../components/useStudentPortal";
import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPES,
  formatFileSize,
  getDocumentByKey,
  getDocumentsForCurrentUser,
  submitManualDocument,
} from "../../service/documentService";
import { openUploadedFile } from "../../service/filePreview";
import { getLocalFileUrl } from "../../service/localFileStore";

export default function StudentDocuments() {
  const navigate = useNavigate();
  const { documents, progress, refreshDocuments } = useStudentPortal();
  const [selectedDoc, setSelectedDoc] = useState(DOCUMENT_TYPES[0].key);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploadingKey, setUploadingKey] = useState("");
  const inputRefs = useRef({});

  const loadDocuments = async () => {
    try {
      const backendDocuments = refreshDocuments
        ? await refreshDocuments()
        : await getDocumentsForCurrentUser();
      setUploadedDocs(backendDocuments);
    } catch (error) {
      setUploadedDocs([]);
      console.warn("Gagal mengambil dokumen backend:", error);
    }
  };

  useEffect(() => {
    loadDocuments();
    const refresh = () => { loadDocuments(); };
    window.addEventListener("manual-documents-updated", refresh);
    return () => window.removeEventListener("manual-documents-updated", refresh);
  }, []);

  const handleUpload = async (key, file) => {
    if (!file) return;
    setUploadingKey(key);

    try {
      await submitManualDocument(key, file);
      await loadDocuments();
      alert(`${file.name} berhasil dikirim. Menunggu verifikasi admin.`);
    } catch (error) {
      alert(error.message || "Gagal upload dokumen.");
    } finally {
      setUploadingKey("");
    }
  };

  const triggerUpload = (key) => {
    const currentFile = getDocumentByKey(uploadedDocs, key) || documents[key];
    if (currentFile?.status === "verified") {
      alert("Dokumen ini sudah diverifikasi admin dan tidak bisa diupload ulang.");
      return;
    }
    inputRefs.current[key]?.click();
  };

  const openDocument = async (file, key) => {
    if (!file) {
      triggerUpload(key);
      return;
    }

    const localUrl = !file.fileDataUrl && file.localFileKey
      ? await getLocalFileUrl(file.localFileKey)
      : "";
    const previewUrl = file.fileDataUrl || localUrl;

    if (previewUrl) {
      await openUploadedFile(previewUrl, file.fileName || file.name, file.fileType || file.type);
      return;
    }

    alert("Preview file belum tersedia. Silakan refresh halaman setelah upload selesai.");
  };

  return (
    <section className="student-page">
      <div className="student-page-title">
        <h1>Documents</h1>
        <p>Unggah berkas persyaratan pendaftaran. File tersimpan untuk diverifikasi admin.</p>
      </div>

      <article className="upload-panel">
        <div>
          <h2>Upload Dokumen Baru</h2>
          <p>Pilih jenis dokumen, lalu upload file PDF, JPG, PNG, atau Word sesuai kebutuhan. Maksimal 5MB per file.</p>
        </div>
        <div className="upload-panel__controls">
          <select value={selectedDoc} onChange={(event) => setSelectedDoc(event.target.value)}>
            {DOCUMENT_TYPES.map((doc) => (
              <option value={doc.key} key={doc.key}>{doc.title}</option>
            ))}
          </select>
          <button type="button" onClick={() => triggerUpload(selectedDoc)} disabled={Boolean(uploadingKey)}>
            {uploadingKey ? "Mengirim..." : "Pilih File"}
          </button>
        </div>
      </article>

      <div className="document-grid">
        {DOCUMENT_TYPES.map((doc) => {
          const file = getDocumentByKey(uploadedDocs, doc.key) || documents[doc.key];
          const isVerified = file?.status === "verified";
          const state = file?.status === "verified"
            ? "success"
            : file?.status === "rejected"
              ? "warning"
              : file
                ? "pending"
                : doc.required
                  ? "warning"
                  : "muted";
          return (
            <article className="student-card document-card" key={doc.key}>
              <input
                accept={doc.accept}
                className="sr-only-file"
                ref={(node) => { inputRefs.current[doc.key] = node; }}
                type="file"
                disabled={isVerified}
                onChange={(event) => handleUpload(doc.key, event.target.files?.[0])}
              />
              <div className="document-card__icon">FILE</div>
              <div>
                <h3>{doc.title}</h3>
                <p>{doc.required ? "Wajib" : "Opsional"}</p>
                {file && <small>{file.fileName || file.name} - {formatFileSize(file.fileSize || file.size)}</small>}
                {file?.reviewNote && <small>Catatan admin: {file.reviewNote}</small>}
              </div>
              <span className={`doc-status is-${state}`}>
                {file ? DOCUMENT_STATUS_LABELS[file.status] || "Terupload" : "Belum Diunggah"}
              </span>
              <button type="button" onClick={() => openDocument(file, doc.key)}>
                {file ? "Lihat File" : "Upload"}
              </button>
            </article>
          );
        })}
      </div>

      <div className="student-action-row">
        <button className="student-secondary-action" type="button" onClick={() => navigate("/santri/profil")}>Kembali ke Profil</button>
        <button className="student-primary-action" type="button" onClick={() => navigate("/santri/pembayaran")}>
          {progress.documentsComplete ? "Lanjut Pembayaran" : "Lewati Dulu"}
        </button>
      </div>
    </section>
  );
}
