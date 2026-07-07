import { useMemo, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import "../../styles/admin-portal.css";
import logo from "../../assets/logo.png";
import AdminIcon from "./components/AdminIcon";
import Modal from "./components/Modal";
import { navItems } from "./data/adminData";
import { getAuthToken, getAuthUser } from "../../service/api";
import { logoutUser } from "../../service/authservice";
import DashboardPage from "./views/DashboardPage";
import DocumentsPage from "./views/DocumentsPage";
import ExamPage from "./views/ExamPage";
import FinancePage from "./views/FinancePage";
import ProfilePage from "./views/ProfilePage";

export default function AdminPortal() {
  const navigate = useNavigate();
  const { section = "dashboard" } = useParams();
  const user = getAuthUser("admin");
  const isAdmin = Boolean(getAuthToken("admin") && user?.role === "admin");
  const activeSection = navItems.some((item) => item.id === section) ? section : "dashboard";
  const [modal, setModal] = useState(null);
  const searchPlaceholder = useMemo(() => ({
    dashboard: "Cari santri atau dokumen...",
    profil: "Cari calon santri...",
    ujian: "Cari data ujian...",
    dokumen: "Cari nama atau no. pendaftaran...",
    keuangan: "Cari transaksi atau nama santri...",
  }[activeSection]), [activeSection]);

  if (!isAdmin) {
    return (
      <div className="admin-auth-block">
        <section>
          <h1>Akses Admin Ditolak</h1>
          <p>Silakan login memakai akun admin agar data administrasi dapat diakses.</p>
          <button type="button" onClick={() => navigate("/admin/login")}>Login Admin</button>
        </section>
      </div>
    );
  }

  const notify = (title, message, type = "success") => {
    setModal({ title, message, body: null, eyebrow: type === "error" ? "Perlu Perhatian" : "Notifikasi" });
  };

  const openModal = (title, message, body = null, eyebrow = "Aksi Admin") => {
    setModal({ title, message, body, eyebrow });
  };

  const setSection = (target) => navigate(`/admin/${target}`);

  const handleLogout = async () => {
    try {
      await logoutUser("admin");
    } catch {
      // Session lokal tetap dihapus oleh logoutUser walaupun server tidak merespons.
    } finally {
      navigate("/admin/login", { replace: true });
    }
  };

  const renderPage = () => {
    if (activeSection === "profil") return <ProfilePage openModal={openModal} notify={notify} />;
    if (activeSection === "ujian") return <ExamPage openModal={openModal} notify={notify} />;
    if (activeSection === "dokumen") return <DocumentsPage notify={notify} />;
    if (activeSection === "keuangan") return <FinancePage notify={notify} />;
    return <DashboardPage openModal={openModal} notify={notify} setSection={setSection} />;
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <NavLink className="admin-brand" to="/admin/dashboard">
          <span className="admin-brand__mark"><AdminIcon name="bank" /></span>
          <span><strong>Al Ishlah Admin</strong><small>Portal Akademik</small></span>
        </NavLink>
        <nav className="admin-nav" aria-label="Navigasi admin">
          {navItems.map((item) => (
            <NavLink key={item.id} to={`/admin/${item.id}`} className={({ isActive }) => `admin-nav__link${isActive ? " is-active" : ""}`}>
              <AdminIcon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar__user">
          <img src={logo} alt="Logo Al Ishlah" />
          <span><strong>Admin Utama</strong><small>Administrator</small></span>
        </div>
        <button className="admin-sidebar__logout" type="button" onClick={handleLogout}>
          Logout Admin
        </button>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <label className="admin-search">
            <input
              type="search"
              placeholder={searchPlaceholder}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  notify("Pencarian berjalan", `Mencari: ${event.currentTarget.value || "semua data"}`);
                }
              }}
            />
          </label>
          <div className="admin-topbar__actions">
            <div className="admin-topbar__title"><strong>Portal Administrasi Pesantren</strong><small>Senin, 24 Mei 2024</small></div>
          </div>
        </header>
        <main className="admin-content">{renderPage()}</main>
      </div>

      <Modal modal={modal} onClose={() => setModal(null)} />
    </div>
  );
}
