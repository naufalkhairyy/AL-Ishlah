<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\DataCalonSantri;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DataCalonSantriController extends Controller
{
    private const DOKUMEN_FIELDS = [
        'akta_kelahiran',
        'pas_foto',
        'kartu_keluarga',
        'ktp',
        'ijazah_skl',
        'ktp_ayah',
        'ktp_ibu',
    ];

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
            'akta_kelahiran' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'pas_foto'       => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'kartu_keluarga' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'ktp'            => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'ijazah_skl'     => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'ktp_ayah'       => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'ktp_ibu'        => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $calonLama = DataCalonSantri::where('user_id', $request->user()->user_id)->first();
        $validated = array_merge($validated, $this->storeDokumenFiles($request, $request->user()->user_id, $calonLama));

        $calon = DataCalonSantri::updateOrCreate(
            ['user_id' => $request->user()->user_id],
            $validated
        );

        return response()->json([
            'status'  => true,
            'message' => $calon->wasRecentlyCreated
                ? 'Data calon santri berhasil disimpan'
                : 'Data calon santri berhasil diperbarui',
            'data'    => $this->withDokumenUrl($calon),
        ], $calon->wasRecentlyCreated ? 201 : 200);
    }

    public function uploadDokumen(Request $request)
    {
        $validated = $request->validate([
            'akta_kelahiran' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'pas_foto'       => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'kartu_keluarga' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'ktp'            => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'ijazah_skl'     => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'ktp_ayah'       => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'ktp_ibu'        => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $calon = DataCalonSantri::where('user_id', $request->user()->user_id)->first();

        if (!$calon) {
            return response()->json([
                'status'  => false,
                'message' => 'Data calon santri tidak ditemukan',
            ], 404);
        }

        if (!$this->hasDokumenFile($request)) {
            return response()->json([
                'status'  => false,
                'message' => 'Minimal satu dokumen harus diupload',
            ], 422);
        }

        $calon->update(array_merge(
            $validated,
            $this->storeDokumenFiles($request, $request->user()->user_id, $calon)
        ));

        return response()->json([
            'status'  => true,
            'message' => 'Dokumen calon santri berhasil diperbarui',
            'data'    => $this->withDokumenUrl($calon->fresh()),
        ]);
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
            'data'   => $this->withDokumenUrl($calon),
        ]);
    }

    private function storeDokumenFiles(Request $request, int $userId, ?DataCalonSantri $calon = null): array
    {
        $paths = [];

        foreach (self::DOKUMEN_FIELDS as $field) {
            if (!$request->hasFile($field)) {
                continue;
            }

            if ($calon && $calon->{$field}) {
                Storage::disk('public')->delete($calon->{$field});
            }

            $paths[$field] = $request->file($field)->store("dokumen-calon-santri/{$userId}", 'public');
        }

        return $paths;
    }

    private function hasDokumenFile(Request $request): bool
    {
        foreach (self::DOKUMEN_FIELDS as $field) {
            if ($request->hasFile($field)) {
                return true;
            }
        }

        return false;
    }

    private function withDokumenUrl(DataCalonSantri $calon): array
    {
        $data = $calon->toArray();
        $data['dokumen_url'] = [];

        foreach (self::DOKUMEN_FIELDS as $field) {
            $data['dokumen_url'][$field] = $calon->{$field}
                ? Storage::url($calon->{$field})
                : null;
        }

        return $data;
    }
}
