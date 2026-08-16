import { useMemo, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";

import "../../styles/admin-portal.css";
import logo from "../../assets/logo.png";

import AdminIcon from "./components/AdminIcon";
import Modal from "./components/Modal";
import ToastStack from "./components/ToastStack";

import { navItems } from "./data/adminData";
import { getAuthToken, getAuthUser } from "../../service/api";
import { logoutUser } from "../../service/authservice";

import DashboardPage from "./views/DashboardPage";
import DocumentsPage from "./views/DocumentsPage";
import ExamPage from "./views/ExamPage";
import FinancePage from "./views/FinancePage";
import ProfilePage from "./views/ProfilePage";
import ExamResultPage from "./views/ExamResultPage";

const notificationTranslations = [
  [/request gagal/gi, "Permintaan gagal"],
  [/import/gi, "impor"],
  [/export/gi, "ekspor"],
  [/upload/gi, "unggah"],
  [/download/gi, "unduh"],
  [/update/gi, "pembaruan"],
  [/success/gi, "berhasil"],
  [/successful/gi, "berhasil"],
  [/failed/gi, "gagal"],
  [/error/gi, "kesalahan"],
  [/invalid/gi, "tidak valid"],
  [/required/gi, "wajib diisi"],
  [/unauthorized/gi, "tidak memiliki akses"],
  [/forbidden/gi, "akses ditolak"],
  [/not found/gi, "tidak ditemukan"],
  [/server error/gi, "kesalahan server"],
  [/validation/gi, "validasi"],
  [/created/gi, "dibuat"],
  [/updated/gi, "diperbarui"],
  [/deleted/gi, "dihapus"],
  [/saved/gi, "disimpan"],
  [/selected/gi, "dipilih"],
  [/skipped/gi, "dilewati"],
  [/page/gi, "halaman"],
  [/link/gi, "tautan"],
  [/file/gi, "berkas"],
  [/data/gi, "data"],
];

function localizeNotificationText(value) {
  if (!value) return "";
  return notificationTranslations.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    String(value),
  );
}

export default function AdminPortal() {
  const navigate = useNavigate();
  const { section = "dashboard" } = useParams();

  const user = getAuthUser("admin");
  const isAdmin =
    Boolean(getAuthToken("admin")) && user?.role === "admin";

  const activeSection = navItems.some(
    (item) => item.id === section
  )
    ? section
    : "dashboard";

  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);

  const searchPlaceholder = useMemo(
    () =>
      ({
        dashboard: "Cari santri atau dokumen...",
        profil: "Cari calon santri...",
        ujian: "Cari data ujian...",
        "hasil-ujian": "Cari nama santri atau hasil ujian...",
        dokumen: "Cari nama atau no. pendaftaran...",
        keuangan: "Cari transaksi atau nama santri...",
      })[activeSection],
    [activeSection]
  );

  if (!isAdmin) {
    return (
      <div className="admin-auth-block">
        <section>
          <h1>Akses Admin Ditolak</h1>

          <p>
            Silakan login menggunakan akun admin agar halaman
            administrasi dapat dibuka dengan akses yang sesuai.
          </p>

          <button
            type="button"
            onClick={() => navigate("/admin/login")}
          >
            Masuk Admin
          </button>
        </section>
      </div>
    );
  }

  const notify = (
    title,
    message,
    type = "success"
  ) => {
    const id = Date.now();

    setToasts((items) => [
      ...items,
      {
        id,
        title: localizeNotificationText(title),
        message: localizeNotificationText(message),
        type,
      },
    ]);

    window.setTimeout(() => {
      setToasts((items) =>
        items.filter((item) => item.id !== id)
      );
    }, 3200);
  };

  const openModal = (
    title,
    message,
    body = null,
    eyebrow = "Aksi Admin"
  ) => {
    setModal({
      title,
      message,
      body,
      eyebrow,
    });
  };

  const setSection = (target) => {
    navigate(`/admin/${target}`);
  };

  const handleLogout = async () => {
    try {
      await logoutUser("admin");
    } catch {
      // Sesi lokal tetap dihapus walaupun logout server gagal.
    } finally {
      navigate("/admin/login", {
        replace: true,
      });
    }
  };

  const renderPage = () => {
    switch (activeSection) {
      case "profil":
        return (
          <ProfilePage
            openModal={openModal}
            notify={notify}
          />
        );

      case "ujian":
        return (
          <ExamPage
            openModal={openModal}
            notify={notify}
          />
        );

      case "hasil-ujian":
        return <ExamResultPage notify={notify} />;

      case "dokumen":
        return <DocumentsPage notify={notify} />;

      case "keuangan":
        return <FinancePage notify={notify} />;

      default:
        return (
          <DashboardPage
            openModal={openModal}
            notify={notify}
            setSection={setSection}
          />
        );
    }
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <NavLink
          to="/admin/dashboard"
          className="admin-brand"
        >
          <span className="admin-brand__mark">
            <AdminIcon name="bank" />
          </span>

          <span>
            <strong>Al Ishlah Admin</strong>
            <small>Portal Akademik</small>
          </span>
        </NavLink>

        <nav
          className="admin-nav"
          aria-label="Navigasi admin"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={`/admin/${item.id}`}
              className={({ isActive }) =>
                `admin-nav__link${
                  isActive ? " is-active" : ""
                }`
              }
            >
              <AdminIcon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar__card">
          <small>Sistem Akademik v2.4</small>

          <button
            type="button"
            onClick={() =>
              notify(
                "Pusat Bantuan",
                "Tim admin dapat mencatat kebutuhan bantuan dari sini."
              )
            }
          >
            Pusat Bantuan
          </button>
        </div>

        <div className="admin-sidebar__user">
          <img src={logo} alt="Logo Al-Azhar" />

          <span>
            <strong>Admin Utama</strong>
            <small>Administrator</small>
          </span>
        </div>

        <button
          className="admin-sidebar__logout"
          type="button"
          onClick={handleLogout}
        >
          Keluar Admin
        </button>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <label className="admin-search">
            <AdminIcon name="search" />

            <input
              type="search"
              placeholder={searchPlaceholder}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  notify(
                    "Pencarian berjalan",
                    `Mencari: ${
                      event.currentTarget.value ||
                      "semua data"
                    }`
                  );
                }
              }}
            />
          </label>

          <div className="admin-topbar__actions">
            <div className="admin-topbar__title">
              <strong>
                Portal Administrasi Pesantren
              </strong>

              <small>Senin, 24 Mei 2024</small>
            </div>
          </div>
        </header>

        <main className="admin-content">
          {renderPage()}
        </main>
      </div>

      <button
        className="admin-floating-help"
        type="button"
        onClick={() =>
          notify(
            "Layanan bantuan aktif",
            "Pesan bantuan siap diterima admin."
          )
        }
      >
        ?
      </button>

      <ToastStack toasts={toasts} />

      <Modal
        modal={modal}
        onClose={() => setModal(null)}
      />
    </div>
  );
}
