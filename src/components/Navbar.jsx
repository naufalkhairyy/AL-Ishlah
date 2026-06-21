import { NavLink } from "react-router-dom";
import "../styles/navbar.css";
import logo from "../assets/logo.png";

const links = [
  { to: "/", label: "Home" },
  { to: "/pendaftaran", label: "Formulir" },
  { to: "/berita", label: "Berita & Artikel" },
  { to: "/jadwal-biaya", label: "Jadwal & Biaya" },
  { to: "/fasilitas", label: "Fasilitas" },
  { to: "/visi-misi", label: "Visi & Misi" },
];

export default function Navbar() {
  return (
    <header className="site-nav">
      <div className="site-nav__inner">
        <NavLink to="/" className="site-nav__brand" aria-label="Al Ishlah Al Islamy">
          <img src={logo} alt="Logo Al Ishlah Al Islamy" />
        </NavLink>

        <nav className="site-nav__links" aria-label="Navigasi utama">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `site-nav__link${isActive ? " is-active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <NavLink to="/login" className="site-nav__login">
          Login
        </NavLink>
      </div>
    </header>
  );
}
