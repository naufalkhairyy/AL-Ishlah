import "../../styles/berita.css";
import { Link, useNavigate } from "react-router-dom";

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
            See all
          </button>
        </div>

        {/* GRID ATAS */}
        <div className="grid-3">
          <div className="card" onClick={() => openArticle("Kegiatan Belajar Mengajar di Rumah")}>
            <img src="https://picsum.photos/300/200" />
            <h4>Kegiatan Belajar Mengajar di Rumah</h4>
            <p>Lorem ipsum dolor sit amet...</p>
            <button>Read More</button>
          </div>

          <div className="card" onClick={() => openArticle("Kegiatan Belajar Mengajar di Rumah")}>
            <img src="https://picsum.photos/301/200" />
            <h4>Kegiatan Belajar Mengajar di Rumah</h4>
            <p>Lorem ipsum dolor sit amet...</p>
            <button>Read More</button>
          </div>

          <div className="card" onClick={() => openArticle("Belajar dirumah")}>
            <img src="https://picsum.photos/302/200" />
            <h4>Belajar dirumah</h4>
            <p>Lorem ipsum dolor sit amet...</p>
            <button>Read More</button>
          </div>
        </div>

        {/* FEATURE BESAR */}
        <div className="feature">
          <img src="https://picsum.photos/500/300" />
          <div className="feature-text">
            <h2>Kegiatan Belajar Mengajar dirumah</h2>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Mollitia quis dolor sit amet.
            </p>
            <button onClick={() => openArticle("Kegiatan Belajar Mengajar dirumah")}>Read More</button>
          </div>
        </div>

        {/* GRID BAWAH */}
        <div className="grid-3">
          <div className="card" onClick={() => openArticle("Kegiatan Belajar Mengajar")}>
            <img src="https://picsum.photos/303/200" />
            <h4>Kegiatan Belajar Mengajar</h4>
            <button>Read More</button>
          </div>

          <div className="card" onClick={() => openArticle("Kegiatan Belajar Mengajar")}>
            <img src="https://picsum.photos/304/200" />
            <h4>Kegiatan Belajar Mengajar</h4>
            <button>Read More</button>
          </div>

          <div className="card" onClick={() => openArticle("Belajar dirumah")}>
            <img src="https://picsum.photos/305/200" />
            <h4>Belajar dirumah</h4>
            <button>Read More</button>
          </div>
        </div>

        {/* TAG */}
        <div className="tags">
          <h3>Recent Post</h3>
          <div className="tag-list">
            {["Belajar di rumah", "Kegiatan belajar", "Artikel", "Santri"].map((tag) => (
              <button key={tag} onClick={() => openArticle(tag)}>{tag}</button>
            ))}
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div>
          <h4>Pondok Pesantren</h4>
          <p>Sistem Informasi Pesantren</p>
        </div>

        <div>
          <h4>Menu</h4>
          <Link to="/">Home</Link>
          <Link to="/berita">Berita</Link>
        </div>

        <div>
          <h4>Kontak</h4>
          <a href="mailto:info@gmail.com">Email: info@gmail.com</a>
        </div>
      </footer>

    </div>
  );
}
