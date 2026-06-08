<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Jawaban;
use App\Models\Santri;
use App\Models\Soal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class JawabanController extends Controller
{
    public function index(Request $request)
    {
        $query = Jawaban::with(['soal', 'santri']);

        if ($request->filled('soal_id')) {
            $query->where('soal_id', $request->soal_id);
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
            'soal_id' => 'required|integer|exists:soal,soal_id',
            'santri_id' => 'nullable|integer|exists:santri,santri_id',
            'jawaban_text' => 'required|string',
            'nilai_jawaban' => 'nullable|numeric|min:0|max:100',
            'waktu_submit' => 'nullable|date',
        ]);

        $validated['santri_id'] = $this->resolveSantriId($request, $validated['santri_id'] ?? null);

        if (!isset($validated['waktu_submit'])) {
            $validated['waktu_submit'] = now();
        }

        $soal = Soal::find($validated['soal_id']);
        $nilai = $validated['nilai_jawaban'] ?? null;

        if ($soal && $soal->jenis_soal === 'pg' && $soal->jawaban_benar !== null) {
            $nilai = $this->normalizeAnswer($validated['jawaban_text']) === $this->normalizeAnswer($soal->jawaban_benar)
                ? $soal->bobot_nilai
                : 0;
        }

        $jawaban = Jawaban::updateOrCreate(
            [
                'soal_id' => $validated['soal_id'],
                'santri_id' => $validated['santri_id'],
            ],
            [
                'jawaban_text' => $validated['jawaban_text'],
                'nilai_jawaban' => $nilai,
                'waktu_submit' => $validated['waktu_submit'],
            ]
        );

        return response()->json([
            'status' => true,
            'message' => 'Jawaban berhasil dibuat',
            'data' => $jawaban->load(['soal', 'santri']),
        ], 201);
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'ujian_id' => 'required|integer|exists:ujian,ujian_id',
            'santri_id' => 'nullable|integer|exists:santri,santri_id',
            'waktu_submit' => 'nullable|date',
            'jawaban' => 'required|array|min:1',
            'jawaban.*.soal_id' => 'required|integer|distinct|exists:soal,soal_id',
            'jawaban.*.jawaban_text' => 'nullable|string',
        ]);

        $validated['santri_id'] = $this->resolveSantriId($request, $validated['santri_id'] ?? null);

        $soalIds = collect($validated['jawaban'])->pluck('soal_id')->all();
        $soalById = Soal::where('ujian_id', $validated['ujian_id'])
            ->whereIn('soal_id', $soalIds)
            ->get()
            ->keyBy('soal_id');

        if ($soalById->count() !== count($soalIds)) {
            throw ValidationException::withMessages([
                'jawaban' => 'Semua soal_id harus berasal dari ujian yang dipilih.',
            ]);
        }

        $waktuSubmit = $validated['waktu_submit'] ?? now();

        $saved = DB::transaction(function () use ($validated, $soalById, $waktuSubmit) {
            return collect($validated['jawaban'])->map(function ($item) use ($validated, $soalById, $waktuSubmit) {
                $soal = $soalById[$item['soal_id']];
                $jawabanText = trim((string) ($item['jawaban_text'] ?? ''));
                $nilai = null;

                if ($soal->jenis_soal === 'pg' && $soal->jawaban_benar !== null) {
                    $nilai = $this->normalizeAnswer($jawabanText) === $this->normalizeAnswer($soal->jawaban_benar)
                        ? $soal->bobot_nilai
                        : 0;
                }

                return Jawaban::updateOrCreate(
                    [
                        'soal_id' => $soal->soal_id,
                        'santri_id' => $validated['santri_id'],
                    ],
                    [
                        'jawaban_text' => $jawabanText,
                        'nilai_jawaban' => $nilai,
                        'waktu_submit' => $waktuSubmit,
                    ]
                );
            })->values();
        });

        $saved = Jawaban::with(['soal', 'santri'])
            ->whereIn('jawaban_id', $saved->pluck('jawaban_id'))
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Jawaban berhasil disimpan',
            'summary' => [
                'total_soal_dikirim' => $saved->count(),
                'pg_sudah_dinilai' => $saved->whereNotNull('nilai_jawaban')->count(),
                'essay_menunggu_penilaian' => $saved->whereNull('nilai_jawaban')->count(),
            ],
            'data' => $saved,
        ], 201);
    }

    public function show($id)
    {
        $jawaban = Jawaban::with(['soal', 'santri'])->find($id);

        if (!$jawaban) {
            return response()->json([
                'status' => false,
                'message' => 'Jawaban tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data' => $jawaban,
        ]);
    }

    public function update(Request $request, $id)
    {
        $jawaban = Jawaban::find($id);

        if (!$jawaban) {
            return response()->json([
                'status' => false,
                'message' => 'Jawaban tidak ditemukan',
            ], 404);
        }

        $validated = $request->validate([
            'soal_id' => 'sometimes|integer|exists:soal,soal_id',
            'santri_id' => 'sometimes|integer|exists:santri,santri_id',
            'jawaban_text' => 'nullable|string',
            'nilai_jawaban' => 'nullable|numeric|min:0|max:100',
            'waktu_submit' => 'nullable|date',
        ]);

        $jawaban->update($validated);

        return response()->json([
            'status' => true,
            'message' => 'Jawaban berhasil diupdate',
            'data' => $jawaban->load(['soal', 'santri']),
        ]);
    }

    public function destroy($id)
    {
        $jawaban = Jawaban::find($id);

        if (!$jawaban) {
            return response()->json([
                'status' => false,
                'message' => 'Jawaban tidak ditemukan',
            ], 404);
        }

        $jawaban->delete();

        return response()->json([
            'status' => true,
            'message' => 'Jawaban berhasil dihapus',
        ]);
    }

    private function normalizeAnswer(?string $answer): string
    {
        return strtolower(trim((string) $answer));
    }

    private function resolveSantriId(Request $request, ?int $santriId): int
    {
        if ($santriId !== null) {
            return $santriId;
        }

        $santriId = Santri::where('user_id', $request->user()->user_id)->value('santri_id');

        if ($santriId === null) {
            throw ValidationException::withMessages([
                'santri_id' => 'Akun ini belum punya santri_id. Backend harus membuat record santri dulu sebelum calon santri bisa submit ujian.',
            ]);
        }

        return (int) $santriId;
    }
}
