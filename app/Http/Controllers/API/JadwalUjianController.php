<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\DataCalonSantri;
use App\Models\JadwalUjian;
use App\Models\Pembayaran;
use App\Models\Santri;
use App\Models\Ujian;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JadwalUjianController extends Controller
{
    public function index(Request $request)
{
    $user = $request->user();

    $query = JadwalUjian::with(['ujian', 'santri']);

    // ADMIN
    if ($user->role === 'admin') {

        if ($request->filled('ujian_id')) {
            $query->where('ujian_id', $request->ujian_id);
        }

        if ($request->filled('santri_id')) {
            $query->where('santri_id', $request->santri_id);
        }

    } 
    // SANTRI
    else {

        $santriId = Santri::where(
            'user_id',
            $user->user_id
        )->value('santri_id');


        if (!$santriId) {
            return response()->json([
                'status' => false,
                'message' => 'Santri belum terhubung dengan akun ini'
            ], 403);
        }


        $query->where('santri_id', $santriId);
    }


    return response()->json([
        'status' => true,
        'data' => $query->get(),
    ]);
}
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'ujian_id' => 'required|integer|exists:ujian,ujian_id',
            'santri_ids' => 'nullable|array',
            'santri_ids.*' => 'integer|distinct|exists:santri,santri_id',
            'tanggal' => 'required|date',
            'waktu_mulai' => 'required|date_format:H:i',
            'waktu_selesai' => 'required|date_format:H:i|after:waktu_mulai',
            'ruang_ujian' => 'nullable|string|max:200',
            'keterangan' => 'nullable|string',
        ]);

        $ujian = Ujian::find($validated['ujian_id']);

        if ($ujian->status !== 'aktif') {
            return response()->json([
                'status' => false,
                'message' => 'Jadwal hanya bisa digenerate untuk ujian aktif.',
            ], 422);
        }

        $santriQuery = Santri::query()->orderBy('santri_id');

        if (!empty($validated['santri_ids'])) {
            $santriQuery->whereIn('santri_id', $validated['santri_ids']);
        }

        $santriList = $santriQuery->get();
        $created = [];
        $skipped = [];
        $errors = [];

        DB::transaction(function () use ($validated, $santriList, &$created, &$skipped, &$errors) {
            foreach ($santriList as $santri) {
                $reason = $this->jadwalSkipReason($validated['ujian_id'], $santri);

                if ($reason !== null) {
                    $skipped[] = [
                        'santri_id' => $santri->santri_id,
                        'nama_lengkap' => $santri->nama_lengkap,
                        'reason' => $reason,
                    ];
                    continue;
                }

                try {
                    $jadwal = JadwalUjian::create([
                        'ujian_id' => $validated['ujian_id'],
                        'santri_id' => $santri->santri_id,
                        'tanggal' => $validated['tanggal'],
                        'waktu_mulai' => $validated['waktu_mulai'],
                        'waktu_selesai' => $validated['waktu_selesai'],
                        'ruang_ujian' => $validated['ruang_ujian'] ?? null,
                        'keterangan' => $validated['keterangan'] ?? null,
                    ]);

                    $created[] = [
                        'jadwal_id' => $jadwal->jadwal_id,
                        'santri_id' => $santri->santri_id,
                        'nama_lengkap' => $santri->nama_lengkap,
                    ];
                } catch (\Throwable $exception) {
                    $errors[] = [
                        'santri_id' => $santri->santri_id,
                        'nama_lengkap' => $santri->nama_lengkap,
                        'message' => $exception->getMessage(),
                    ];
                }
            }
        });

        return response()->json([
            'status' => true,
            'message' => 'Generate jadwal ujian selesai.',
            'created' => count($created),
            'skipped' => count($skipped),
            'errors' => $errors,
            'data' => [
                'created' => $created,
                'skipped' => $skipped,
            ],
        ], 201);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'ujian_id' => 'required|integer|exists:ujian,ujian_id',
            'santri_id' => 'required|integer|exists:santri,santri_id',
            'tanggal' => 'required|date',
            'waktu_mulai' => 'required|date_format:H:i',
            'waktu_selesai' => 'required|date_format:H:i|after:waktu_mulai',
            'ruang_ujian' => 'nullable|string|max:200',
            'keterangan' => 'nullable|string',
        ]);

        $jadwal = JadwalUjian::create($validated);

        return response()->json([
            'status' => true,
            'message' => 'Jadwal ujian berhasil dibuat',
            'data' => $jadwal->load(['ujian', 'santri']),
        ], 201);
    }

    public function show($id)
    {
        $jadwal = JadwalUjian::with(['ujian', 'santri'])->find($id);

        if (!$jadwal) {
            return response()->json([
                'status' => false,
                'message' => 'Jadwal ujian tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data' => $jadwal,
        ]);
    }

    public function update(Request $request, $id)
    {
        $jadwal = JadwalUjian::find($id);

        if (!$jadwal) {
            return response()->json([
                'status' => false,
                'message' => 'Jadwal ujian tidak ditemukan',
            ], 404);
        }

        $validated = $request->validate([
            'ujian_id' => 'sometimes|integer|exists:ujian,ujian_id',
            'santri_id' => 'sometimes|integer|exists:santri,santri_id',
            'tanggal' => 'sometimes|date',
            'waktu_mulai' => 'sometimes|date_format:H:i',
            'waktu_selesai' => 'sometimes|date_format:H:i',
            'ruang_ujian' => 'nullable|string|max:200',
            'keterangan' => 'nullable|string',
        ]);

        if (
            isset($validated['waktu_mulai'], $validated['waktu_selesai'])
            && $validated['waktu_selesai'] <= $validated['waktu_mulai']
        ) {
            return response()->json([
                'status' => false,
                'message' => 'Waktu selesai harus setelah waktu mulai',
            ], 422);
        }

        $jadwal->update($validated);

        return response()->json([
            'status' => true,
            'message' => 'Jadwal ujian berhasil diupdate',
            'data' => $jadwal->load(['ujian', 'santri']),
        ]);
    }

    public function destroy($id)
    {
        $jadwal = JadwalUjian::find($id);

        if (!$jadwal) {
            return response()->json([
                'status' => false,
                'message' => 'Jadwal ujian tidak ditemukan',
            ], 404);
        }

        $jadwal->delete();

        return response()->json([
            'status' => true,
            'message' => 'Jadwal ujian berhasil dihapus',
        ]);
    }

    private function jadwalSkipReason(int $ujianId, Santri $santri): ?string
    {
        if ($santri->user_id === null) {
            return 'Santri belum terhubung ke user.';
        }

        $dokumenDiterima = DataCalonSantri::where('user_id', $santri->user_id)
            ->where('status_dokumen', 'diterima')
            ->exists();

        if (!$dokumenDiterima) {
            return 'Dokumen belum lengkap atau belum diterima.';
        }

        $pembayaranApproved = Pembayaran::where('status', 'approved')
            ->where(function ($query) use ($santri) {
                $query->where('santri_id', $santri->santri_id)
                    ->orWhere('user_id', $santri->user_id);
            })
            ->exists();

        if (!$pembayaranApproved) {
            return 'Pembayaran belum diterima.';
        }

        $alreadyScheduled = JadwalUjian::where('ujian_id', $ujianId)
            ->where('santri_id', $santri->santri_id)
            ->exists();

        if ($alreadyScheduled) {
            return 'Santri sudah punya jadwal untuk ujian ini.';
        }

        return null;
    }
}
