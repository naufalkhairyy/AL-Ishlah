import "../../styles/fasilitas.css";
import PublicFooter from "../../components/PublicFooter";
import { heroImage } from "./homeShared";

const facilities = [
  {
    title: "Asrama Santri",
    desc: "Lingkungan tinggal santri yang tertata untuk ibadah, belajar malam, dan pembinaan harian.",
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Masjid",
    desc: "Pusat kegiatan shalat berjamaah, halaqah, kajian, dan pembiasaan adab santri.",
    image: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Ruang Kelas",
    desc: "Ruang belajar formal untuk program diniyah, bahasa Arab, tahfidz, dan akademik.",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Perpustakaan",
    desc: "Area baca dan rujukan kitab untuk mendukung budaya literasi santri.",
    image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Lapangan",
    desc: "Fasilitas olahraga dan kegiatan bersama agar santri tetap aktif dan sehat.",
    image: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Kantin",
    desc: "Tempat makan dan kebutuhan harian santri dengan pengawasan lingkungan pesantren.",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80",
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
