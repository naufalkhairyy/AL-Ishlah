import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { StudentPortalProvider } from "./StudentPortalContext";
import { useStudentPortal } from "./useStudentPortal";
import { logoutUser } from "../service/authservice";
import "../styles/student-dashboard.css";

const navItems = [
  { to: "/santri/dashboard", label: "Dasbor", icon: "grid" },
  { to: "/santri/profil", label: "Profil", icon: "user" },
  { to: "/santri/ujian", label: "Ujian", icon: "exam" },
  { to: "/santri/dokumen", label: "Dokumen", icon: "folder" },
  { to: "/santri/pembayaran", label: "Pembayaran", icon: "wallet" },
  { to: "/santri/hasil-ujian", label: "Hasil Ujian", icon: "result" },
];

export function StudentIcon({ name }) {
  return (
    <span
      className={`student-icon student-icon--${name}`}
      aria-hidden="true"
    />
  );
}

function StudentLayoutContent() {
  const navigate = useNavigate();
  const { profile, progress, resetApplication } = useStudentPortal();

  const studentName = profile.namaLengkap || "Calon Santri";

  const initials =
    studentName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "CS";

  const handleLogout = async (event) => {
    event.preventDefault();
    await logoutUser("student");
    navigate("/login");
  };

  const handleSearch = (event) => {
    if (event.key !== "Enter") return;

    const value = event.currentTarget.value.toLowerCase();

    if (value.includes("dokumen") || value.includes("upload")) {
      navigate("/santri/dokumen");
    } else if (value.includes("bayar") || value.includes("pembayaran")) {
      navigate("/santri/pembayaran");
    } else if (value.includes("ujian")) {
      navigate("/santri/ujian");
    } else if (value.includes("profil") || value.includes("data")) {
      navigate("/santri/profil");
    } else {
      navigate("/santri/dashboard");
    }
  };

  return (
    <div className="student-shell">
      <aside className="student-sidebar">
        <NavLink to="/santri/dashboard" className="student-brand">
          <span className="student-brand__mark">A</span>

          <span>
            <strong>Pesantren Al Ishhlah Al Islamy</strong>
            <small>Portal Calon Santri</small>
          </span>
        </NavLink>

        <nav
          className="student-sidebar__nav"
          aria-label="Navigasi santri"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `student-sidebar__link${isActive ? " is-active" : ""}`
              }
            >
              <StudentIcon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="student-sidebar__bottom">
          <NavLink
            to="/santri/profil"
            className="student-new-app"
            onClick={resetApplication}
          >
            <span>+</span>
            Pendaftaran Baru
          </NavLink>

          <NavLink
            to="/login"
            className="student-logout"
            onClick={handleLogout}
          >
            <StudentIcon name="logout" />
            <span>Keluar</span>
          </NavLink>
        </div>
      </aside>

      <div className="student-main">
        <header className="student-topbar">
          <div className="student-topbar__title">
            <strong>Al Ishhlah Digital</strong>
            <span>Portal Calon Santri</span>
          </div>

          <label className="student-search">
            <StudentIcon name="search" />

            <input
              type="search"
              placeholder="Cari informasi..."
              onKeyDown={handleSearch}
            />
          </label>

          <div className="student-topbar__actions">
            <div className="student-user">
              <span>
                <strong>{studentName}</strong>

                <small>
                  {progress.santriId
                    ? `Peserta Ujian #${progress.santriId}`
                    : "Belum menjadi peserta ujian"}
                </small>
              </span>

              <div className="student-avatar">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <main className="student-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function StudentLayout() {
  return (
    <StudentPortalProvider>
      <StudentLayoutContent />
    </StudentPortalProvider>
  );
}
