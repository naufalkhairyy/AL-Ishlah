# Postman Collection Runner

File:

- `cbt-santri-api.runner.postman_collection.json`
- `cbt-santri-api.local.postman_environment.json`

## Cara pakai di Postman

1. Jalankan API Laravel:

   ```bash
   php artisan serve
   ```

2. Import collection dan environment dari folder `postman`.
3. Pilih environment `CBT Santri API - Local`.
4. Default variable admin mengikuti seeder Laravel: `admin_username=admin` dan `admin_password=admin123`. Sesuaikan jika akun admin lokal berbeda.
5. Buka collection `CBT Santri API - Collection Runner Tests`, lalu klik `Run`.
6. Pastikan urutan request tidak diacak karena test menyimpan `token`, `registered_user_id`, `santri_id`, `ujian_id`, `soal_id`, `jadwal_id`, dan `pembayaran_id` dari response sebelumnya.

## Cara pakai dengan Newman

```bash
npx newman run postman/cbt-santri-api.runner.postman_collection.json -e postman/cbt-santri-api.local.postman_environment.json
```

Collection ini membuat data testing sementara, menjalankan assertion dasar untuk status code dan struktur response, lalu menghapus data yang dibuat di akhir run.

## Cleanup data testing

Request cleanup ada di akhir collection:

| Request | Data yang dihapus |
| --- | --- |
| `23 - Cleanup Jadwal Ujian` | Jadwal ujian dari variable `jadwal_id` |
| `24 - Cleanup Pembayaran` | Pembayaran dari variable `pembayaran_id` |
| `25 - Cleanup Soal` | Soal dari variable `soal_id` |
| `26 - Cleanup Ujian` | Ujian dari variable `ujian_id` |
| `27 - Cleanup Santri` | Profil santri dari variable `santri_id` |
| `28 - Cleanup Registered User` | Akun user hasil register dari variable `registered_user_id` |

Jika pengujian dihentikan di tengah, jalankan request cleanup dari atas ke bawah mulai `23` sampai `28`. Jangan acak urutan cleanup karena data saling berelasi.

## Penyesuaian untuk tabel Performance Testing

Gunakan collection yang sama untuk mengambil hasil uji pada tabel. Jalankan collection dari awal agar token dan data sementara (`santri_id`, `ujian_id`, `soal_id`, `jadwal_id`, `pembayaran_id`) terisi.

| No | Endpoint pada tabel | Request di collection | Simulasi di Postman | Hasil yang dicatat |
| --- | --- | --- | --- | --- |
| 1 | `/login` | `03 - Login Santri Account (Performance /login)` | Runner iterations `100` | Average response time dan success rate |
| 2 | `/register` | `02 - Register Santri Account (Performance /register)` | Runner iterations `80` | Throughput dari total request/durasi dan error rate |
| 3 | `/ujian/start` | `13 - Ujian Timer (Performance /ujian/start)` | Jalankan bertahap `50`, `150`, lalu `200` iterations. Request ini otomatis memakai `santri_token`. | Peak load dan maximum response time |
| 4 | `/ujian/submit` | `16 - Santri Submit Jawaban (Performance /ujian/submit)` | Runner iterations `100` | Request success rate dan response time |
| 5 | `/hasil-ujian` | `17 - Hasil Ujian (Performance /hasil-ujian)` | Runner iterations `50` | Data accuracy dan latency |
| 6 | `/admin/dashboard` | `21 - Admin Dashboard Pembayaran` dan `22 - Admin Dashboard Dokumen` | Runner iterations `5` | Response time consistency dan CPU usage dari Task Manager/server monitoring |

Catatan: Postman Collection Runner menjalankan request secara berulang untuk membantu pengisian hasil performance sederhana. Untuk beban benar-benar serentak, jalankan beberapa runner/Newman terminal secara paralel dengan environment yang sama.
