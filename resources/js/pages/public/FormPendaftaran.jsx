import "../../styles/pendaftaran.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PublicFooter from "../../components/PublicFooter";
import { heroImage } from "./homeShared";

const facilities = [
  {
    title: "Aula Sekolah",
    image:
      "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=520&q=80",
  },
  {
    title: "Kantin",
    image:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=520&q=80",
  },
  {
    title: "Pondok Pesantren Al Ishlah",
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=520&q=80",
  },
  {
    title: "Halaman",
    image:
      "https://images.unsplash.com/photo-1524069290683-0457abfe42c3?auto=format&fit=crop&w=520&q=80",
  },
  {
    title: "Perpustakaan",
    image:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=520&q=80",
  },
];

const forms = [
  {
    title: "Formulir Pendaftaran SMP Akhwat",
    price: "100.000",
    icon: "school",
  },
  {
    title: "Formulir Pendaftaran SMP Ikhwan",
    price: "100.000",
    deadline: "05 agustus 2025",
    icon: "chart",
  },
  {
    title: "Formulir Pendaftaran SMA Akhwat",
    deadline: "05 agustus 2025",
    icon: "school",
  },
  {
    title: "Formulir Pendaftaran SMA Ikhwan",
    price: "100.000",
    deadline: "05 agustus 2025",
    icon: "chart",
  },
];

function RoundIcon({ type = "school" }) {
  return <span className={`round-icon round-icon--${type}`} aria-hidden="true" />;
}

export default function FormPendaftaran() {
  const navigate = useNavigate();
  const [activeFacility, setActiveFacility] = useState(0);
  const orderedFacilities = facilities
    .slice(activeFacility)
    .concat(facilities.slice(0, activeFacility));
  const moveFacility = (direction) => {
    setActiveFacility((current) => {
      const next = current + direction;
      if (next < 0) return facilities.length - 1;
      if (next >= facilities.length) return 0;
      return next;
    });
  };

  return (
    <main className="school-page form-page">
      <section className="form-top" style={{ "--hero-image": `url(${heroImage})` }}>
        <div className="form-top__action">
          <button onClick={() => navigate("/login")}>Cek Hasil PPDB</button>
        </div>
        <h1>Profile Pondok Pesantren Al Ishlah Al Islamy</h1>
        <div className="facility-slider">
          <button className="slider-btn slider-btn--left" aria-label="Sebelumnya" onClick={() => moveFacility(-1)}>
            {"<"}
          </button>
          <div className="facility-track">
            {orderedFacilities.map((item, index) => (
              <article className="facility-card" key={item.title}>
                <img src={item.image} alt="" />
                <h2>{item.title}</h2>
                {index === 0 && <button onClick={() => navigate("/pendaftaran")}>Lihat Formulir</button>}
              </article>
            ))}
          </div>
          <button className="slider-btn slider-btn--right" aria-label="Berikutnya" onClick={() => moveFacility(1)}>
            {">"}
          </button>
        </div>
      </section>

      <section className="registration-section page-shell">
        <h2 className="section-heading">Formuli Pendaftaran</h2>
        <div className="registration-grid">
          <aside className="school-info-card">
            <RoundIcon type="school" />
            <h3>Nama Sekolah</h3>
            <p>Pondok Pesantren Al Ishlah Al Islamy</p>
            <h3>Nama Mudir Pondok</h3>
            <p>Ustad Abdurrahman LC.MA.</p>

            <RoundIcon type="pin" />
            <h3>Alamat</h3>
            <p>Jl. Siliwangi No. 123 Cibadak</p>
            <p>Sukabumi - Jawa barat</p>
            <p>43351</p>

            <RoundIcon type="web" />
            <h3>Webite/Email</h3>
            <p>smpn1cibadak.sch.id / http://</p>
            <p>alishlah.kampar@gmail.com</p>
            <h3>No. Telp</h3>
            <p>0000000</p>
          </aside>

          <div className="form-card-grid">
            {forms.map((item) => (
              <article className="form-product-card" key={item.title}>
                <RoundIcon type={item.icon} />
                <h3>{item.title}</h3>
                {item.deadline && (
                  <div className="deadline">
                    <strong>Batas Pendaftaran</strong>
                    <span>{item.deadline}</span>
                  </div>
                )}
                {item.price && <strong className="price">{item.price}</strong>}
                <button onClick={() => navigate("/signup")}>
                  {item.price ? "Beli" : "Daftar Minat"}
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
