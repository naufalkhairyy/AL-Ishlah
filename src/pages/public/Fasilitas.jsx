import "../../styles/fasilitas.css";
import PublicFooter from "../../components/PublicFooter";
import { heroImage } from "./homeShared";

const facilities = [
  {
    title: "Asrama Santriwati",
    desc: "Area tinggal santriwati berjilbab yang tertata untuk ibadah, belajar malam, pendampingan musyrifah, dan pembiasaan adab harian.",
    image: "https://images.unsplash.com/photo-1719804320342-b7ebb6bc0ecb?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Asrama Santri Putra",
    desc: "Lingkungan santri putra dibina agar rapi memakai baju muslim, peci, dan menjaga kedisiplinan dalam kegiatan pesantren.",
    image: "https://cdn.langit7.id/foto/850/langit7/berita/2023/02/16/1/29831/tips-pilih-busana-muslim-pria-untuk-acara-formal-dan-informal-lkt.jpg",
  },
  {
    title: "Masjid",
    desc: "Pusat kegiatan shalat berjamaah, halaqah, kajian kitab, tahfidz, dan pembiasaan akhlak islami bagi seluruh santri.",
    image: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Ruang Kelas",
    desc: "Ruang belajar formal untuk program diniyah, bahasa Arab, tahfidz, dan akademik dengan suasana yang tertib.",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Perpustakaan",
    desc: "Area baca dan rujukan kitab untuk mendukung budaya literasi, diskusi, dan pendalaman materi keislaman.",
    image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Lapangan",
    desc: "Fasilitas olahraga dan kegiatan bersama agar santri tetap sehat, kompak, dan disiplin dalam aktivitas harian.",
    image: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=900&q=80",
  },
];

export default function Fasilitas() {
  return (
    <main className="school-page facilities-page">
      <section className="sub-hero facilities-hero" style={{ "--hero-image": `url(${heroImage})` }}>
        <div className="sub-hero__content">
          <h1>Fasilitas Pesantren</h1>
          <p>Ruang belajar, ibadah, asrama, dan kegiatan santri dalam satu lingkungan pembinaan.</p>
        </div>
      </section>

      <section className="page-shell facilities-section">
        <div className="facilities-heading">
          <span>Fasilitas</span>
          <h2>Sarana penunjang kegiatan santri</h2>
          <p>Daftar fasilitas ini membantu wali santri mengenali lingkungan pendidikan sebelum mendaftar.</p>
        </div>
        <div className="facilities-grid">
          {facilities.map((item) => (
            <article className="facility-card" key={item.title}>
              <img src={item.image} alt={item.title} />
              <div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
