<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\DataCalonSantri;
use App\Models\Pembayaran;
use App\Models\Santri;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DataCalonSantriController extends Controller
{
    private const DOKUMEN_FIELDS = [
        'raport_semester_4' => 'raport_semester_4',
        'akta_kelahiran' => 'akta_kelahiran',
        'pas_foto' => 'pas_foto',
        'kartu_keluarga' => 'kartu_keluarga',
        'ktp_orang_tua' => 'ktp_ayah',
    ];

    private const REQUIRED_DOKUMEN_FIELDS = [
        'raport_semester_4',
        'akta_kelahiran',
        'pas_foto',
        'kartu_keluarga',
        'ktp_orang_tua',
    ];

    private const DOKUMEN_ALIASES = [
        'ktp_ayah' => 'ktp_orang_tua',
    ];

    private const RESPONSE_FIELDS = [
        'calon_santri_id',
        'user_id',
        'nama_lengkap',
        'nama_panggilan',
        'tempat_lahir',
        'tanggal_lahir',
        'jenis_kelamin',
        'golongan_darah',
        'jumlah_saudara',
        'anak_ke',
        'alamat',
        'nisn',
        'status_dokumen',
        'catatan_dokumen',
        'dokumen_status',
        'dokumen_catatan',
        'created_at',
        'updated_at',
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
            'ktp_orang_tua'  => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        unset($validated['ktp_orang_tua']);

        $validated = array_merge($validated, $this->storeDokumenFiles($request));
        $validated = array_merge($validated, $this->pendingDokumenStatus($request));
        $validated = array_merge($validated, $this->pendingDokumenReview($request));

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
            'ktp_orang_tua'  => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        unset($validated['ktp_orang_tua']);

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
            $this->pendingDokumenStatus($request),
            $this->pendingDokumenReview($request, $calon)
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
        if ($request->user()->role === 'admin') {
            return $this->dokumenList();
        }

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
            $this->linkApprovedPaymentsToSantri($calon->user_id, $santri);
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

    public function updateDokumenFieldStatus(Request $request, int $id, string $field)
    {
        $calon = DataCalonSantri::find($id);

        if (!$calon) {
            return response()->json([
                'status'  => false,
                'message' => 'Data calon santri tidak ditemukan',
            ], 404);
        }

        $publicField = self::DOKUMEN_ALIASES[$field] ?? $field;
        $storageField = self::DOKUMEN_FIELDS[$publicField] ?? null;

        if ($storageField === null) {
            return response()->json([
                'status'  => false,
                'message' => 'Jenis dokumen tidak valid',
            ], 422);
        }

        if (!$this->isDokumenUploaded($calon, $publicField, $storageField)) {
            return response()->json([
                'status'  => false,
                'message' => 'Dokumen belum diupload',
            ], 422);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,diterima,ditolak',
            'catatan' => 'nullable|string',
        ]);

        $dokumenStatus = $this->normalizedDokumenStatus($calon);
        $dokumenCatatan = $this->normalizedDokumenCatatan($calon);

        $dokumenStatus[$publicField] = $validated['status'];
        $dokumenCatatan[$publicField] = $validated['catatan'] ?? null;

        $calon->update([
            'dokumen_status' => $dokumenStatus,
            'dokumen_catatan' => $dokumenCatatan,
            'status_dokumen' => $this->resolveGlobalDokumenStatus($calon, $dokumenStatus),
            'catatan_dokumen' => $this->resolveGlobalDokumenCatatan($dokumenCatatan),
        ]);

        $freshCalon = $calon->fresh();

        if ($freshCalon->status_dokumen === 'diterima') {
            $santri = $this->promoteCalonToSantri($freshCalon);
            $this->linkApprovedPaymentsToSantri($freshCalon->user_id, $santri);
        }

        $santriIds = Santri::where('user_id', $freshCalon->user_id)
            ->pluck('santri_id', 'user_id');

        return response()->json([
            'status' => true,
            'message' => 'Status dokumen berhasil diperbarui',
            'data' => $this->withDokumenListData($freshCalon, $santriIds),
        ]);
    }

    public function dokumenList()
    {
        $query = DataCalonSantri::query()
            ->select($this->dokumenListColumns())
            ->where(function ($query) {
                foreach (self::DOKUMEN_FIELDS as $storageField) {
                    $query->orWhereRaw("{$storageField} is not null and length({$storageField}) > 0");
                }
            })
            ->orderByDesc('updated_at')
            ->orderByDesc('calon_santri_id');

        foreach (self::DOKUMEN_FIELDS as $publicField => $storageField) {
            $query->addSelect(DB::raw(
                "({$storageField} is not null and length({$storageField}) > 0) as {$publicField}_uploaded"
            ));
        }

        $calonSantri = $query->get();
        $santriIds = Santri::whereIn('user_id', $calonSantri->pluck('user_id'))
            ->pluck('santri_id', 'user_id');

        return response()->json([
            'status' => true,
            'data' => $calonSantri
                ->map(fn ($calon) => $this->withDokumenListData($calon, $santriIds))
                ->values(),
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
        $this->linkApprovedPaymentsToSantri($calon->user_id, $santri);

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

        foreach (self::DOKUMEN_FIELDS as $publicField => $storageField) {
            if (!$request->hasFile($publicField)) {
                continue;
            }

            $file = $request->file($publicField);

            $data[$storageField] = file_get_contents($file->getRealPath());
            $data["{$storageField}_nama_file"] = $file->getClientOriginalName();
            $data["{$storageField}_mime_type"] = $file->getClientMimeType();
            $data["{$storageField}_size"] = $file->getSize();
        }

        return $data;
    }

    private function hasDokumenFile(Request $request): bool
    {
        foreach (array_keys(self::DOKUMEN_FIELDS) as $field) {
            if ($request->hasFile($field)) {
                return true;
            }
        }

        return false;
    }

    private function hasRequiredDokumenFile(Request $request): bool
    {
        foreach (self::REQUIRED_DOKUMEN_FIELDS as $field) {
            if ($request->hasFile($field)) {
                return true;
            }
        }

        return false;
    }

    private function pendingDokumenStatus(Request $request): array
    {
        if (!$this->hasRequiredDokumenFile($request)) {
            return [];
        }

        return [
            'status_dokumen' => 'pending',
            'catatan_dokumen' => null,
        ];
    }

    private function withDokumenUrl(DataCalonSantri $calon): array
    {
        $data = [];

        foreach (self::RESPONSE_FIELDS as $field) {
            $data[$field] = $calon->{$field};
        }

        $data['santri_id'] = Santri::where('user_id', $calon->user_id)->value('santri_id');
        $data['dokumen_url'] = [];
        $data['dokumen_uploaded'] = [];

        foreach (self::DOKUMEN_FIELDS as $publicField => $storageField) {
            $uploaded = $this->isDokumenUploaded($calon, $publicField, $storageField);

            $data["{$publicField}_nama_file"] = $calon->{"{$storageField}_nama_file"};
            $data["{$publicField}_mime_type"] = $calon->{"{$storageField}_mime_type"};
            $data["{$publicField}_size"] = $calon->{"{$storageField}_size"};
            $data['dokumen_uploaded'][$publicField] = $uploaded;
            $data['dokumen_url'][$publicField] = $uploaded
                ? url("/api/calon-santri/dokumen/{$publicField}")
                : null;

            if ($publicField !== $storageField) {
                unset(
                    $data["{$storageField}_nama_file"],
                    $data["{$storageField}_mime_type"],
                    $data["{$storageField}_size"]
                );
            }
        }

        return $data;
    }

    private function dokumenListColumns(): array
    {
        $columns = [
            'calon_santri_id',
            'user_id',
            'nama_lengkap',
            'status_dokumen',
            'catatan_dokumen',
            'dokumen_status',
            'dokumen_catatan',
            'updated_at',
        ];

        foreach (self::DOKUMEN_FIELDS as $storageField) {
            $columns[] = "{$storageField}_nama_file";
            $columns[] = "{$storageField}_mime_type";
            $columns[] = "{$storageField}_size";
        }

        return $columns;
    }

    private function withDokumenListData(DataCalonSantri $calon, $santriIds): array
    {
        $data = [
            'calon_santri_id' => $calon->calon_santri_id,
            'user_id' => $calon->user_id,
            'santri_id' => $santriIds[$calon->user_id] ?? null,
            'nama_lengkap' => $calon->nama_lengkap,
            'status_dokumen' => $calon->status_dokumen,
            'catatan_dokumen' => $calon->catatan_dokumen,
            'dokumen_uploaded' => [],
            'dokumen_url' => [],
            'dokumen_status' => [],
            'dokumen_catatan' => [],
            'updated_at' => optional($calon->updated_at)->toISOString(),
        ];

        $dokumenStatus = $this->normalizedDokumenStatus($calon);
        $dokumenCatatan = $this->normalizedDokumenCatatan($calon);

        foreach (self::DOKUMEN_FIELDS as $publicField => $storageField) {
            $uploaded = $this->isDokumenUploaded($calon, $publicField, $storageField);

            $data["{$publicField}_nama_file"] = $calon->{"{$storageField}_nama_file"};
            $data["{$publicField}_mime_type"] = $calon->{"{$storageField}_mime_type"};
            $data["{$publicField}_size"] = $calon->{"{$storageField}_size"};
            $data['dokumen_uploaded'][$publicField] = $uploaded;

            if ($uploaded) {
                $data['dokumen_url'][$publicField] = url(
                    "/api/calon-santri/{$calon->calon_santri_id}/dokumen/{$publicField}"
                );
                $data['dokumen_status'][$publicField] = $dokumenStatus[$publicField];
                $data['dokumen_catatan'][$publicField] = $dokumenCatatan[$publicField];
            }
        }

        return $data;
    }

    private function pendingDokumenReview(Request $request, ?DataCalonSantri $calon = null): array
    {
        if (!$this->hasDokumenFile($request)) {
            return [];
        }

        $dokumenStatus = $calon ? $this->normalizedDokumenStatus($calon) : [];
        $dokumenCatatan = $calon ? $this->normalizedDokumenCatatan($calon) : [];

        foreach (self::DOKUMEN_FIELDS as $publicField => $storageField) {
            if (!$request->hasFile($publicField)) {
                continue;
            }

            $dokumenStatus[$publicField] = 'pending';
            $dokumenCatatan[$publicField] = null;
        }

        return [
            'dokumen_status' => $dokumenStatus,
            'dokumen_catatan' => $dokumenCatatan,
        ];
    }

    private function normalizedDokumenStatus(DataCalonSantri $calon): array
    {
        $statuses = is_array($calon->dokumen_status) ? $calon->dokumen_status : [];

        foreach (self::DOKUMEN_FIELDS as $publicField => $storageField) {
            if (!$this->isDokumenUploaded($calon, $publicField, $storageField)) {
                unset($statuses[$publicField]);
                continue;
            }

            if (!in_array($statuses[$publicField] ?? null, ['pending', 'diterima', 'ditolak'], true)) {
                $statuses[$publicField] = 'pending';
            }
        }

        return $statuses;
    }

    private function normalizedDokumenCatatan(DataCalonSantri $calon): array
    {
        $notes = is_array($calon->dokumen_catatan) ? $calon->dokumen_catatan : [];

        foreach (self::DOKUMEN_FIELDS as $publicField => $storageField) {
            if (!$this->isDokumenUploaded($calon, $publicField, $storageField)) {
                unset($notes[$publicField]);
                continue;
            }

            $notes[$publicField] = $notes[$publicField] ?? null;
        }

        return $notes;
    }

    private function resolveGlobalDokumenStatus(DataCalonSantri $calon, array $dokumenStatus): string
    {
        foreach (self::REQUIRED_DOKUMEN_FIELDS as $publicField) {
            $storageField = self::DOKUMEN_FIELDS[$publicField];

            if (!$this->isDokumenUploaded($calon, $publicField, $storageField)
                || ($dokumenStatus[$publicField] ?? 'pending') === 'pending') {
                return 'pending';
            }
        }

        foreach (self::REQUIRED_DOKUMEN_FIELDS as $publicField) {
            if (($dokumenStatus[$publicField] ?? 'pending') === 'ditolak') {
                return 'ditolak';
            }
        }

        return 'diterima';
    }

    private function resolveGlobalDokumenCatatan(array $dokumenCatatan): ?string
    {
        $notes = array_filter($dokumenCatatan, fn ($note) => is_string($note) && trim($note) !== '');

        return $notes === [] ? null : implode("\n", $notes);
    }

    private function isDokumenUploaded(DataCalonSantri $calon, string $publicField, string $storageField): bool
    {
        $attributes = $calon->getAttributes();

        if (array_key_exists("{$publicField}_uploaded", $attributes)) {
            return (bool) $attributes["{$publicField}_uploaded"];
        }

        return $calon->{$storageField} !== null && $calon->{$storageField} !== '';
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

    private function linkApprovedPaymentsToSantri(int $userId, Santri $santri): void
    {
        Pembayaran::where('user_id', $userId)
            ->whereIn('status', ['approved', 'diterima'])
            ->where(function ($query) use ($santri) {
                $query->whereNull('santri_id')
                    ->orWhere('santri_id', '!=', $santri->santri_id);
            })
            ->update([
                'santri_id' => $santri->santri_id,
            ]);
    }

    private function downloadDokumenFromRecord(?DataCalonSantri $calon, string $field)
    {
        $publicField = self::DOKUMEN_ALIASES[$field] ?? $field;
        $storageField = self::DOKUMEN_FIELDS[$publicField] ?? null;

        if ($storageField === null) {
            return response()->json([
                'status'  => false,
                'message' => 'Jenis dokumen tidak valid',
            ], 422);
        }

        if (!$calon || !$this->isDokumenUploaded($calon, $publicField, $storageField)) {
            return response()->json([
                'status'  => false,
                'message' => 'Dokumen tidak ditemukan',
            ], 404);
        }

        $fileName = $calon->{"{$storageField}_nama_file"} ?: "{$publicField}.bin";
        $mimeType = $calon->{"{$storageField}_mime_type"} ?: 'application/octet-stream';

        return response($calon->{$storageField}, 200, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' . addslashes($fileName) . '"',
        ]);
    }
}
