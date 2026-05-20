<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\DataWaliCalonSantri;
use App\Models\DataCalonSantri;
use Illuminate\Http\Request;

class DataWaliCalonSantriController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama'          => 'required|string|max:100',
            'tempat_lahir'  => 'required|string|max:50',
            'tanggal_lahir' => 'required|date',
            'pekerjaan'     => 'required|string|max:100',
            'pendidikan'    => 'required|string|max:50',
            'alamat'        => 'required|string',
            'desa'          => 'required|string|max:50',
            'kecamatan'     => 'required|string|max:50',
            'kota'          => 'required|string|max:50',
            'provinsi'      => 'required|string|max:50',
            'no_hp'         => 'required|string|max:20',
            'hubungan'      => 'required|string|max:50',
        ]);

        $calon = DataCalonSantri::where('user_id', $request->user()->user_id)->first();

        if (!$calon) {
            return response()->json([
                'status'  => false,
                'message' => 'Data calon santri tidak ditemukan',
            ], 404);
        }

        $wali = DataWaliCalonSantri::updateOrCreate(
            ['calon_santri_id' => $calon->calon_santri_id],
            $validated
        );

        return response()->json([
            'status'  => true,
            'message' => $wali->wasRecentlyCreated
                ? 'Data wali berhasil disimpan'
                : 'Data wali berhasil diperbarui',
            'data'    => $wali,
        ], $wali->wasRecentlyCreated ? 201 : 200);
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

        $wali = DataWaliCalonSantri::where('calon_santri_id', $calon->calon_santri_id)->first();

        if (!$wali) {
            return response()->json([
                'status'  => false,
                'message' => 'Data wali tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data'   => $wali,
        ]);
    }
}
