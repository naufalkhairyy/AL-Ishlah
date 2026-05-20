<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Ujian;
use Illuminate\Http\Request;

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
}