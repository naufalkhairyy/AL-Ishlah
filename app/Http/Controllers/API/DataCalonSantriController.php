<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\DataCalonSantri;
use App\Models\Santri;
use Illuminate\Http\Request;

class DataCalonSantriController extends Controller
{
    private const DOKUMEN_FIELDS = [
        'raport_semester_4',
        'akta_kelahiran',
        'pas_foto',
        'kartu_keluarga',
        'ktp',
        'ijazah_skl',
        'surat_pernyataan_lulus',
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
            'raport_semester_4' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'akta_kelahiran' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'pas_foto'       => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'kartu_keluarga' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'ktp'            => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'ijazah_skl'     => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'surat_pernyataan_lulus' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'ktp_ayah'       => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'ktp_ibu'        => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $validated = array_merge($validated, $this->storeDokumenFiles($request));
        $validated = array_merge($validated, $this->pendingDokumenStatus($request));

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
            'raport_semester_4' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'akta_kelahiran' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'pas_foto'       => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
            'kartu_keluarga' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'ktp'            => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'ijazah_skl'     => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'surat_pernyataan_lulus' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
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
            $this->storeDokumenFiles($request),
            $this->pendingDokumenStatus($request)
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

    public function updateDokumenStatus(Request $request, int $id)
    {
        $calon = DataCalonSantri::find($id);

        if (!$calon) {
            return response()->json([
                'status'  => false,
                'message' => 'Data calon santri tidak ditemukan',
            ], 404);
        }

        $validated = $request->validate([
            'status_dokumen' => 'required|in:pending,diterima,ditolak',
            'catatan_dokumen' => 'nullable|string',
        ]);

        $calon->update($validated);
        $santri = null;

        if ($validated['status_dokumen'] === 'diterima') {
            $santri = $this->promoteCalonToSantri($calon->fresh());
        }

        return response()->json([
            'status'  => true,
            'message' => $santri
                ? 'Status dokumen calon santri berhasil diperbarui dan santri berhasil dibuat'
                : 'Status dokumen calon santri berhasil diperbarui',
            'data'    => [
                'calon_santri' => $this->withDokumenUrl($calon->fresh()),
                'santri' => $santri,
            ],
        ]);
    }

    public function promoteToSantri(Request $request, int $id)
    {
        $calon = DataCalonSantri::find($id);

        if (!$calon) {
            return response()->json([
                'status'  => false,
                'message' => 'Data calon santri tidak ditemukan',
            ], 404);
        }

        $validated = $request->validate([
            'no_hp' => 'nullable|string|max:30',
            'kelas' => 'nullable|string|max:50',
        ]);

        $santri = $this->promoteCalonToSantri(
            $calon,
            $validated['no_hp'] ?? '-',
            $validated['kelas'] ?? 'Calon Santri'
        );

        return response()->json([
            'status' => true,
            'message' => $santri->wasRecentlyCreated
                ? 'Calon santri berhasil dibuat menjadi santri'
                : 'Data santri berhasil diperbarui dari data calon santri',
            'data' => [
                'calon_santri' => $this->withDokumenUrl($calon),
                'santri' => $santri,
            ],
        ], $santri->wasRecentlyCreated ? 201 : 200);
    }

    public function downloadDokumen(Request $request, string $field)
    {
        $calon = DataCalonSantri::where('user_id', $request->user()->user_id)->first();

        return $this->downloadDokumenFromRecord($calon, $field);
    }

    public function downloadDokumenAdmin(int $id, string $field)
    {
        $calon = DataCalonSantri::find($id);

        return $this->downloadDokumenFromRecord($calon, $field);
    }

    private function storeDokumenFiles(Request $request): array
    {
        $data = [];

        foreach (self::DOKUMEN_FIELDS as $field) {
            if (!$request->hasFile($field)) {
                continue;
            }

            $file = $request->file($field);

            $data[$field] = file_get_contents($file->getRealPath());
            $data["{$field}_nama_file"] = $file->getClientOriginalName();
            $data["{$field}_mime_type"] = $file->getClientMimeType();
            $data["{$field}_size"] = $file->getSize();
        }

        return $data;
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

    private function pendingDokumenStatus(Request $request): array
    {
        if (!$this->hasDokumenFile($request)) {
            return [];
        }

        return [
            'status_dokumen' => 'pending',
            'catatan_dokumen' => null,
        ];
    }

    private function withDokumenUrl(DataCalonSantri $calon): array
    {
        $data = $calon->toArray();
        $data['santri_id'] = Santri::where('user_id', $calon->user_id)->value('santri_id');
        $data['dokumen_url'] = [];
        $data['dokumen_uploaded'] = [];

        foreach (self::DOKUMEN_FIELDS as $field) {
            $data['dokumen_uploaded'][$field] = $calon->{$field} !== null;
            $data['dokumen_url'][$field] = $calon->{$field} !== null
                ? url("/api/calon-santri/dokumen/{$field}")
                : null;
        }

        return $data;
    }

    private function promoteCalonToSantri(DataCalonSantri $calon, string $noHp = '-', string $kelas = 'Calon Santri'): Santri
    {
        return Santri::updateOrCreate(
            ['user_id' => $calon->user_id],
            [
                'nama_lengkap' => $calon->nama_lengkap,
                'tempat_lahir' => $calon->tempat_lahir,
                'tanggal_lahir' => $calon->tanggal_lahir,
                'jenis_kelamin' => $calon->jenis_kelamin,
                'alamat' => $calon->alamat,
                'no_hp' => $noHp,
                'kelas' => $kelas,
            ]
        );
    }

    private function downloadDokumenFromRecord(?DataCalonSantri $calon, string $field)
    {
        if (!in_array($field, self::DOKUMEN_FIELDS, true)) {
            return response()->json([
                'status'  => false,
                'message' => 'Jenis dokumen tidak valid',
            ], 422);
        }

        if (!$calon || $calon->{$field} === null) {
            return response()->json([
                'status'  => false,
                'message' => 'Dokumen tidak ditemukan',
            ], 404);
        }

        $fileName = $calon->{"{$field}_nama_file"} ?: "{$field}.bin";
        $mimeType = $calon->{"{$field}_mime_type"} ?: 'application/octet-stream';

        return response($calon->{$field}, 200, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' . addslashes($fileName) . '"',
        ]);
    }
}
