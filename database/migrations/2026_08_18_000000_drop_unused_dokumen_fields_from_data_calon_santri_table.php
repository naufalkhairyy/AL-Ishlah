<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const UNUSED_DOKUMEN_FIELDS = [
        'ktp',
        'ijazah_skl',
        'surat_pernyataan_lulus',
        'ktp_ibu',
    ];

    public function up(): void
    {
        Schema::table('data_calon_santri', function (Blueprint $table) {
            $columns = [];

            foreach (self::UNUSED_DOKUMEN_FIELDS as $field) {
                foreach ([$field, "{$field}_nama_file", "{$field}_mime_type", "{$field}_size"] as $column) {
                    if (Schema::hasColumn('data_calon_santri', $column)) {
                        $columns[] = $column;
                    }
                }
            }

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }

    public function down(): void
    {
        Schema::table('data_calon_santri', function (Blueprint $table) {
            foreach (self::UNUSED_DOKUMEN_FIELDS as $field) {
                if (!Schema::hasColumn('data_calon_santri', $field)) {
                    $table->longBlob($field)->nullable();
                }

                if (!Schema::hasColumn('data_calon_santri', "{$field}_nama_file")) {
                    $table->string("{$field}_nama_file", 255)->nullable();
                }

                if (!Schema::hasColumn('data_calon_santri', "{$field}_mime_type")) {
                    $table->string("{$field}_mime_type", 100)->nullable();
                }

                if (!Schema::hasColumn('data_calon_santri', "{$field}_size")) {
                    $table->unsignedInteger("{$field}_size")->nullable();
                }
            }
        });
    }
};
