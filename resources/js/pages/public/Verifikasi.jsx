import React from "react";
import { useLocation, useNavigate } from "react-router-dom"; // ✅ TAMBAH

export default function Verifikasi() {

  const location = useLocation(); // ✅ ambil data dari navigate
  const navigate = useNavigate(); // ✅ untuk pindah halaman

  const data = location.state || {}; // ✅ biar tidak undefined

  return (
    <div className="bg-background min-h-screen px-6 py-12">

      {/* HEADER */}
      <div className="text-center mb-10">
        <div className="relative mb-4 inline-block">
          <div className="absolute -inset-4 bg-green-100 blur-xl rounded-full"></div>
          <span className="material-symbols-outlined text-5xl text-green-600 relative">
            verified
          </span>
        </div>

        <h2 className="text-2xl font-bold text-green-700 mb-2">
          Verifikasi Data Pendaftaran
        </h2>

        <p className="text-sm text-gray-500 max-w-xl mx-auto">
          Silakan periksa kembali informasi yang telah Anda masukkan sebelum melanjutkan ke tahap akhir.
        </p>
      </div>

      {/* STEPPER tetap sama */}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">

          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-gray-700">
              Data Calon Santri
            </h3>
            <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full">
              Langkah 2 dari 3
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">

            <div>
              <p className="text-gray-500">Nama Lengkap</p>
              <p className="font-medium">{data.nama || "-"}</p>
            </div>

            <div>
              <p className="text-gray-500">Tempat / Tanggal Lahir</p>
              <p className="font-medium">
                {data.tempat || "-"}, {data.tanggal || "-"}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Jenis Kelamin</p>
              <p className="font-medium">{data.jk || "-"}</p>
            </div>

            <div>
              <p className="text-gray-500">Program Dipilih</p>
              <p className="font-medium">{data.program || "-"}</p>
            </div>

            <div className="md:col-span-2">
              <p className="text-gray-500">Alamat Lengkap</p>
              <p className="font-medium">{data.alamat || "-"}</p>
            </div>

            <div>
              <p className="text-gray-500">No HP</p>
              <p className="font-medium">{data.hp || "-"}</p>
            </div>

            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium">{data.email || "-"}</p>
            </div>

          </div>

        </div>

        {/* RIGHT */}
        <div className="space-y-4">

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">

            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              !
            </div>

            <h4 className="font-semibold mb-2 text-gray-700">
              Konfirmasi Akhir
            </h4>

            <p className="text-sm text-gray-500 mb-4">
              Pastikan semua data sudah benar sebelum dikirim.
            </p>

            {/* ✅ FIX BUTTON */}
            <button
              onClick={() => alert("Data berhasil dikirim")}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg mb-2 transition"
            >
              Konfirmasi & Kirim
            </button>

            <button
              onClick={() => navigate("/pendaftaran")}
              className="w-full py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition"
            >
              ← Kembali ke Form
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}