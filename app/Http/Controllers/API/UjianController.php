<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Santri;
use App\Models\Ujian;
use App\Services\UjianTimerService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class UjianController extends Controller
{
    // List semua ujian
    public function index()
    {
        $ujian = Ujian::all();

        return response()->json([
            'status' => true,
            'data'   => $ujian,
        ]);
    }

    // Buat ujian baru (admin)
    public function store(Request $request)
    {
        $request->validate([
            'nama_ujian' => 'required|string|max:100',
            'tanggal'    => 'required|date',
            'durasi'     => 'required|integer',
            'status'     => 'required|in:aktif,nonaktif,selesai',
        ]);

        $ujian = Ujian::create([
            'nama_ujian' => $request->nama_ujian,
            'tanggal'    => $request->tanggal,
            'durasi'     => $request->durasi,
            'status'     => $request->status,
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Ujian berhasil dibuat',
            'data'    => $ujian,
        ], 201);
    }

    // Detail ujian
    public function show($id)
    {
        $ujian = Ujian::find($id);

        if (!$ujian) {
            return response()->json([
                'status'  => false,
                'message' => 'Ujian tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data'   => $ujian,
        ]);
    }

    public function timer(Request $request, $id, UjianTimerService $timerService)
    {
        $ujian = Ujian::find($id);

        if (!$ujian) {
            return response()->json([
                'status'  => false,
                'message' => 'Ujian tidak ditemukan',
            ], 404);
        }

        $santriId = $this->resolveSantriId($request);
        $timer = $timerService->status($ujian, $santriId);

        if (!$timer) {
            return response()->json([
                'status' => false,
                'message' => 'Jadwal ujian untuk santri ini tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data' => $timer,
        ]);
    }

    // Update ujian
    public function update(Request $request, $id)
    {
        $ujian = Ujian::find($id);

        if (!$ujian) {
            return response()->json([
                'status'  => false,
                'message' => 'Ujian tidak ditemukan',
            ], 404);
        }

        $request->validate([
            'nama_ujian' => 'sometimes|string|max:100',
            'tanggal'    => 'sometimes|date',
            'durasi'     => 'sometimes|integer',
            'status'     => 'sometimes|in:aktif,nonaktif,selesai',
        ]);

        $ujian->update($request->all());

        return response()->json([
            'status'  => true,
            'message' => 'Ujian berhasil diupdate',
            'data'    => $ujian,
        ]);
    }

    // Hapus ujian
    public function destroy($id)
    {
        $ujian = Ujian::find($id);

        if (!$ujian) {
            return response()->json([
                'status'  => false,
                'message' => 'Ujian tidak ditemukan',
            ], 404);
        }

        $ujian->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Ujian berhasil dihapus',
        ]);
    }

    private function resolveSantriId(Request $request): int
    {
        if ($request->filled('santri_id')) {
            return (int) $request->validate([
                'santri_id' => 'integer|exists:santri,santri_id',
            ])['santri_id'];
        }

        $santriId = Santri::where('user_id', $request->user()->user_id)->value('santri_id');

        if ($santriId === null) {
            throw ValidationException::withMessages([
                'santri_id' => 'Akun ini belum punya santri_id.',
            ]);
        }

        return (int) $santriId;
    }
}
