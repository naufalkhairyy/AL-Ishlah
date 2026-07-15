import { useEffect, useState } from "react";
import { getExamResult } from "../../../service/examService";

export default function ExamResultPage() {
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

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