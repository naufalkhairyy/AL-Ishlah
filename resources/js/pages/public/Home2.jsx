import React, { useState } from "react";
import "./Home"

const categories = ["Semua", "Kegiatan", "Belajar", "Asrama", "Kajian", "Tahfidz", "Prestasi"];

const features = [
  { icon: "📚", title: "Manajemen Santri", desc: "Kelola data santri dengan mudah dan cepat" },
  { icon: "📝", title: "Pendaftaran Online", desc: "Sistem pendaftaran terintegrasi dan efisien" },
  { icon: "📊", title: "Monitoring Belajar", desc: "Pantau perkembangan belajar santri secara real-time" },
  { icon: "💬", title: "Pengumuman", desc: "Update kegiatan & informasi pesantren terkini" },
];

const news = [
  { tag: "Kegiatan", title: "Kegiatan Santri Pekanan", desc: "Kegiatan rutin untuk meningkatkan akhlak dan ilmu santri", img: "https://picsum.photos/400/300?random=1" },
  { tag: "Program", title: "Program Tahfidz Quran", desc: "Program unggulan hafalan Al-Quran bagi seluruh santri", img: "https://picsum.photos/400/300?random=2" },
  { tag: "Prestasi", title: "Lomba Antar Santri", desc: "Meningkatkan kreativitas dan kompetensi santri", img: "https://picsum.photos/400/300?random=3" },
];

export default function Home2() {
  const [activeCategory, setActiveCategory] = useState("Semua");

  return (
    <>
      {/* NAVBAR */}
      <nav className="nav">
        <div className="nav-logo">🕌 Pesantren Al-Hidayah</div>
        <ul className="nav-links">
          <li><a href="#">Beranda</a></li>
          <li><a href="#">Program</a></li>
          <li><a href="#">Berita</a></li>
          <li><a href="#">Kontak</a></li>
        </ul>
        <button className="nav-btn">Daftar Sekarang</button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-text">
          <div className="hero-badge">✦ Sistem Informasi Pesantren</div>
          <h1>Pondok Pesantren & Dakwah Lebih Mudah</h1>
          <p>Sistem terintegrasi untuk pengelolaan santri, kegiatan, dan administrasi pesantren secara modern dan transparan.</p>
          <div className="hero-actions">
            <button className="btn-white">Mulai Sekarang</button>
            <button className="btn-ghost">Pelajari Lebih Lanjut</button>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-card">
            <div className="stat-num">500+</div>
            <div className="stat-label">Santri Aktif</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">20+</div>
            <div className="stat-label">Program Unggulan</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">15</div>
            <div className="stat-label">Tahun Berdiri</div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section features">
        <h2 className="section-title">Fitur Utama</h2>
        <p className="section-sub">Semua yang dibutuhkan dalam satu platform</p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feat-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* NEWS */}
      <section className="section news">
        <h2 className="section-title">Berita & Agenda</h2>
        <p className="section-sub">Informasi terbaru dari pesantren</p>
        <div className="news-grid">
          {news.map((n, i) => (
            <div className="news-card" key={i}>
              <img src={n.img} alt={n.title} />
              <div className="news-body">
                <span className="news-tag">{n.tag}</span>
                <h4>{n.title}</h4>
                <p>{n.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORY */}
      <section className="section category">
        <h2 className="section-title">Kategori</h2>
        <p className="section-sub">Jelajahi berdasarkan kategori</p>
        <div className="cat-grid">
          {categories.map((cat) => (
            <div
              key={cat}
              className={`cat-tag${activeCategory === cat ? " active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-grid">
          <div className="footer-brand">
            <h4>🕌 Pesantren Al-Hidayah</h4>
            <p>Sistem Informasi Pesantren Modern yang transparan dan mudah diakses</p>
          </div>
          <div className="footer-col">
            <h5>Menu</h5>
            <a href="#">Beranda</a>
            <a href="#">Program</a>
            <a href="#">Berita</a>
            <a href="#">Kontak</a>
          </div>
          <div className="footer-col">
            <h5>Kontak</h5>
            <p>info@pesantren.id</p>
            <p>08xx-xxxx-xxxx</p>
            <p>Jl. Pesantren No. 1</p>
          </div>
        </div>
        <div className="footer-bottom">© 2025 Pesantren Al-Hidayah. Semua hak dilindungi.</div>
      </footer>
    </>
  );
}