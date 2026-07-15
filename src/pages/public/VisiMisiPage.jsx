import "../../styles/VisiMisiPage.css";
import PublicFooter from "../../components/PublicFooter";
import { heroImage } from "./homeShared";

const missions = [
  "Mencetak generasi islami yang kokoh akidahnya.",
  "Membentuk santri yang berilmu, santun, dan berakhlak mulia.",
  "Membiasakan santri memahami Al-Qur'an dan Hadits dalam kehidupan harian.",
  "Menumbuhkan semangat mengamalkan ilmu dan berdakwah dengan hikmah.",
];

const academicStandards = [
  "Hafalan Al-Qur'an 10 juz",
  "Hafal hadits pilihan",
  "Menguasai Bahasa Arab",
  "Hafalan matan Al-Jurumiyah",
  "Praktik ibadah sesuai sunnah",
];

export default function VisiMisiPage() {
  return (
    <main className="vision-page">
      <section className="vision-hero" style={{ "--hero-image": `url(${heroImage})` }}>
        <div className="page-shell vision-hero__content">
          <span>Profil Pesantren</span>
          <h1>Visi dan Misi Pondok Pesantren Al Ishlah Al Islamy</h1>
          <p>
            Arah pendidikan yang menyatukan kekuatan akidah, ilmu, adab, dan
            amal dalam lingkungan pesantren yang terarah.
          </p>
        </div>
      </section>

      <section className="vision-intro page-shell">
        <article className="vision-card vision-card--main">
          <span className="vision-card__eyebrow">Visi</span>
          <h2>Melahirkan generasi islami yang berakidah, berilmu, dan beramal.</h2>
          <p>
            Menjadi lembaga pendidikan dan dakwah Islam yang unggul dalam
            membina santri agar tumbuh sesuai tuntunan Rasulullah Shallallahu
            'alaihi wasallam.
          </p>
        </article>

        <article className="vision-card vision-card--mission">
          <span className="vision-card__eyebrow">Misi</span>
          <div className="mission-list">
            {missions.map((mission, index) => (
              <div className="mission-item" key={mission}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{mission}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="vision-program">
        <div className="page-shell vision-program__grid">
          <div className="vision-program__copy">
            <span>Standar Akademik</span>
            <h2>Target belajar dibuat jelas sejak awal.</h2>
            <p>
              Standar ini membantu santri dan wali memahami arah pembinaan
              tahfidz, bahasa, kitab dasar, dan ibadah harian.
            </p>
          </div>

          <div className="standard-grid">
            {academicStandards.map((item) => (
              <article className="standard-item" key={item}>
                <span aria-hidden="true" />
                <p>{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="education-band page-shell">
        <div>
          <span>Program Pendidikan</span>
          <h2>Mutawasithah Putra dan Putri</h2>
          <p>
            Program setingkat SMP/MTs yang memadukan kurikulum standar Timur
            Tengah dan pemerintah.
          </p>
        </div>
        <div className="education-stats" aria-label="Ringkasan program">
          <strong>SMP/MTs</strong>
          <span>Kurikulum Terpadu</span>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
