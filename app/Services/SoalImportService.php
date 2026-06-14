<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use SimpleXMLElement;
use ZipArchive;

class SoalImportService
{
    private const REQUIRED_HEADERS = [
        'judul_soal',
    ];

    private const HEADER_ALIASES = [
        'nomor' => 'nomor_soal',
        'nomor soal' => 'nomor_soal',
        'nomor_soal' => 'nomor_soal',
        'no' => 'nomor_soal',
        'no soal' => 'nomor_soal',
        'judul soal' => 'judul_soal',
        'judul_soal' => 'judul_soal',
        'soal' => 'judul_soal',
        'pertanyaan' => 'judul_soal',
        'file soal' => 'file_soal',
        'file_soal' => 'file_soal',
        'jenis soal' => 'jenis_soal',
        'jenis_soal' => 'jenis_soal',
        'jenis' => 'jenis_soal',
        'opsi a' => 'opsi_a',
        'opsi_a' => 'opsi_a',
        'pilihan a' => 'opsi_a',
        'a' => 'opsi_a',
        'opsi b' => 'opsi_b',
        'opsi_b' => 'opsi_b',
        'pilihan b' => 'opsi_b',
        'b' => 'opsi_b',
        'opsi c' => 'opsi_c',
        'opsi_c' => 'opsi_c',
        'pilihan c' => 'opsi_c',
        'c' => 'opsi_c',
        'opsi d' => 'opsi_d',
        'opsi_d' => 'opsi_d',
        'pilihan d' => 'opsi_d',
        'd' => 'opsi_d',
        'opsi e' => 'opsi_e',
        'opsi_e' => 'opsi_e',
        'pilihan e' => 'opsi_e',
        'e' => 'opsi_e',
        'durasi pengerjaan' => 'durasi_pengerjaan',
        'durasi_pengerjaan' => 'durasi_pengerjaan',
        'durasi' => 'durasi_pengerjaan',
        'jawaban benar' => 'jawaban_benar',
        'jawaban_benar' => 'jawaban_benar',
        'jawaban' => 'jawaban_benar',
        'kunci jawaban' => 'jawaban_benar',
        'kunci' => 'jawaban_benar',
        'bobot nilai' => 'bobot_nilai',
        'bobot_nilai' => 'bobot_nilai',
        'bobot' => 'bobot_nilai',
        'nilai' => 'bobot_nilai',
    ];

    public function parse(UploadedFile $file, int $ujianId): array
    {
        $extension = strtolower($file->getClientOriginalExtension());

        $rows = match ($extension) {
            'csv', 'txt' => $this->parseCsv($file->getRealPath()),
            'xlsx' => $this->parseXlsx($file->getRealPath()),
            default => throw ValidationException::withMessages([
                'file' => 'Format file harus .xlsx atau .csv.',
            ]),
        };

        return $this->mapRows($rows, $ujianId);
    }

    private function parseCsv(string $path): array
    {
        $handle = fopen($path, 'rb');

        if (!$handle) {
            throw new RuntimeException('File CSV tidak bisa dibaca.');
        }

        $rows = [];

        while (($row = fgetcsv($handle, 0, ',')) !== false) {
            if (count($row) === 1 && str_contains((string) $row[0], ';')) {
                $row = str_getcsv((string) $row[0], ';');
            }

            $rows[] = $row;
        }

        fclose($handle);

        return $rows;
    }

    private function parseXlsx(string $path): array
    {
        if (!class_exists(ZipArchive::class)) {
            throw new RuntimeException('Ekstensi PHP zip diperlukan untuk membaca file .xlsx.');
        }

        $zip = new ZipArchive();

        if ($zip->open($path) !== true) {
            throw new RuntimeException('File .xlsx tidak bisa dibuka.');
        }

        $sharedStrings = $this->readSharedStrings($zip);
        $worksheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();

        if ($worksheetXml === false) {
            throw new RuntimeException('Sheet pertama file .xlsx tidak ditemukan.');
        }

        $worksheet = new SimpleXMLElement($worksheetXml);
        $rows = [];

        foreach ($worksheet->sheetData->row as $xmlRow) {
            $row = [];

            foreach ($xmlRow->c as $cell) {
                $attributes = $cell->attributes();
                $cellReference = (string) ($attributes['r'] ?? '');
                $columnIndex = $this->columnIndexFromReference($cellReference);

                if ($columnIndex === null) {
                    $columnIndex = count($row);
                }

                $row[$columnIndex] = $this->readCellValue($cell, $sharedStrings);
            }

            if ($row !== []) {
                ksort($row);
                $rows[] = $row;
            }
        }

        return $rows;
    }

    private function readSharedStrings(ZipArchive $zip): array
    {
        $xml = $zip->getFromName('xl/sharedStrings.xml');

        if ($xml === false) {
            return [];
        }

        $sharedStrings = [];
        $data = new SimpleXMLElement($xml);

        foreach ($data->si as $item) {
            $text = '';

            if (isset($item->t)) {
                $text = (string) $item->t;
            } elseif (isset($item->r)) {
                foreach ($item->r as $run) {
                    $text .= (string) $run->t;
                }
            }

            $sharedStrings[] = $text;
        }

        return $sharedStrings;
    }

    private function readCellValue(SimpleXMLElement $cell, array $sharedStrings): string
    {
        $attributes = $cell->attributes();
        $type = (string) ($attributes['t'] ?? '');

        if ($type === 'inlineStr') {
            return trim((string) ($cell->is->t ?? ''));
        }

        $value = trim((string) ($cell->v ?? ''));

        if ($type === 's') {
            return trim($sharedStrings[(int) $value] ?? '');
        }

        return $value;
    }

    private function columnIndexFromReference(string $reference): ?int
    {
        if (!preg_match('/^([A-Z]+)/i', $reference, $matches)) {
            return null;
        }

        $letters = strtoupper($matches[1]);
        $index = 0;

        for ($i = 0; $i < strlen($letters); $i++) {
            $index = ($index * 26) + (ord($letters[$i]) - 64);
        }

        return $index - 1;
    }

    private function mapRows(array $rows, int $ujianId): array
    {
        $rows = array_values(array_filter($rows, fn ($row) => $this->hasFilledCell($row)));

        if ($rows === []) {
            throw ValidationException::withMessages([
                'file' => 'File import tidak memiliki data.',
            ]);
        }

        $headers = $this->normalizeHeaders(array_shift($rows));
        $missingHeaders = array_values(array_diff(self::REQUIRED_HEADERS, $headers));

        if ($missingHeaders !== []) {
            throw ValidationException::withMessages([
                'file' => 'Header wajib belum ada: ' . implode(', ', $missingHeaders) . '.',
            ]);
        }

        $mappedRows = [];
        $errors = [];

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;
            $item = ['ujian_id' => $ujianId];

            foreach ($headers as $column => $field) {
                if ($field === null) {
                    continue;
                }

                $item[$field] = trim((string) ($row[$column] ?? ''));
            }

            if (!$this->hasFilledCell($item)) {
                continue;
            }

            $item['jenis_soal'] = 'pg';

            $validator = Validator::make($item, [
                'ujian_id' => 'required|integer',
                'nomor_soal' => 'nullable|integer|min:1',
                'judul_soal' => 'required|string|max:255',
                'file_soal' => 'nullable|string|max:255',
                'jenis_soal' => 'required|in:pg',
                'opsi_a' => 'nullable|string',
                'opsi_b' => 'nullable|string',
                'opsi_c' => 'nullable|string',
                'opsi_d' => 'nullable|string',
                'opsi_e' => 'nullable|string',
                'durasi_pengerjaan' => 'nullable|integer|min:0',
                'jawaban_benar' => 'nullable|string',
                'bobot_nilai' => 'nullable|numeric|min:0|max:100',
            ]);

            if ($validator->fails()) {
                $errors[$rowNumber] = $validator->errors()->all();
                continue;
            }

            $validated = $validator->validated();
            $validated = $this->nullifyEmptyOptionalFields($validated);
            $validated['jenis_soal'] = 'pg';
            $validated['durasi_pengerjaan'] = $validated['durasi_pengerjaan'] ?? 0;
            $validated['bobot_nilai'] = $validated['bobot_nilai'] ?? 1;
            $validated['jawaban_benar'] = $this->normalizeAnswerKey($validated['jawaban_benar'] ?? null);

            $mappedRows[] = $validated;
        }

        if ($errors !== []) {
            throw ValidationException::withMessages([
                'rows' => $errors,
            ]);
        }

        if ($mappedRows === []) {
            throw ValidationException::withMessages([
                'file' => 'File import tidak memiliki baris soal yang valid.',
            ]);
        }

        return $mappedRows;
    }

    private function normalizeHeaders(array $headers): array
    {
        return array_map(function ($header) {
            $key = strtolower(trim((string) $header));
            $key = preg_replace('/\s+/', ' ', $key);

            return self::HEADER_ALIASES[$key] ?? null;
        }, $headers);
    }

    private function hasFilledCell(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return true;
            }
        }

        return false;
    }

    private function normalizeAnswerKey(?string $answer): ?string
    {
        $answer = trim((string) $answer);

        if ($answer === '') {
            return null;
        }

        return strlen($answer) === 1 ? strtoupper($answer) : $answer;
    }

    private function nullifyEmptyOptionalFields(array $row): array
    {
        foreach ([
            'nomor_soal',
            'file_soal',
            'opsi_a',
            'opsi_b',
            'opsi_c',
            'opsi_d',
            'opsi_e',
            'durasi_pengerjaan',
            'jawaban_benar',
            'bobot_nilai',
        ] as $field) {
            if (array_key_exists($field, $row) && trim((string) $row[$field]) === '') {
                $row[$field] = null;
            }
        }

        return $row;
    }
}
