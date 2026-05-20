<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\DataAyahCalonSantri;
use App\Models\DataCalonSantri;
use Illuminate\Http\Request;

class DataAyahCalonSantriController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama'          => 'required|string|max:100',
            'tempat_lahir'  => 'required|string|max:50',
            'tanggal_lahir' => 'required|date',
            'pekerjaan'     => 'required|string|max:100',
            'pendidikan'    => 'required|string|max:50',
            'penghasilan'   => 'required|numeric',
            'alamat'        => 'required|string',
            'desa'          => 'required|string|max:50',
            'kecamatan'     => 'required|string|max:50',
            'kota'          => 'required|string|max:50',
            'provinsi'      => 'required|string|max:50',
            'no_hp'         => 'required|string|max:20',
        ]);

        $calon = DataCalonSantri::where('user_id', $request->user()->user_id)->first();

        if (!$calon) {
            return response()->json([
                'status'  => false,
                'message' => 'Data calon santri tidak ditemukan',
            ], 404);
        }

        $ayah = DataAyahCalonSantri::updateOrCreate(
            ['calon_santri_id' => $calon->calon_santri_id],
            $validated
        );

        return response()->json([
            'status'  => true,
            'message' => $ayah->wasRecentlyCreated
                ? 'Data ayah berhasil disimpan'
                : 'Data ayah berhasil diperbarui',
            'data'    => $ayah,
        ], $ayah->wasRecentlyCreated ? 201 : 200);
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

        $ayah = DataAyahCalonSantri::where('calon_santri_id', $calon->calon_santri_id)->first();

        if (!$ayah) {
            return response()->json([
                'status'  => false,
                'message' => 'Data ayah tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data'   => $ayah,
        ]);
    }
}
