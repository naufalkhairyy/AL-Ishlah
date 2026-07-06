import "../../styles/VisiMisiPage.css";
import PublicFooter from "../../components/PublicFooter";

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

      <PublicFooter />
    </div>
  );
}
