import "../../styles/berita.css";
import { useNavigate } from "react-router-dom";
import PublicFooter from "../../components/PublicFooter";

const images = {
  santriwati:
    "https://images.unsplash.com/photo-1719804320342-b7ebb6bc0ecb?auto=format&fit=crop&w=900&q=80",
  santriPutra:
    "https://cdn.langit7.id/foto/850/langit7/berita/2023/02/16/1/29831/tips-pilih-busana-muslim-pria-untuk-acara-formal-dan-informal-lkt.jpg",
  tahfidz:
    "https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&w=900&q=80",
  kelas:
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80",
  masjid:
    "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=900&q=80",
  literasi:
    "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80",
};

const topArticles = [
  {
    title: "Santriwati Berjilbab Aktif Mengikuti Kajian Kitab",
    desc: "Santriwati dibimbing membaca, mencatat, dan memahami materi diniyah dengan suasana belajar yang tertib.",
    image: images.santriwati,
  },
  {
    title: "Santri Putra Membiasakan Adab Berpakaian Muslim",
    desc: "Santri putra mengenakan baju muslim dan peci sebagai bagian dari pembiasaan akhlak, kerapian, dan identitas pesantren.",
    image: images.santriPutra,
  },
  {
    title: "Program Tahfidz Menumbuhkan Kedisiplinan Harian",
    desc: "Setoran hafalan, murajaah, dan pendampingan ustadz membantu santri menjaga target hafalan Al-Qur'an.",
    image: images.tahfidz,
  },
];

const bottomArticles = [
  {
    title: "Ruang Kelas Menjadi Pusat Pembelajaran Terpadu",
    desc: "Pembelajaran umum dan agama disusun seimbang agar santri siap secara akademik dan spiritual.",
    image: images.kelas,
  },
  {
    title: "Masjid Sebagai Pusat Ibadah dan Pembinaan",
    desc: "Kegiatan shalat berjamaah, halaqah, dan kajian rutin diarahkan untuk membentuk karakter islami.",
    image: images.masjid,
  },
  {
    title: "Literasi Santri Diperkuat Melalui Perpustakaan",
    desc: "Santri didorong membaca buku pelajaran, kitab, dan referensi keislaman untuk memperluas wawasan.",
    image: images.literasi,
  },
];

export default function Berita() {
  const navigate = useNavigate();
  const openArticle = (title) => {
    navigate("/berita", { state: { artikel: title } });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="berita-page">

      {/* HERO */}
      <div className="berita-hero">
        <h1>Berita & Artikel</h1>
      </div>

      {/* SECTION BERITA */}
      <div className="container">

        <div className="section-header">
          <h2>Berita Baru</h2>
          <button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}>
            Lihat Semua
          </button>
        </div>

        {/* GRID ATAS */}
        <div className="grid-3">
          {topArticles.map((article) => (
            <div className="card" key={article.title} onClick={() => openArticle(article.title)}>
              <img src={article.image} alt={article.title} />
              <h4>{article.title}</h4>
              <p>{article.desc}</p>
              <button>Baca Selengkapnya</button>
            </div>
          ))}
        </div>

        {/* FEATURE BESAR */}
        <div className="feature">
          <img src={images.santriwati} alt="Santriwati berjilbab sedang membaca kitab" />
          <div className="feature-text">
            <h2>Pembinaan Santri dan Santriwati Berbasis Adab Islami</h2>
            <p>
              Setiap kegiatan pesantren diarahkan untuk membentuk santri yang rapi dalam ibadah,
              santun dalam pergaulan, dan disiplin dalam belajar. Santriwati dibiasakan berjilbab
              dengan baik, sementara santri putra dibimbing menjaga kerapian baju muslim, peci,
              dan adab di lingkungan pesantren.
            </p>
            <button onClick={() => openArticle("Pembinaan Santri dan Santriwati Berbasis Adab Islami")}>Baca Selengkapnya</button>
          </div>
        </div>

        {/* GRID BAWAH */}
        <div className="grid-3">
          {bottomArticles.map((article) => (
            <div className="card" key={article.title} onClick={() => openArticle(article.title)}>
              <img src={article.image} alt={article.title} />
              <h4>{article.title}</h4>
              <p>{article.desc}</p>
              <button>Baca Selengkapnya</button>
            </div>
          ))}
        </div>

        {/* TAG */}
        <div className="tags">
          <h3>Postingan Terbaru</h3>
          <div className="tag-list">
            {["Santriwati", "Santri putra", "Tahfidz", "Adab Islami"].map((tag) => (
              <button key={tag} onClick={() => openArticle(tag)}>{tag}</button>
            ))}
          </div>
        </div>

      </div>

      <PublicFooter />

    </div>
  );
}
