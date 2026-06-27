import "../../styles/home.css";
import { useNavigate } from "react-router-dom";
import PublicFooter from "../../components/PublicFooter";
import logo from "../../assets/logo.png";
import { heroImage } from "./homeShared";

const news = [
  {
    title: "Belajar di Rumah",
    date: "20 Juni",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=500&q=80",
  },
  {
    title: "Kegiatan Belajar mengajar di Pondok Pesantren",
    date: "20 Juni",
    image:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=500&q=80",
  },
  {
    title: "Kegiatan Belajar mengajar di Rumah",
    date: "20 Juni",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=500&q=80",
  },
  {
    title: "Kegiatan Pembelajaran Daring",
    date: "20 Juni",
    image:
      "https://images.unsplash.com/photo-1587614295999-6c1c1367510d?auto=format&fit=crop&w=500&q=80",
  },
];

const agendas = ["Halaqoh", "Pembagian Ijazah", "Pemberitahuan PPDB 2024/2025"];

const galleries = [
  "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=700&q=80",
];

function Dots() {
  return (
    <div className="dot-grid" aria-hidden="true">
      {Array.from({ length: 25 }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const filteredNews = news;
  const scrollTo = (selector) => {
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="school-page">
      <section className="home-hero" style={{ "--hero-image": `url(${heroImage})` }}>
        <div className="page-shell home-hero__content">
          <h1>Pondok Pesantren Al Ishlah Al Islamy</h1>
          <p>Jalan Raya Pekanbaru - Taluk Kuantan KM. 30, Sungai Pagar, Kabupaten Kampar, Riau</p>
          <div className="hero-action-row">
            <button className="green-btn" onClick={() => navigate("/pendaftaran")}>Daftar Sekarang</button>
            <button className="ghost-btn" onClick={() => scrollTo(".app-footer")}>Contact Us</button>
          </div>
        </div>
      </section>

      <section className="welcome-section page-shell">
        <Dots />
        <div className="welcome-copy">
          <h2>Sambutan Mudir Pondok Pesantren Al Ishlah Al Islamy</h2>
          <p>
            Puji dan syukur mari kita panjatkan kehadirat Allah SWT. Yang senantiasa
            dengan sifat kasih dan sayangnya banyak memberikan nikmat ...
          </p>
          <button className="green-btn" onClick={() => navigate("/visi-misi")}>Lebih Lanjut</button>
        </div>
      </section>

      <section className="impact-section page-shell" aria-label="Grafik perkembangan pesantren">
        <div className="impact-copy">
          <span>Grafik Perkembangan</span>
          <h2>Data pendaftaran dan program dibuat mudah dibaca.</h2>
          <p>Visual ringkas ini membantu calon wali santri melihat kapasitas, program, dan kesiapan PPDB secara cepat.</p>
        </div>
        <div className="impact-panel">
          <div className="ring-chart" aria-label="Kuota PPDB 78 persen">
            <strong>78%</strong>
            <small>Kuota PPDB</small>
          </div>
          <div className="bar-chart">
            {[
              ["Tahfidz", 92],
              ["Bahasa Arab", 84],
              ["Akademik", 76],
              ["Asrama", 88],
            ].map(([label, value]) => (
              <div className="bar-row" key={label}>
                <span>{label}</span>
                <div><i style={{ "--bar-value": `${value}%` }} /></div>
                <b>{value}%</b>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="profile-band">
        <div className="page-shell profile-grid">
          <div className="profile-copy">
            <h2>Profil Sekolah</h2>
            <p>
              Di samping adalah profil sekolah kami secara keseluruhan dari mulai
              bagian depan hingga seluruh fasilitas yang terdapat disekolah kami akan ...
            </p>
            <button className="green-btn" onClick={() => navigate("/fasilitas")}>Lebih Lanjut</button>
          </div>
          <div className="feature-grid">
            {["Fasilitas", "Lokasi", "Sejarah", "Prestasi"].map((item, index) => (
              <article className="mini-card" key={item} onClick={() => navigate(index === 0 ? "/fasilitas" : "/visi-misi")}>
                <span className={`mini-icon mini-icon--${index + 1}`} />
                <h3>{item}</h3>
                <p>Lorem ipsum dolor sit amet adipicing aqua lorem ipsum.</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="news-area page-shell">
        <div className="news-title-row">
          <h2>Berita dan Agenda</h2>
          <label className="search-box">
            <span className="public-icon public-icon--search" aria-hidden="true" />
            <input placeholder="Search" onFocus={() => navigate("/berita")} />
          </label>
        </div>
        <div className="news-layout">
          <div className="news-list">
            {filteredNews.map((item) => (
              <article className="news-item" key={item.title} onClick={() => navigate("/berita")}>
                <img src={item.image} alt="" />
                <div>
                  <h3>{item.title}</h3>
                  <p>Lorem ipsum dolor sit amet adipicing amet adipci aqua lorem ipsum.</p>
                  <small>{item.date}</small>
                </div>
                <span className="arrow" aria-hidden="true" />
              </article>
            ))}
          </div>
          <div className="agenda-list">
            {agendas.map((item) => (
              <article className="agenda-item" key={item} onClick={() => navigate("/jadwal-biaya")}>
                <img src={logo} alt="" />
                <div>
                  <small>01 - 06 - 2021</small>
                  <h3>{item}</h3>
                </div>
                <span className="arrow" aria-hidden="true" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="gallery-band">
        <div className="page-shell">
          <h2>Gallery</h2>
          <div className="gallery-grid">
            {galleries.map((image) => (
              <img key={image} src={image} alt="" />
            ))}
          </div>
          <div className="gallery-action">
            <button className="green-btn" onClick={() => navigate("/fasilitas")}>Lebih Lanjut</button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
