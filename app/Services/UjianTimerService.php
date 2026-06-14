<?php

namespace App\Services;

use App\Models\Jawaban;
use App\Models\JadwalUjian;
use App\Models\Soal;
use App\Models\Ujian;
use Carbon\Carbon;

class UjianTimerService
{
    public const DEFAULT_DURATION_MINUTES = 90;

    public function status(Ujian $ujian, int $santriId): ?array
    {
        $jadwal = JadwalUjian::where('ujian_id', $ujian->ujian_id)
            ->where('santri_id', $santriId)
            ->first();

        if (!$jadwal) {
            return null;
        }

        $timezone = config('app.timezone', 'Asia/Jakarta');
        $durationMinutes = (int) ($ujian->durasi ?: self::DEFAULT_DURATION_MINUTES);
        $startedAt = Carbon::parse($jadwal->tanggal . ' ' . $jadwal->waktu_mulai, $timezone);
        $endedAt = $startedAt->copy()->addMinutes($durationMinutes);
        $serverTime = now($timezone);
        $isInScheduleWindow = $serverTime->greaterThanOrEqualTo($startedAt)
            && $serverTime->lessThan($endedAt);
        $isSubmitted = $this->isSubmitted($ujian, $santriId);
        $isFinished = $serverTime->greaterThanOrEqualTo($endedAt) || $isSubmitted;
        $remainingSeconds = $isInScheduleWindow && !$isFinished
            ? max(0, $serverTime->diffInSeconds($endedAt, false))
            : 0;

        return [
            'jadwal_id' => $jadwal->jadwal_id,
            'ujian_id' => $ujian->ujian_id,
            'santri_id' => $santriId,
            'durasi_menit' => $durationMinutes,
            'server_time' => $serverTime->format('Y-m-d H:i:s'),
            'waktu_mulai' => $startedAt->format('Y-m-d H:i:s'),
            'waktu_selesai' => $endedAt->format('Y-m-d H:i:s'),
            'sisa_detik' => $remainingSeconds,
            'detik_menuju_mulai' => max(0, $serverTime->diffInSeconds($startedAt, false)),
            'sudah_mulai' => $isInScheduleWindow,
            'sudah_selesai' => $isFinished,
            'sudah_submit' => $isSubmitted,
        ];
    }

    public function isExpired(Ujian $ujian, int $santriId): bool
    {
        $status = $this->status($ujian, $santriId);

        return $status !== null && $status['sudah_selesai'];
    }

    public function submissionError(Ujian $ujian, int $santriId): ?string
    {
        $status = $this->status($ujian, $santriId);

        if ($status === null) {
            return 'Jadwal ujian untuk santri ini tidak ditemukan.';
        }

        if ($status['sudah_selesai']) {
            return 'Waktu pengerjaan ujian sudah habis.';
        }

        if (!$status['sudah_mulai']) {
            return 'Ujian belum dimulai.';
        }

        return null;
    }

    private function isSubmitted(Ujian $ujian, int $santriId): bool
    {
        $soalIds = Soal::where('ujian_id', $ujian->ujian_id)->pluck('soal_id');

        if ($soalIds->isEmpty()) {
            return false;
        }

        $finalAnswerCount = Jawaban::where('santri_id', $santriId)
            ->whereIn('soal_id', $soalIds)
            ->where('is_final', true)
            ->distinct('soal_id')
            ->count('soal_id');

        return $finalAnswerCount >= $soalIds->count();
    }
}
