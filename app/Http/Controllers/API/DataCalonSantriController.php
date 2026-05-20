<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\DataCalonSantri;
use Illuminate\Http\Request;

class DataCalonSantriController extends Controller
{
    // Simpan data calon santri
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_lengkap'   => 'required|string|max:100',
            'nama_panggilan' => 'required|string|max:100',
            'tempat_lahir'   => 'required|string|max:50',
            'tanggal_lahir'  => 'required|date',
            'jenis_kelamin'  => 'required|in:L,P',
            'golongan_darah' => 'required|string|max:3',
            'jumlah_saudara' => 'required|integer',
            'anak_ke'        => 'required|integer',
            'alamat'         => 'required|string',
            'nisn'           => 'required|string|max:20',
        ]);

        $calon = DataCalonSantri::updateOrCreate(
            ['user_id' => $request->user()->user_id],
            $validated
        );

        return response()->json([
            'status'  => true,
            'message' => $calon->wasRecentlyCreated
                ? 'Data calon santri berhasil disimpan'
                : 'Data calon santri berhasil diperbarui',
            'data'    => $calon,
        ], $calon->wasRecentlyCreated ? 201 : 200);
    }

    // Ambil data calon santri milik user yang login
    public function show(Request $request)
    {
        $calon = DataCalonSantri::where('user_id', $request->user()->user_id)->first();

        if (!$calon) {
            return response()->json([
                'status'  => false,
                'message' => 'Data tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data'   => $calon,
        ]);
    }
}
