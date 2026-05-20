<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\DataSekolahAsalCalonSantri;
use App\Models\DataCalonSantri;
use Illuminate\Http\Request;

class DataSekolahAsalCalonSantriController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_sekolah'   => 'required|string|max:100',
            'alamat_sekolah' => 'required|string',
            'kota'           => 'required|string|max:50',
            'provinsi'       => 'required|string|max:50',
            'tahun_lulus'    => 'required|digits:4|integer',
        ]);

        $calon = DataCalonSantri::where('user_id', $request->user()->user_id)->first();

        if (!$calon) {
            return response()->json([
                'status'  => false,
                'message' => 'Data calon santri tidak ditemukan',
            ], 404);
        }

        $sekolah = DataSekolahAsalCalonSantri::updateOrCreate(
            ['calon_santri_id' => $calon->calon_santri_id],
            $validated
        );

        return response()->json([
            'status'  => true,
            'message' => $sekolah->wasRecentlyCreated
                ? 'Data sekolah asal berhasil disimpan'
                : 'Data sekolah asal berhasil diperbarui',
            'data'    => $sekolah,
        ], $sekolah->wasRecentlyCreated ? 201 : 200);
    }

    public function show(Request $request)
    {
        $calon = DataCalonSantri::where('user_id', $request->user()->user_id)->first();

        if (!$calon) {
            return response()->json([
                'status'  => false,
                'message' => 'Data calon santri tidak ditemukan',
            ], 404);
        }

        $sekolah = DataSekolahAsalCalonSantri::where('calon_santri_id', $calon->calon_santri_id)->first();

        if (!$sekolah) {
            return response()->json([
                'status'  => false,
                'message' => 'Data sekolah tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data'   => $sekolah,
        ]);
    }
}
