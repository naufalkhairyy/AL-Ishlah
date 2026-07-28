import "../../styles/home.css";
import { useNavigate } from "react-router-dom";
import PublicFooter from "../../components/PublicFooter";
import logo from "../../assets/logo.png";
import { heroImage } from "./homeShared";

const news = [
  {
    title: "Halaqah Tahfidz Santri Putri",
    date: "20 Juni",
    image:
      "https://images.pexels.com/photos/6282020/pexels-photo-6282020.jpeg?auto=compress&cs=tinysrgb&w=500",
    alt: "Santri putri berjilbab mengikuti halaqah tahfidz",
    description:
      "Santri putri mengikuti halaqah tahfidz dengan pendampingan ustadzah untuk memperkuat hafalan dan adab belajar.",
  },
  {
    title: "Kajian Kitab Santri Putra",
    date: "20 Juni",
    image:
      "https://images.pexels.com/photos/37350652/pexels-photo-37350652.jpeg?auto=compress&cs=tinysrgb&w=500",
    alt: "Santri putra berpakaian muslim membaca Al-Quran",
    description:
      "Santri putra belajar kitab dan materi diniyah dengan suasana kelas yang tertib, santun, dan berorientasi amal.",
  },
  {
    title: "Pembelajaran Digital Islami",
    date: "20 Juni",
    image:
      "https://images.pexels.com/photos/6281994/pexels-photo-6281994.jpeg?auto=compress&cs=tinysrgb&w=500",
    alt: "Santri putri berjilbab belajar bersama menggunakan laptop",
    description:
      "Pembelajaran modern tetap diarahkan pada nilai pesantren melalui diskusi, tugas terstruktur, dan pendampingan guru.",
  },
  {
    title: "Pembinaan Ibadah Berjamaah",
    date: "20 Juni",
    image:
      "https://images.pexels.com/photos/29832036/pexels-photo-29832036.jpeg?auto=compress&cs=tinysrgb&w=500",
    alt: "Jamaah laki-laki berpakaian muslim shalat di masjid",
    description:
      "Kegiatan ibadah berjamaah dibiasakan agar santri tumbuh disiplin, khusyuk, dan memiliki kepedulian terhadap sesama.",
  },
];

const agendas = [
  {
    title: "Halaqah Tahfidz",
    date: "01 - 06 - 2026",
    description: "Setoran hafalan Al-Quran dan murajaah bersama pembimbing.",
  },
  {
    title: "Pembagian Ijazah",
    date: "08 - 06 - 2026",
    description: "Penyerahan ijazah dan apresiasi capaian belajar santri.",
  },
  {
    title: "Pemberitahuan PPDB 2026/2027",
    date: "15 - 06 - 2026",
    description: "Informasi jadwal, biaya, dan tahapan penerimaan santri baru.",
  },
];

const galleries = [
  {
    image:
      "https://images.pexels.com/photos/32668040/pexels-photo-32668040.jpeg?auto=compress&cs=tinysrgb&w=700",
    alt: "Santri putri berjilbab belajar di kelas",
  },
  {
    image:
      "https://images.pexels.com/photos/37350652/pexels-photo-37350652.jpeg?auto=compress&cs=tinysrgb&w=700",
    alt: "Santri putra membaca Al-Quran di ruang belajar",
  },
  {
    image:
      "https://images.pexels.com/photos/20627702/pexels-photo-20627702.jpeg?auto=compress&cs=tinysrgb&w=700",
    alt: "Santri putra belajar Al-Quran bersama",
  },
  {
    image:
      "https://images.pexels.com/photos/29832030/pexels-photo-29832030.jpeg?auto=compress&cs=tinysrgb&w=700",
    alt: "Jamaah laki-laki mengikuti shalat di masjid",
  },
  {
    image:
      "https://images.pexels.com/photos/6282012/pexels-photo-6282012.jpeg?auto=compress&cs=tinysrgb&w=700",
    alt: "Santri putri berjilbab belajar menggunakan perangkat digital",
  },
  {
    image:
      "https://images.pexels.com/photos/36463770/pexels-photo-36463770.jpeg?auto=compress&cs=tinysrgb&w=700",
    alt: "Laki-laki berpakaian muslim membaca Al-Quran di masjid",
  },
];

const profileFeatures = [
  {
    title: "Fasilitas",
    description: "Ruang belajar, masjid, asrama, dan area pembinaan disiapkan untuk mendukung kegiatan santri.",
  },
  {
    title: "Lokasi",
    description: "Berada di Sungai Pagar, Kampar, dengan lingkungan yang kondusif untuk belajar dan ibadah.",
  },
  {
    title: "Sejarah",
    description: "Pondok dibangun untuk menghadirkan pendidikan Islam yang seimbang antara ilmu, adab, dan kemandirian.",
  },
  {
    title: "Prestasi",
    description: "Santri dibimbing agar mampu berprestasi dalam tahfidz, akademik, dakwah, dan kegiatan keislaman.",
  },
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
            <button className="ghost-btn" onClick={() => scrollTo(".app-footer")}>Hubungi Kami</button>
          </div>
        </div>
      </section>

      <section className="welcome-section page-shell">
        <Dots />
        <div className="welcome-copy">
          <h2>Sambutan Mudir Pondok Pesantren Al Ishlah Al Islamy</h2>
          <p>
            Puji syukur ke hadirat Allah SWT atas nikmat iman, ilmu, dan kesempatan
            untuk terus membina generasi Qurani. Pondok Pesantren Al Ishlah Al
            Islamy hadir sebagai tempat belajar yang menanamkan adab, kedisiplinan,
            kemandirian, serta semangat berkhidmat kepada masyarakat.
          </p>
          <button className="green-btn" onClick={() => navigate("/visi-misi")}>Lebih Lanjut</button>
        </div>
      </section>

      <section className="profile-band">
        <div className="page-shell profile-grid">
          <div className="profile-copy">
            <h2>Profil Sekolah</h2>
            <p>
              Pondok Pesantren Al Ishlah Al Islamy menggabungkan pendidikan diniyah,
              tahfidz, pembiasaan ibadah, dan pembelajaran umum dalam lingkungan
              yang rapi dan terarah. Seluruh program dirancang untuk membentuk santri
              yang berilmu, berakhlak, dan siap mandiri.
            </p>
            <button className="green-btn" onClick={() => navigate("/fasilitas")}>Lebih Lanjut</button>
          </div>
          <div className="feature-grid">
            {profileFeatures.map((item, index) => (
              <article className="mini-card" key={item.title} onClick={() => navigate(index === 0 ? "/fasilitas" : "/visi-misi")}>
                <span className={`mini-icon mini-icon--${index + 1}`} />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
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
            <input placeholder="Cari berita" onFocus={() => navigate("/berita")} />
          </label>
        </div>
        <div className="news-layout">
          <div className="news-list">
            {filteredNews.map((item) => (
              <article className="news-item" key={item.title} onClick={() => navigate("/berita")}>
                <img src={item.image} alt={item.alt} />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <small>{item.date}</small>
                </div>
                <span className="arrow" aria-hidden="true" />
              </article>
            ))}
          </div>
          <div className="agenda-list">
            {agendas.map((item) => (
              <article className="agenda-item" key={item.title} onClick={() => navigate("/jadwal-biaya")}>
                <img src={logo} alt="" />
                <div>
                  <small>{item.date}</small>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <span className="arrow" aria-hidden="true" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="gallery-band">
        <div className="page-shell">
          <h2>Galeri</h2>
          <div className="gallery-grid">
            {galleries.map((item) => (
              <img key={item.image} src={item.image} alt={item.alt} />
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
