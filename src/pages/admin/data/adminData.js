export const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "profil", label: "Profil Calon Santri", icon: "users" },
  { id: "ujian", label: "Manajemen Ujian", icon: "exam" },
  { id: "hasil-ujian", label: "Hasil Ujian", icon: "result" },
  { id: "dokumen", label: "Verifikasi Dokumen", icon: "shield" },
  { id: "keuangan", label: "Keuangan", icon: "money" },
];
export const applicantsSeed = [
  { id: 1, initials: "AM", name: "Ahmad Maulana", region: "Jawa Barat, Indonesia", nisn: "0098712345", status: "Pending", date: "12 Okt 2023" },
  { id: 2, initials: "FZ", name: "Fatimah Az-Zahra", region: "DKI Jakarta, Indonesia", nisn: "0102938475", status: "Verified", date: "10 Okt 2023" },
  { id: 3, initials: "RH", name: "Rayhan Hidayat", region: "Jawa Timur, Indonesia", nisn: "0112233445", status: "Pending", date: "09 Okt 2023" },
  { id: 4, initials: "SA", name: "Siti Aminah", region: "Sumatera Barat, Indonesia", nisn: "0088776655", status: "Verified", date: "08 Okt 2023" },
];

export const documentQueueSeed = [
  { id: 1, name: "Muhammad Zaki", reg: "REG-2024-00891", category: "Pas Foto", age: "15m lalu", status: "Menunggu", image: true },
  { id: 2, name: "Siti Fatimah", reg: "REG-2024-00902", category: "Ijazah / SKL", age: "32m lalu", status: "Menunggu", image: true },
  { id: 3, name: "Abdurrahman Wahid", reg: "REG-2024-00915", category: "Rapor Semester", age: "1j lalu", status: "Menunggu", image: false },
];

export const paymentsSeed = [
  { id: 1, initials: "AR", name: "Abdurrahman Wahid", code: "AZH-240192", category: "Uang Pangkal", amount: "Rp 12.500.000", date: "14 Mei 2024", method: "VIA BSI TRANSFER" },
  { id: 2, initials: "ZM", name: "Zayn Malik Al-Fatih", code: "AZH-240211", category: "SPP Bulanan", amount: "Rp 2.750.000", date: "13 Mei 2024", method: "VIA MANDIRI VIRTUAL" },
  { id: 3, initials: "FA", name: "Fatimah Az-Zahra", code: "AZH-240305", category: "Uang Pangkal", amount: "Rp 12.500.000", date: "12 Mei 2024", method: "VIA BRI TRANSFER" },
  { id: 4, initials: "IH", name: "Ibrahim Hasan", code: "AZH-240442", category: "Uang Seragam", amount: "Rp 3.500.000", date: "12 Mei 2024", method: "VIA BSI MOBILE" },
];

export const notificationSeed = [
  { id: 1, title: "12 berkas menunggu", detail: "Verifikasi dokumen belum tersambung backend.", time: "Realtime nanti dari API" },
  { id: 2, title: "42 transaksi pending", detail: "Data pembayaran akan diambil dari endpoint keuangan.", time: "Menunggu backend" },
  { id: 3, title: "3 jadwal ujian aktif", detail: "Sinkronisasi jadwal bisa disambungkan ke database ujian.", time: "Demo frontend" },
];


export const backendFeatures = [
  "Notifikasi realtime admin",
  "Sinkronisasi data calon santri",
  "Upload dan preview dokumen asli",
  "Verifikasi pembayaran dari database",
  "Export laporan PDF/CSV dari server",
];