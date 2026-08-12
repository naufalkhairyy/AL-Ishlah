import { useEffect, useState } from "react";
import { apiRequest } from "../../service/api";

/**
 * Design tokens
 * --paper     : warm cream page background, like certificate stock
 * --ink       : primary text (near-black, warm undertone)
 * --ink-soft  : secondary text
 * --forest    : deep institutional green — used for "lulus"
 * --forest-soft
 * --gold      : ceremonial accent — seal ring, dividers, ornaments
 * --gold-soft
 * --clay      : muted terracotta — used for "belum lulus" (softer than alarm-red)
 * --clay-soft
 * --line      : hairline divider color
 */
const TOKENS = `
  :root {
    --ser-paper: #FAF6EE;
    --ser-ink: #23261F;
    --ser-ink-soft: #6B6F5F;
    --ser-forest: #1F4A3D;
    --ser-forest-soft: #E9F1EB;
    --ser-gold: #C89B3C;
    --ser-gold-soft: #FBF1DC;
    --ser-clay: #A64B3E;
    --ser-clay-soft: #F6EAE7;
    --ser-line: #E3DBC8;
  }

  .ser-root {
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    color: var(--ser-ink);
  }

  .ser-root .student-page-title h1,
  .ser-title-serif {
    font-family: 'Fraunces', Georgia, serif;
  }

  /* ---------- loading / empty states ---------- */
  .ser-status-card {
    background: var(--ser-paper);
    border: 1px solid var(--ser-line);
    border-radius: 4px;
    padding: 56px 24px;
    text-align: center;
  }
  .ser-status-icon {
    font-size: 42px;
    margin-bottom: 14px;
    opacity: 0.85;
  }
  .ser-status-card h3, .ser-status-card h4 {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: var(--ser-ink);
  }
  .ser-status-card p {
    color: var(--ser-ink-soft);
    margin: 0;
  }

  /* ---------- certificate card ---------- */
  .ser-certificate {
    background: var(--ser-paper);
    border: 1px solid var(--ser-line);
    border-radius: 4px;
    padding: 48px 40px 40px;
    position: relative;
  }
  .ser-certificate::before,
  .ser-certificate::after {
    content: "";
    position: absolute;
    width: 22px;
    height: 22px;
    border-color: var(--ser-gold);
    opacity: 0.8;
  }
  .ser-certificate::before {
    top: 14px;
    left: 14px;
    border-top: 2px solid var(--ser-gold);
    border-left: 2px solid var(--ser-gold);
  }
  .ser-certificate::after {
    bottom: 14px;
    right: 14px;
    border-bottom: 2px solid var(--ser-gold);
    border-right: 2px solid var(--ser-gold);
  }

  .ser-eyebrow {
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 11px;
    font-weight: 600;
    color: var(--ser-ink-soft);
    margin-bottom: 28px;
  }
  .ser-eyebrow span {
    color: var(--ser-gold);
    padding: 0 10px;
  }

  /* ---------- seal ---------- */
  .ser-seal-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 30px;
  }
  .ser-seal {
    position: relative;
    width: 208px;
    height: 208px;
  }
  .ser-seal svg {
    width: 100%;
    height: 100%;
  }
  .ser-seal-content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  .ser-seal-label {
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ser-ink-soft);
    margin-bottom: 2px;
  }
  .ser-seal-score {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 700;
    font-size: 54px;
    line-height: 1;
  }
  .ser-seal-score.pass { color: var(--ser-forest); }
  .ser-seal-score.fail { color: var(--ser-clay); }

  .ser-passing-note {
    margin-top: 14px;
    font-size: 13px;
    color: var(--ser-ink-soft);
  }
  .ser-passing-note strong {
    color: var(--ser-ink);
    font-weight: 700;
  }

  /* ---------- status ribbon ---------- */
  .ser-ribbon-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin: 22px 0 34px;
  }
  .ser-ribbon-row .diamond {
    width: 6px;
    height: 6px;
    background: var(--ser-gold);
    transform: rotate(45deg);
    flex-shrink: 0;
  }
  .ser-ribbon {
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-weight: 700;
    font-size: 14px;
    padding: 9px 26px;
    border-radius: 30px;
  }
  .ser-ribbon.pass {
    background: var(--ser-forest-soft);
    color: var(--ser-forest);
    border: 1px solid var(--ser-forest);
  }
  .ser-ribbon.fail {
    background: var(--ser-clay-soft);
    color: var(--ser-clay);
    border: 1px solid var(--ser-clay);
  }

  /* ---------- ledger / detail rows ---------- */
  .ser-ledger {
    border-top: 1px solid var(--ser-line);
    border-bottom: 1px solid var(--ser-line);
    margin-bottom: 30px;
  }
  .ser-ledger-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 4px;
  }
  .ser-ledger-row + .ser-ledger-row {
    border-top: 1px dashed var(--ser-line);
  }
  .ser-ledger-label {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--ser-ink-soft);
    font-size: 14px;
    font-weight: 500;
  }
  .ser-ledger-icon {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--ser-gold-soft);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    flex-shrink: 0;
  }
  .ser-ledger-value {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 600;
    font-size: 20px;
    color: var(--ser-ink);
  }

  /* ---------- message note ---------- */
  .ser-note {
    background: var(--ser-forest-soft);
    border-left: 3px solid var(--ser-forest);
    padding: 22px 24px;
    border-radius: 2px;
  }
  .ser-note.fail {
    background: var(--ser-clay-soft);
    border-left-color: var(--ser-clay);
  }
  .ser-note h3 {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 600;
    margin: 0 0 8px 0;
    font-size: 18px;
  }
  .ser-note p {
    margin: 0;
    color: var(--ser-ink-soft);
    line-height: 1.6;
    font-size: 14.5px;
  }

  @media (max-width: 520px) {
    .ser-certificate { padding: 36px 20px 30px; }
    .ser-seal { width: 172px; height: 172px; }
    .ser-seal-score { font-size: 42px; }
  }
`;

function useFonts() {
  useEffect(() => {
    if (document.getElementById("ser-fonts")) return;
    const link = document.createElement("link");
    link.id = "ser-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

function SealRing({ passed }) {
  const color = passed ? "#1F4A3D" : "#A64B3E";
  return (
    <svg viewBox="0 0 208 208">
      <circle
        cx="104"
        cy="104"
        r="98"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray="2 6"
        opacity="0.6"
      />
      <circle
        cx="104"
        cy="104"
        r="86"
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
      <circle cx="104" cy="104" r="80" fill="#FAF6EE" stroke={color} strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

function normalizeExamResult(response) {
  const resultData = Array.isArray(response?.data)
    ? response.data[0]
    : response?.data?.data || response?.data;

  if (!response?.status || !resultData) return null;

  return {
    ...resultData,
    nama_santri: resultData.nama_santri || response.nama_santri || "-",
    nilai_akhir: resultData.nilai ?? resultData.nilai_akhir ?? "-",
    status_kelulusan: resultData.status_kelulusan || resultData.status || "-",
    passing_grade: resultData.passing_grade ?? 75,
    total_soal: resultData.total_soal ?? "-",
    jumlah_benar: resultData.jumlah_benar ?? "-",
    jumlah_salah: resultData.jumlah_salah ?? "-",
    jumlah_kosong: resultData.jumlah_kosong ?? "-",
  };
}

export default function StudentExamResult() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useFonts();

  useEffect(() => {
    loadResult();
  }, []);


  async function loadResult() {
    try {

      const response = await apiRequest("/hasil-ujian", {
        authScope: "student",
      });


      console.log("HASIL SANTRI:", response);



      setResult(normalizeExamResult(response));



    } catch(error){

      console.error(
        "Gagal mengambil hasil ujian:",
        error
      );

      setResult(null);


    } finally {

      setLoading(false);

    }

  }



  if(loading){

    return (
      <section className="student-page ser-root">

        <style>{TOKENS}</style>

        <div className="ser-status-card">

          <div className="ser-status-icon">
            ⏳
          </div>

          <h4>
            Memuat hasil ujian...
          </h4>

          <p>
            Mohon tunggu sebentar.
          </p>

        </div>

      </section>
    );

  }



  if(!result){

    return (
      <section className="student-page ser-root">

        <style>{TOKENS}</style>


        <div className="ser-status-card">

          <div className="ser-status-icon">
            📄
          </div>


          <h3>
            Hasil Ujian Belum Tersedia
          </h3>


          <p>
            Silakan tunggu hingga proses penilaian selesai.
          </p>


        </div>

      </section>
    );

  }



  // PERBAIKAN DISINI
  const isPassed = result.status_kelulusan === "Lulus";



  return (

    <section className="student-page ser-root">

      <style>{TOKENS}</style>



      <div className="student-page-title">

        <h1 className="ser-title-serif">
          Hasil Ujian Seleksi
        </h1>


        <p>
          Informasi hasil pengerjaan ujian seleksi calon santri.
        </p>


      </div>




      <article className="ser-certificate">


        <div className="ser-eyebrow">

          Sertifikat Hasil 
          <span>·</span>
          Ujian Seleksi Calon Santri

        </div>





        <div className="ser-seal-wrap">


          <div className="ser-seal">


            <SealRing passed={isPassed} />


            <div className="ser-seal-content">


              <span className="ser-seal-label">
                Nilai Akhir
              </span>



              <span 
                className={
                  `ser-seal-score ${
                    isPassed ? "pass":"fail"
                  }`
                }
              >

                {result.nilai_akhir}

              </span>


            </div>


          </div>




          <p className="ser-passing-note">

            Passing grade:

            <strong>
              {result.passing_grade}
            </strong>


          </p>



        </div>





        <div className="ser-ribbon-row">


          <span className="diamond"/>



          <span 
            className={
              `ser-ribbon ${
                isPassed ? "pass":"fail"
              }`
            }
          >

            {isPassed ? "Lulus":"Tidak Lulus"}

          </span>



          <span className="diamond"/>


        </div>





        <div className="ser-ledger">


          <LedgerRow
            icon="📝"
            label="Nama Santri"
            value={result.nama_santri}
          />



          <LedgerRow
            icon="🎯"
            label="Nilai Akhir"
            value={result.nilai_akhir}
          />



          <LedgerRow
            icon="🏆"
            label="Status"
            value={result.status}
          />



          <LedgerRow
            icon="📌"
            label="Passing Grade"
            value={result.passing_grade}
          />



        </div>





        <div 
          className={
            `ser-note ${
              isPassed ? "" : "fail"
            }`
          }
        >


          {
            isPassed ? (

              <>
                <h3>
                  Selamat atas pencapaian Anda
                </h3>


                <p>
                  Hasil ini merupakan awal perjalanan baru.
                  Tetap pertahankan semangat belajar,
                  disiplin, dan terus kembangkan kemampuan.
                </p>

              </>


            ):(

              <>

                <h3>
                  Tetap Semangat Belajar
                </h3>


                <p>
                  Jangan menyerah karena satu hasil.
                  Setiap proses adalah kesempatan untuk
                  belajar dan berkembang.
                </p>


              </>

            )

          }



        </div>



      </article>


    </section>

  );

}

function LedgerRow({ icon, label, value }) {
  return (
    <div className="ser-ledger-row">
      <div className="ser-ledger-label">
        <span className="ser-ledger-icon">{icon}</span>
        {label}
      </div>
      <div className="ser-ledger-value">{value}</div>
    </div>
  );
}