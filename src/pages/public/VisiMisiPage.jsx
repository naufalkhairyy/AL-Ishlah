import "../../styles/VisiMisiPage.css";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";

export default function VisiMisiPage() {
  return (
    <div className="page">

      {/* HEADER */}
      <div className="header">
        <h2>Visi dan Misi Pondok Pesantren Al Ishlah</h2>
      </div>

      {/* VISI MISI */}
      <div className="visi-misi-section">
        <div className="card">
          <div className="card-title">Visi</div>
          <p>
            Menjadi lembaga pendidikan dan dakwah islam terbaik dan unggul
            dalam melahirkan generasi islami yang berakidah, berilmu dan
            beramal sesuai tuntunan Rasulullah Shallallahu ‘alaihi wasallam.
          </p>
        </div>

        <div className="card">
          <div className="card-title">Misi</div>
          <ul>
            <li>Mencetak generasi islami yang berakidah</li>
            <li>Mencetak generasi yang berilmu dan berakhlak</li>
            <li>Memahami Al-Qur’an dan Hadits</li>
            <li>Mengamalkan dan mendakwahkannya</li>
          </ul>
        </div>
      </div>

      {/* STANDAR AKADEMIK */}
      <div className="section-box">
        <div className="section-title">Standar Akademik</div>
        <ul>
          <li>Hafalan Al-Qur’an 10 juz</li>
          <li>Hafal hadits pilihan</li>
          <li>Menguasai Bahasa Arab</li>
          <li>Hafalan matan Al-Jurumiyah</li>
          <li>Praktik ibadah sesuai sunnah</li>
        </ul>
      </div>

      {/* PROGRAM */}
      <div className="section-box">
        <div className="section-title">Program Pendidikan</div>
        <p>
          Program Mutawasithah Putra dan Putri (Setingkat SMP/MTs) <br />
          Mengikuti kurikulum standar Timur Tengah dan pemerintah
        </p>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-left">
          <img src={logo} className="footer-logo" />
          <p>
            Jalan Raya Pekanbaru - Taluk Kuantan KM 30, <br />
            Sungai Pagar, Kampar, Riau
          </p>
        </div>

        <div>
          <h4>Jelajah</h4>
          <Link to="/visi-misi">Sambutan</Link>
          <Link to="/visi-misi">Profil Sekolah</Link>
          <Link to="/berita">Berita</Link>
          <Link to="/fasilitas">Galeri</Link>
        </div>

        <div>
          <h4>Halaman Umum</h4>
          <Link to="/pendaftaran">Formulir</Link>
          <Link to="/berita">Berita & Artikel</Link>
          <Link to="/jadwal-biaya">Jadwal & Biaya</Link>
          <Link to="/pendaftaran">Pendaftaran</Link>
        </div>

        <div>
          <h4>Media Sosial</h4>
          <a href="https://facebook.com" target="_blank" rel="noreferrer">Facebook</a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
        </div>
      </footer>
    </div>
  );
}
