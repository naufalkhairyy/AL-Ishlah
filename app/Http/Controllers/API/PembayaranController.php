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
            'success' => true,
            'data' => $pembayaran,
        ]);
    }

    public function mine(Request $request)
    {
        $pembayaran = $this->paymentQueryForUser($request->user()->user_id)
            ->get()
            ->map(fn ($item) => $this->withBuktiBayarUrl($item))
            ->values();

        return response()->json([
            'success' => true,
            'data' => $pembayaran,
        ]);
    }

    public function current(Request $request)
    {
        $pembayaran = $this->paymentQueryForUser($request->user()->user_id)->first();

        if (!$pembayaran) {
            return response()->json([
                'success' => false,
                'status' => null,
                'message' => 'Pembayaran tidak ditemukan',
                'data' => null,
            ], 404);
        }

        return $this->paymentResponse($pembayaran);
    }

    public function store(Request $request)
    {
        $rules = [
            'santri_id' => 'nullable|integer|exists:santri,santri_id',
            'jenis_pembayaran' => 'nullable|string|max:100',
            'jumlah_bayar' => 'nullable|numeric|min:0',
            'metode_pembayaran' => 'nullable|string|max:50',
            'tanggal_bayar' => 'nullable|date',
            'bukti_bayar' => $request->hasFile('bukti_bayar')
                ? 'required|file|mimes:jpg,jpeg,png,pdf|max:5120'
                : 'required|string',
        ];

        $validated = $request->validate($rules);

        $validated['user_id'] = $request->user()->user_id;
        $validated['jenis_pembayaran'] = $validated['jenis_pembayaran'] ?? 'pendaftaran';
        $validated = array_merge($validated, $this->normalizeBuktiBayar($request));

        $pembayaran = Pembayaran::where('user_id', $validated['user_id'])
            ->where('jenis_pembayaran', $validated['jenis_pembayaran'])
            ->first();

        if ($pembayaran) {
            $pembayaran->update($validated);
        } else {
            $validated['status'] = 'pending';
            $pembayaran = Pembayaran::create($validated);
        }

        return $this->paymentResponse(
            $pembayaran->fresh(),
            $pembayaran->wasRecentlyCreated
                ? 'Data pembayaran berhasil disimpan'
                : 'Data pembayaran berhasil diperbarui',
            $pembayaran->wasRecentlyCreated ? 201 : 200
        );
    }

    public function show(Request $request, int $id)
    {
        $pembayaran = Pembayaran::with(['user', 'santri'])->find($id);

        if (!$pembayaran) {
            return response()->json([
                'success' => false,
                'status' => null,
                'message' => 'Pembayaran tidak ditemukan',
            ], 404);
        }

        if ($request->user()->role !== 'admin' && $pembayaran->user_id !== $request->user()->user_id) {
            return response()->json([
                'success' => false,
                'status' => null,
                'message' => 'Akses ditolak',
            ], 403);
        }

        return $this->paymentResponse($pembayaran);
    }

    public function updateStatus(Request $request, int $id)
    {
        return $this->review($request, $id);
    }

    public function review(Request $request, int $id)
    {
        $pembayaran = Pembayaran::find($id);

        if (!$pembayaran) {
            return response()->json([
                'success' => false,
                'status' => null,
                'message' => 'Pembayaran tidak ditemukan',
            ], 404);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,approved,rejected,diterima,ditolak',
            'catatan' => 'nullable|string',
            'catatan_review' => 'nullable|string',
        ]);

        $pembayaran->update([
            'status' => $this->normalizeStatus($validated['status']),
            'catatan' => $validated['catatan_review'] ?? $validated['catatan'] ?? null,
        ]);

        return $this->paymentResponse(
            $pembayaran->fresh(),
            'Status pembayaran berhasil diperbarui'
        );
    }

    public function downloadBuktiBayar(Request $request, int $id)
    {
        $pembayaran = Pembayaran::find($id);

        if (!$pembayaran || $pembayaran->bukti_bayar === null) {
            return response()->json([
                'success' => false,
                'status' => null,
                'message' => 'Bukti pembayaran tidak ditemukan',
            ], 404);
        }

        if ($request->user()->role !== 'admin' && $pembayaran->user_id !== $request->user()->user_id) {
            return response()->json([
                'success' => false,
                'status' => null,
                'message' => 'Akses ditolak',
            ], 403);
        }

        $fileName = $pembayaran->bukti_bayar_nama_file ?: 'bukti-bayar.bin';
        $mimeType = $pembayaran->bukti_bayar_mime_type ?: 'application/octet-stream';
        $content = $this->buktiBayarContent($pembayaran->bukti_bayar);

        return response($content, 200, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' . addslashes($fileName) . '"',
        ]);
    }

    public function destroy(int $id)
    {
        $pembayaran = Pembayaran::find($id);

        if (!$pembayaran) {
            return response()->json([
                'success' => false,
                'status' => null,
                'message' => 'Pembayaran tidak ditemukan',
            ], 404);
        }

        $pembayaran->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran berhasil dihapus',
        ]);
    }

    private function withBuktiBayarUrl(Pembayaran $pembayaran): array
    {
        $data = $pembayaran->toArray();
        $data['status'] = $this->normalizeStatus($pembayaran->status);
        $data['catatan_review'] = $pembayaran->catatan;
        $data['bukti_bayar_uploaded'] = $pembayaran->bukti_bayar !== null;
        $data['bukti_bayar_url'] = $pembayaran->bukti_bayar !== null
            ? url("/api/pembayaran/{$pembayaran->pembayaran_id}/bukti-bayar")
            : null;

        return $data;
    }

    private function paymentResponse(Pembayaran $pembayaran, ?string $message = null, int $statusCode = 200)
    {
        $data = $this->withBuktiBayarUrl($pembayaran);
        $response = [
            'success' => true,
            'status' => $data['status'],
            'data' => $data,
        ];

        if ($message !== null) {
            $response['message'] = $message;
        }

        return response()->json($response, $statusCode);
    }

    private function paymentQueryForUser($userId)
    {
        return Pembayaran::where('user_id', $userId)
            ->orderByDesc('updated_at')
            ->orderByDesc('pembayaran_id');
    }

    private function normalizeStatus(string $status): string
    {
        return match ($status) {
            'diterima' => 'approved',
            'ditolak' => 'rejected',
            default => $status,
        };
    }

    private function normalizeBuktiBayar(Request $request): array
    {
        if ($request->hasFile('bukti_bayar')) {
            $file = $request->file('bukti_bayar');
            $mimeType = $file->getClientMimeType();
            $content = base64_encode(file_get_contents($file->getRealPath()));

            return [
                'bukti_bayar' => "data:{$mimeType};base64,{$content}",
                'bukti_bayar_nama_file' => $file->getClientOriginalName(),
                'bukti_bayar_mime_type' => $mimeType,
                'bukti_bayar_size' => $file->getSize(),
            ];
        }

        $buktiBayar = (string) $request->input('bukti_bayar');
        $mimeType = str_starts_with($buktiBayar, 'data:')
            ? strtok(substr($buktiBayar, 5), ';') ?: 'text/plain'
            : 'text/plain';

        return [
            'bukti_bayar' => $buktiBayar,
            'bukti_bayar_mime_type' => $mimeType,
            'bukti_bayar_size' => strlen($buktiBayar),
        ];
    }

    private function buktiBayarContent(string $buktiBayar): string
    {
        if (preg_match('/^data:[^;]+;base64,(.*)$/s', $buktiBayar, $matches)) {
            $decoded = base64_decode($matches[1], true);

            return $decoded !== false ? $decoded : $buktiBayar;
        }

        return $buktiBayar;
    }
}
