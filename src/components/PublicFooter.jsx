import { Link } from "react-router-dom";
import "../styles/home.css";
import logo from "../assets/logo.png";

export default function PublicFooter() {
  return (
    <footer className="app-footer">
      <div className="page-shell app-footer__grid">
        <div>
          <img className="app-footer__logo" src={logo} alt="Al Ishlah" />
          <p>Jalan Raya Pekanbaru - Taluk Kuantan KM. 30, Sungai Pagar, Kabupaten Kampar, Riau</p>
        </div>
        <div>
          <h3>Jelajah</h3>
          <Link to="/visi-misi">Sambutan</Link>
          <Link to="/visi-misi">Profil Sekolah</Link>
          <Link to="/berita">Berita</Link>
          <Link to="/pendaftaran">Galeri</Link>
        </div>
        <div>
          <h3>Halaman Umum</h3>
          <Link to="/pendaftaran">Formulir</Link>
          <Link to="/berita">Berita & Artikel</Link>
          <Link to="/jadwal-biaya">Jadwal & Biaya</Link>
          <Link to="/pendaftaran">Pendaftaran</Link>
          <Link to="/fasilitas">Fasilitas</Link>
        </div>
        <div>
          <h3>Media Sosial</h3>
          <div className="social-row">
            <a href="https://twitter.com" target="_blank" rel="noreferrer">t</a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer">f</a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer">i</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
