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
        $soal = Soal::where('ujian_id', $ujian_id)
            ->orderByRaw('nomor_soal IS NULL')
            ->orderBy('nomor_soal')
            ->orderBy('soal_id')
            ->get();

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
            ->orderByRaw('nomor_soal IS NULL')
            ->orderBy('nomor_soal')
            ->orderBy('soal_id')
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
            'nomor_soal'        => 'nullable|integer|min:1',
            'judul_soal'        => 'required|string|max:255',
            'file_soal'         => $this->fileSoalRule($request),
            'jenis_soal'        => 'required|in:pg,essay',
            'opsi_a'            => 'nullable|string',
            'opsi_b'            => 'nullable|string',
            'opsi_c'            => 'nullable|string',
            'opsi_d'            => 'nullable|string',
            'opsi_e'            => 'nullable|string',
            'durasi_pengerjaan' => 'nullable|integer|min:0',
            'jawaban_benar'     => 'nullable|string',
            'bobot_nilai'       => 'nullable|numeric|min:0|max:100',
        ]);

        $validated['durasi_pengerjaan'] = $validated['durasi_pengerjaan'] ?? 0;
        $validated['bobot_nilai'] = $validated['bobot_nilai'] ?? 1;

        if ($request->hasFile('file_soal')) {
            $validated = array_merge($validated, $this->storeFileSoal($request));
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

    public function downloadFile($id)
    {
        $soal = Soal::find($id);

        if (!$soal || $soal->file_soal === null) {
            return response()->json([
                'status'  => false,
                'message' => 'File soal tidak ditemukan',
            ], 404);
        }

        $fileName = $soal->file_soal_nama_file ?: 'file-soal.docx';
        $mimeType = $soal->file_soal_mime_type ?: 'application/octet-stream';

        return response($soal->file_soal, 200, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' . addslashes($fileName) . '"',
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
            'nomor_soal'        => 'sometimes|nullable|integer|min:1',
            'judul_soal'        => 'sometimes|string|max:255',
            'file_soal'         => $this->fileSoalRule($request),
            'jenis_soal'        => 'sometimes|in:pg,essay',
            'opsi_a'            => 'sometimes|nullable|string',
            'opsi_b'            => 'sometimes|nullable|string',
            'opsi_c'            => 'sometimes|nullable|string',
            'opsi_d'            => 'sometimes|nullable|string',
            'opsi_e'            => 'sometimes|nullable|string',
            'durasi_pengerjaan' => 'sometimes|integer|min:0',
            'jawaban_benar'     => 'nullable|string',
            'bobot_nilai'       => 'sometimes|numeric|min:0|max:100',
        ]);

        if ($request->hasFile('file_soal')) {
            $validated = array_merge($validated, $this->storeFileSoal($request));
        } elseif ($request->has('file_soal')) {
            $validated['file_soal'] = null;
            $validated['file_soal_nama_file'] = null;
            $validated['file_soal_mime_type'] = null;
            $validated['file_soal_size'] = null;
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

        $soal->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Soal berhasil dihapus',
        ]);
    }

    private function fileSoalRule(Request $request): string
    {
        if ($request->hasFile('file_soal')) {
            return 'nullable|file|extensions:doc,docx|max:10240';
        }

        return 'nullable|string|max:255';
    }

    private function storeFileSoal(Request $request): array
    {
        $file = $request->file('file_soal');

        return [
            'file_soal' => file_get_contents($file->getRealPath()),
            'file_soal_nama_file' => $file->getClientOriginalName(),
            'file_soal_mime_type' => $file->getClientMimeType(),
            'file_soal_size' => $file->getSize(),
        ];
    }

    private function withFileSoalUrl(Soal $soal): array
    {
        $data = $soal->toArray();
        $data['file_soal_uploaded'] = $soal->file_soal !== null;
        $data['file_soal_url'] = $soal->file_soal !== null
            ? url("/api/soal/{$soal->soal_id}/file")
            : null;

        return $data;
    }
}
