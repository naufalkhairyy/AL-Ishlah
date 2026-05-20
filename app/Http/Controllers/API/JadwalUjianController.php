<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\JadwalUjian;
use Illuminate\Http\Request;

class JadwalUjianController extends Controller
{
    public function index(Request $request)
    {
        $query = JadwalUjian::with(['ujian', 'santri']);

        if ($request->filled('ujian_id')) {
            $query->where('ujian_id', $request->ujian_id);
        }

        if ($request->filled('santri_id')) {
            $query->where('santri_id', $request->santri_id);
        }

        return response()->json([
            'status' => true,
            'data' => $query->get(),
        ]);
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
}
