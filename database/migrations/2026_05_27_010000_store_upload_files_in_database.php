<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
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

    public function up(): void
    {
        foreach (self::DOKUMEN_FIELDS as $field) {
            DB::statement("ALTER TABLE data_calon_santri MODIFY {$field} LONGBLOB NULL");
        }

        Schema::table('data_calon_santri', function (Blueprint $table) {
            foreach (self::DOKUMEN_FIELDS as $field) {
                $table->string("{$field}_nama_file", 255)->nullable()->after($field);
                $table->string("{$field}_mime_type", 100)->nullable()->after("{$field}_nama_file");
                $table->unsignedInteger("{$field}_size")->nullable()->after("{$field}_mime_type");
            }
        });

        DB::statement('ALTER TABLE soal MODIFY file_soal LONGBLOB NULL');

        Schema::table('soal', function (Blueprint $table) {
            $table->string('file_soal_nama_file', 255)->nullable()->after('file_soal');
            $table->string('file_soal_mime_type', 100)->nullable()->after('file_soal_nama_file');
            $table->unsignedInteger('file_soal_size')->nullable()->after('file_soal_mime_type');
        });
    }

    public function down(): void
    {
        Schema::table('soal', function (Blueprint $table) {
            $table->dropColumn([
                'file_soal_nama_file',
                'file_soal_mime_type',
                'file_soal_size',
            ]);
        });

        DB::statement('ALTER TABLE soal MODIFY file_soal VARCHAR(255) NULL');

        Schema::table('data_calon_santri', function (Blueprint $table) {
            $columns = [];

            foreach (self::DOKUMEN_FIELDS as $field) {
                $columns[] = "{$field}_nama_file";
                $columns[] = "{$field}_mime_type";
                $columns[] = "{$field}_size";
            }

            $table->dropColumn($columns);
        });

        foreach (self::DOKUMEN_FIELDS as $field) {
            DB::statement("ALTER TABLE data_calon_santri MODIFY {$field} VARCHAR(255) NULL");
        }
    }
};
