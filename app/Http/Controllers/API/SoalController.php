<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Soal;
use App\Models\Santri;
use App\Models\Ujian;
use App\Services\SoalImportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SoalController extends Controller
{
    // List semua soal berdasarkan ujian
    public function index($ujian_id)
    {
        $soal = Soal::where('ujian_id', $ujian_id)->get();

        return response()->json([
            'status' => true,
            'data'   => $soal,
        ]);
    }

    // Ambil semua soal ujian beserta jawaban santri tertentu
    public function indexWithJawaban($ujian_id, $santri_id)
    {
        if (!Ujian::where('ujian_id', $ujian_id)->exists()) {
            return response()->json([
                'status'  => false,
                'message' => 'Ujian tidak ditemukan',
            ], 404);
        }

        if (!Santri::where('santri_id', $santri_id)->exists()) {
            return response()->json([
                'status'  => false,
                'message' => 'Santri tidak ditemukan',
            ], 404);
        }

        $soal = Soal::where('ujian_id', $ujian_id)
            ->with(['jawaban' => function ($query) use ($santri_id) {
                $query->where('santri_id', $santri_id);
            }])
            ->get();

        return response()->json([
            'status' => true,
            'data'   => $soal,
        ]);
    }

    // Buat soal baru
    public function store(Request $request)
    {
        $request->validate([
            'ujian_id'          => 'required|integer|exists:ujian,ujian_id',
            'judul_soal'        => 'required|string|max:255',
            'file_soal'         => 'nullable|string|max:255',
            'jenis_soal'        => 'required|in:pg,essay',
            'durasi_pengerjaan' => 'required|integer',
            'jawaban_benar'     => 'nullable|string',
        ]);

        $soal = Soal::create([
            'ujian_id'          => $request->ujian_id,
            'judul_soal'        => $request->judul_soal,
            'file_soal'         => $request->file_soal,
            'jenis_soal'        => $request->jenis_soal,
            'durasi_pengerjaan' => $request->durasi_pengerjaan,
            'jawaban_benar'     => $request->jawaban_benar,
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Soal berhasil dibuat',
            'data'    => $soal,
        ], 201);
    }

    // Import soal dari Excel (.xlsx) atau CSV
    public function import(Request $request, $ujian_id, SoalImportService $importService)
    {
        if (!Ujian::where('ujian_id', $ujian_id)->exists()) {
            return response()->json([
                'status'  => false,
                'message' => 'Ujian tidak ditemukan',
            ], 404);
        }

        $request->validate([
            'file' => 'required|file|mimes:xlsx,csv,txt|max:5120',
        ]);

        $rows = $importService->parse($request->file('file'), (int) $ujian_id);

        $created = DB::transaction(function () use ($rows) {
            return collect($rows)->map(fn ($row) => Soal::create($row))->values();
        });

        return response()->json([
            'status'  => true,
            'message' => 'Import soal berhasil',
            'total'   => $created->count(),
            'data'    => $created,
        ], 201);
    }

    // Detail soal
    public function show($id)
    {
        $soal = Soal::find($id);

        if (!$soal) {
            return response()->json([
                'status'  => false,
                'message' => 'Soal tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data'   => $soal,
        ]);
    }

    // Update soal
    public function update(Request $request, $id)
    {
        $soal = Soal::find($id);

        if (!$soal) {
            return response()->json([
                'status'  => false,
                'message' => 'Soal tidak ditemukan',
            ], 404);
        }

        $validated = $request->validate([
            'judul_soal'        => 'sometimes|string|max:255',
            'file_soal'         => 'nullable|string|max:255',
            'jenis_soal'        => 'sometimes|in:pg,essay',
            'durasi_pengerjaan' => 'sometimes|integer',
            'jawaban_benar'     => 'nullable|string',
        ]);

        $soal->update($validated);

        return response()->json([
            'status'  => true,
            'message' => 'Soal berhasil diupdate',
            'data'    => $soal,
        ]);
    }

    // Hapus soal
    public function destroy($id)
    {
        $soal = Soal::find($id);

        if (!$soal) {
            return response()->json([
                'status'  => false,
                'message' => 'Soal tidak ditemukan',
            ], 404);
        }

        $soal->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Soal berhasil dihapus',
        ]);
    }
}
