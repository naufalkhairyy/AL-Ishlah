<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Pembayaran;
use Illuminate\Http\Request;

class PembayaranController extends Controller
{
    public function index()
    {
        $pembayaran = Pembayaran::with(['user', 'santri'])
            ->latest()
            ->get()
            ->map(fn ($item) => $this->withBuktiBayarUrl($item))
            ->values();

        return response()->json([
            'status' => true,
            'data' => $pembayaran,
        ]);
    }

    public function mine(Request $request)
    {
        $pembayaran = Pembayaran::where('user_id', $request->user()->user_id)
            ->latest()
            ->get()
            ->map(fn ($item) => $this->withBuktiBayarUrl($item))
            ->values();

        return response()->json([
            'status' => true,
            'data' => $pembayaran,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'santri_id' => 'nullable|integer|exists:santri,santri_id',
            'jenis_pembayaran' => 'nullable|string|max:100',
            'jumlah_bayar' => 'required|numeric|min:0',
            'metode_pembayaran' => 'nullable|string|max:50',
            'tanggal_bayar' => 'nullable|date',
            'bukti_bayar' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $validated['user_id'] = $request->user()->user_id;
        $validated['jenis_pembayaran'] = $validated['jenis_pembayaran'] ?? 'pendaftaran';
        $validated['status'] = 'pending';
        $validated = array_merge($validated, $this->storeBuktiBayar($request));

        $pembayaran = Pembayaran::create($validated);

        return response()->json([
            'status' => true,
            'message' => 'Bukti pembayaran berhasil diupload',
            'data' => $this->withBuktiBayarUrl($pembayaran),
        ], 201);
    }

    public function show(Request $request, int $id)
    {
        $pembayaran = Pembayaran::with(['user', 'santri'])->find($id);

        if (!$pembayaran) {
            return response()->json([
                'status' => false,
                'message' => 'Pembayaran tidak ditemukan',
            ], 404);
        }

        if ($request->user()->role !== 'admin' && $pembayaran->user_id !== $request->user()->user_id) {
            return response()->json([
                'status' => false,
                'message' => 'Akses ditolak',
            ], 403);
        }

        return response()->json([
            'status' => true,
            'data' => $this->withBuktiBayarUrl($pembayaran),
        ]);
    }

    public function updateStatus(Request $request, int $id)
    {
        $pembayaran = Pembayaran::find($id);

        if (!$pembayaran) {
            return response()->json([
                'status' => false,
                'message' => 'Pembayaran tidak ditemukan',
            ], 404);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,diterima,ditolak',
            'catatan' => 'nullable|string',
        ]);

        $pembayaran->update($validated);

        return response()->json([
            'status' => true,
            'message' => 'Status pembayaran berhasil diperbarui',
            'data' => $this->withBuktiBayarUrl($pembayaran->fresh()),
        ]);
    }

    public function downloadBuktiBayar(Request $request, int $id)
    {
        $pembayaran = Pembayaran::find($id);

        if (!$pembayaran || $pembayaran->bukti_bayar === null) {
            return response()->json([
                'status' => false,
                'message' => 'Bukti pembayaran tidak ditemukan',
            ], 404);
        }

        if ($request->user()->role !== 'admin' && $pembayaran->user_id !== $request->user()->user_id) {
            return response()->json([
                'status' => false,
                'message' => 'Akses ditolak',
            ], 403);
        }

        $fileName = $pembayaran->bukti_bayar_nama_file ?: 'bukti-bayar.bin';
        $mimeType = $pembayaran->bukti_bayar_mime_type ?: 'application/octet-stream';

        return response($pembayaran->bukti_bayar, 200, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' . addslashes($fileName) . '"',
        ]);
    }

    public function destroy(int $id)
    {
        $pembayaran = Pembayaran::find($id);

        if (!$pembayaran) {
            return response()->json([
                'status' => false,
                'message' => 'Pembayaran tidak ditemukan',
            ], 404);
        }

        $pembayaran->delete();

        return response()->json([
            'status' => true,
            'message' => 'Pembayaran berhasil dihapus',
        ]);
    }

    private function storeBuktiBayar(Request $request): array
    {
        $file = $request->file('bukti_bayar');

        return [
            'bukti_bayar' => file_get_contents($file->getRealPath()),
            'bukti_bayar_nama_file' => $file->getClientOriginalName(),
            'bukti_bayar_mime_type' => $file->getClientMimeType(),
            'bukti_bayar_size' => $file->getSize(),
        ];
    }

    private function withBuktiBayarUrl(Pembayaran $pembayaran): array
    {
        $data = $pembayaran->toArray();
        $data['bukti_bayar_uploaded'] = $pembayaran->bukti_bayar !== null;
        $data['bukti_bayar_url'] = $pembayaran->bukti_bayar !== null
            ? url("/api/pembayaran/{$pembayaran->pembayaran_id}/bukti-bayar")
            : null;

        return $data;
    }
}
