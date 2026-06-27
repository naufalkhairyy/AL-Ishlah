import "../../styles/jadwal.css";
import { useNavigate } from "react-router-dom";
import PublicFooter from "../../components/PublicFooter";
import { heroImage } from "./homeShared";

const campusImage =
  "https://images.unsplash.com/photo-1591017403286-fd8493524e1e?auto=format&fit=crop&w=900&q=80";

function InfoIcon({ type }) {
  return <span className={`schedule-icon schedule-icon--${type}`} aria-hidden="true" />;
}

export default function JadwalBiaya() {
  const navigate = useNavigate();

  return (
    <main className="school-page schedule-page">
      <section className="sub-hero" style={{ "--hero-image": `url(${heroImage})` }}>
        <div className="sub-hero__content">
          <h1>Jadwal & Biaya</h1>
          <p>Ikuti agenda PPDB, siapkan dokumen, dan mulai pendaftaran dengan lebih tenang.</p>
          <button onClick={() => navigate("/pendaftaran")}>Daftar Sekarang</button>
        </div>
      </section>

      <section className="schedule-info page-shell">
        <h2 className="section-heading">Info Agenda</h2>
        <div className="schedule-card-row">
          <article className="outline-card">
            <InfoIcon type="clock" />
            <h3>Waktu Mulai</h3>
            <p>08:00 AM</p>
            <p>2020-06-29</p>
          </article>
          <article className="outline-card">
            <InfoIcon type="flag" />
            <h3>Waktu Selesai</h3>
            <p>05:00 PM</p>
            <p>2020-07-04</p>
          </article>
          <article className="outline-card">
            <InfoIcon type="pin" />
            <h3>Tempat</h3>
            <p>Gedung SMPN 1 Cibadak</p>
          </article>
        </div>
      </section>

      <section className="schedule-info schedule-cost page-shell">
        <h2 className="section-heading">Biaya Pendidikan</h2>
        <div className="schedule-card-row">
          <article className="outline-card cost-card"><span>Formulir</span>Rp 100.000</article>
          <article className="outline-card cost-card"><span>Daftar Ulang</span>Rp 2.500.000</article>
          <article className="outline-card cost-card"><span>SPP Bulanan</span>Rp 750.000</article>
        </div>
      </section>

      <section className="schedule-chart page-shell">
        <div className="schedule-chart__copy">
          <h2 className="section-heading">Progress PPDB</h2>
          <p>Grafik ini membantu calon wali santri melihat tahap pendaftaran dari pembukaan sampai seleksi.</p>
          <button onClick={() => navigate("/signup")}>Buat Akun Pendaftar</button>
        </div>
        <div className="timeline-chart">
          {[
            ["Pendaftaran", "100%"],
            ["Verifikasi", "72%"],
            ["Pembayaran", "48%"],
            ["Ujian", "30%"],
          ].map(([label, value]) => (
            <div className="timeline-chart__row" key={label}>
              <span>{label}</span>
              <div><i style={{ "--timeline": value }} /></div>
              <b>{value}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="letter-band">
        <div className="page-shell letter-grid">
          <div className="letter-copy">
            <p>Assalamu'alaikum wrwb,</p>
            <p>
              Dipermaklumkan dengan hormat, di tengah masih mewabahnya penyebaran
              Covid-19, semoga Bapak/Ibu dalam keadaan sehat walafiat. Selanjutnya,
              menindaklanjuti Surat Keputusan Bupati Sukabumi Nomor
              421/Kep.444/Disdik/2020 tentang Penerimaan Peserta Didik Baru pada
              Taman Kanak-kanak, Sekolah Dasar, dan Sekolah Menengah Pertama Tahun
              Pelajaran 2020/2021, maka perlu kami sampaikan bahwa Penerimaan
              Peseta Didik Baru ( PPDB ) Tahun Pelajaran 2020/2021 di SMP Negeri 1
              Cibadak dilaksanakan secara daring ( online ) melalui
              http://smpn1cibadak.sch.id/ppdb/ dengan jadwal seperti pada lampiran
              surat ini.
            </p>
            <button onClick={() => navigate("/pendaftaran")}>Lihat Formulir</button>
          </div>
          <img src={campusImage} alt="" />
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
