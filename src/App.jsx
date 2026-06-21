import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import Navbar from "./components/Navbar";
import StudentLayout from "./components/StudentLayout";
import AdminPortal from "./pages/admin/AdminPortal";
import Berita from "./pages/public/Berita";
import FormPendaftaran from "./pages/public/FormPendaftaran";
import Home from "./pages/public/Home";
import JadwalBiaya from "./pages/public/JadwalBiaya";
import Login from "./pages/public/Login";
import Signup from "./pages/public/Signup";
import Verifikasi from "./pages/public/Verifikasi";
import VisiMisiPage from "./pages/public/VisiMisiPage";
import StudentDashboard from "./pages/santri/StudentDashboard";
import StudentDocuments from "./pages/santri/StudentDocuments";
import StudentExam from "./pages/santri/StudentExam";
import StudentExamWork from "./pages/santri/StudentExamWork";
import StudentPayments from "./pages/santri/StudentPayments";
import StudentProfile from "./pages/santri/StudentProfile";

function App() {
  const location = useLocation();
  const isStudentArea = location.pathname.startsWith("/santri");
  const isAdminArea = location.pathname.startsWith("/admin");

  return (
    <>
      {!isStudentArea && !isAdminArea && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/visi-misi" element={<VisiMisiPage />} />
        <Route path="/berita" element={<Berita />} />
        <Route path="/pendaftaran" element={<FormPendaftaran />} />
        <Route path="/fasilitas" element={<FormPendaftaran />} />
        <Route path="/jadwal-biaya" element={<JadwalBiaya />} />
        <Route path="/jadwal" element={<JadwalBiaya />} />
        <Route path="/verifikasi" element={<Verifikasi />} />
        <Route path="/admin/login" element={<Login adminOnly />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/:section" element={<AdminPortal />} />
        <Route path="/santri/ujian/:ujianId" element={<StudentExamWork />} />
        <Route path="/santri" element={<StudentLayout />}>
          <Route index element={<Navigate to="/santri/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="profil" element={<StudentProfile />} />
          <Route path="ujian" element={<StudentExam />} />
          <Route path="dokumen" element={<StudentDocuments />} />
          <Route path="pembayaran" element={<StudentPayments />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
