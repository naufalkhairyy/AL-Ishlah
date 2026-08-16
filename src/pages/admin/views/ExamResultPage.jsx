import { useEffect, useState } from "react";
import { getExamResult } from "../../../service/examService";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatReportDate(date = new Date()) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildResultPdfHtml(results) {
  const generatedAt = formatReportDate();
  const rows = results
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.nama_santri || "-")}</td>
          <td>${escapeHtml(item.nilai ?? 0)}</td>
          <td>${escapeHtml(item.status || "-")}</td>
        </tr>
      `
    )
    .join("");

  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <title>Laporan Hasil Ujian Santri</title>
    <style>
      @page { size: A4; margin: 18mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: #111827;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12px;
        line-height: 1.45;
      }
      header {
        border-bottom: 2px solid #111827;
        margin-bottom: 18px;
        padding-bottom: 12px;
      }
      h1 {
        margin: 0 0 6px;
        font-size: 22px;
      }
      p {
        margin: 0;
        color: #4b5563;
      }
      .summary {
        display: flex;
        gap: 18px;
        margin: 16px 0;
      }
      .summary span {
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 8px 10px;
      }
      table {
        border-collapse: collapse;
        width: 100%;
      }
      th,
      td {
        border: 1px solid #d1d5db;
        padding: 8px;
        text-align: left;
        vertical-align: top;
      }
      th {
        background: #f3f4f6;
        color: #111827;
        font-weight: 700;
      }
      td:first-child,
      td:nth-child(3) {
        text-align: center;
        width: 70px;
      }
      footer {
        margin-top: 22px;
        color: #6b7280;
        font-size: 11px;
      }
    </style>
  </head>
  <body>
    <header>
      <h1>Laporan Hasil Ujian Santri</h1>
      <p>Rekap nilai ujian seleksi calon santri.</p>
    </header>

    <section class="summary">
      <span>Total peserta: <strong>${results.length}</strong></span>
      <span>Dicetak: <strong>${escapeHtml(generatedAt)}</strong></span>
    </section>

    <table>
      <thead>
        <tr>
          <th>No</th>
          <th>Nama Santri</th>
          <th>Nilai</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <footer>Dokumen ini dibuat otomatis dari Portal Admin Al Ishlah.</footer>
    <script>
      window.addEventListener("load", () => {
        window.focus();
        window.print();
      });
    </script>
  </body>
</html>`;
}

export default function ExamResultPage({ notify }) {
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const handleExportPdf = () => {
    if (!results.length) {
      const emptyMessage = "Belum ada data hasil ujian yang bisa diexport.";
      setMessage(emptyMessage);
      notify?.("Export PDF belum tersedia", emptyMessage, "error");
      return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      const blockedMessage = "Popup diblokir browser. Izinkan popup untuk export PDF.";
      setMessage(blockedMessage);
      notify?.("Export PDF gagal", blockedMessage, "error");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildResultPdfHtml(results));
    printWindow.document.close();
    notify?.("Export PDF disiapkan", "Pilih Simpan sebagai PDF pada dialog cetak browser.");
  };

  useEffect(() => {
    getExamResult()
      .then((response) => {
        console.log("HASIL UJIAN:", response);

        const data =
          response?.data?.data ??
          response?.data ??
          response ??
          [];

        if (Array.isArray(data) && data.length > 0) {
          setResults(data);
        } else {
          setMessage(
            response?.message || "Hasil ujian belum tersedia"
          );
        }
      })
      .catch((error) => {
        console.error("ERROR HASIL UJIAN:", error);

        setMessage(
          error.message || "Gagal mengambil hasil ujian"
        );
      })
      .finally(() => {
        setLoading(false);
      });

  }, []);


  if (loading) {
    return (
      <div className="admin-panel">
        Memuat hasil ujian...
      </div>
    );
  }


  return (
    <section className="admin-page">

      <div className="admin-page-head">
        <div>
          <h1>Hasil Ujian Santri</h1>
          <p>
            Rekap nilai ujian seleksi calon santri.
          </p>
        </div>

        <div className="admin-head-actions">
          <button
            className="admin-primary"
            type="button"
            onClick={handleExportPdf}
          >
            Unduh PDF
          </button>
        </div>
      </div>


      <article className="admin-panel">

        {message && (
          <p>{message}</p>
        )}


        {results.length > 0 && (
          <table className="question-table">

            <thead>
              <tr>
                <th>No</th>
                <th>Nama Santri</th>
                <th>Nilai</th>
                <th>Status</th>
              </tr>
            </thead>


            <tbody>

              {results.map((item, index) => (
                <tr key={item.santri_id || index}>

                  <td>
                    {index + 1}
                  </td>

                  <td>
                    {item.nama_santri || "-"}
                  </td>


                  <td>
                    {item.nilai ?? 0}
                  </td>


                  <td>
                    <span>
                      {item.status || "-"}
                    </span>
                  </td>

                </tr>
              ))}

            </tbody>

          </table>
        )}

      </article>

    </section>
  );
}
