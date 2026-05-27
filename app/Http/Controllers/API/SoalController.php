<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Soal;
use App\Models\Santri;
use App\Models\Ujian;
use App\Services\SoalImportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SoalController extends Controller
{
    // List semua soal berdasarkan ujian
    public function index($ujian_id)
    {
        $soal = Soal::where('ujian_id', $ujian_id)->get();

        return response()->json([
            'status' => true,
            'data'   => $soal->map(fn ($item) => $this->withFileSoalUrl($item))->values(),
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
            'data'   => $soal->map(fn ($item) => $this->withFileSoalUrl($item))->values(),
        ]);
    }

    // Buat soal baru
    public function store(Request $request)
    {
        $validated = $request->validate([
            'ujian_id'          => 'required|integer|exists:ujian,ujian_id',
            'judul_soal'        => 'required|string|max:255',
            'file_soal'         => $this->fileSoalRule($request),
            'jenis_soal'        => 'required|in:pg,essay',
            'durasi_pengerjaan' => 'required|integer',
            'jawaban_benar'     => 'nullable|string',
        ]);

        if ($request->hasFile('file_soal')) {
            $validated['file_soal'] = $this->storeFileSoal($request, (int) $validated['ujian_id']);
        }

        $soal = Soal::create($validated);

        return response()->json([
            'status'  => true,
            'message' => 'Soal berhasil dibuat',
            'data'    => $this->withFileSoalUrl($soal),
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
            'data'   => $this->withFileSoalUrl($soal),
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
            'file_soal'         => $this->fileSoalRule($request),
            'jenis_soal'        => 'sometimes|in:pg,essay',
            'durasi_pengerjaan' => 'sometimes|integer',
            'jawaban_benar'     => 'nullable|string',
        ]);

        if ($request->hasFile('file_soal')) {
            $this->deleteFileSoal($soal);
            $validated['file_soal'] = $this->storeFileSoal($request, (int) $soal->ujian_id);
        } elseif ($request->has('file_soal')) {
            $this->deleteFileSoal($soal);
        }

        $soal->update($validated);

        return response()->json([
            'status'  => true,
            'message' => 'Soal berhasil diupdate',
            'data'    => $this->withFileSoalUrl($soal->fresh()),
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

        $this->deleteFileSoal($soal);
        $soal->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Soal berhasil dihapus',
        ]);
    }

    private function fileSoalRule(Request $request): string
    {
        if ($request->hasFile('file_soal')) {
            return 'nullable|file|mimes:doc,docx|max:10240';
        }

        return 'nullable|string|max:255';
    }

    private function storeFileSoal(Request $request, int $ujianId): string
    {
        return $request->file('file_soal')->store("file-soal/{$ujianId}", 'public');
    }

    private function deleteFileSoal(Soal $soal): void
    {
        if ($soal->file_soal && !filter_var($soal->file_soal, FILTER_VALIDATE_URL)) {
            Storage::disk('public')->delete($soal->file_soal);
        }
    }

    private function withFileSoalUrl(Soal $soal): array
    {
        $data = $soal->toArray();
        $data['file_soal_url'] = null;

        if ($soal->file_soal) {
            $data['file_soal_url'] = filter_var($soal->file_soal, FILTER_VALIDATE_URL)
                ? $soal->file_soal
                : Storage::url($soal->file_soal);
        }

        return $data;
    }
}
