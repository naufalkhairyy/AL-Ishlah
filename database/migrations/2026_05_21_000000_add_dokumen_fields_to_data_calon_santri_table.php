<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('data_calon_santri', function (Blueprint $table) {
            $table->string('akta_kelahiran', 255)->nullable()->after('nisn');
            $table->string('pas_foto', 255)->nullable()->after('akta_kelahiran');
            $table->string('kartu_keluarga', 255)->nullable()->after('pas_foto');
            $table->string('ktp', 255)->nullable()->after('kartu_keluarga');
            $table->string('ijazah_skl', 255)->nullable()->after('ktp');
            $table->string('ktp_ayah', 255)->nullable()->after('ijazah_skl');
            $table->string('ktp_ibu', 255)->nullable()->after('ktp_ayah');
        });
    }

    public function down(): void
    {
        Schema::table('data_calon_santri', function (Blueprint $table) {
            $table->dropColumn([
                'akta_kelahiran',
                'pas_foto',
                'kartu_keluarga',
                'ktp',
                'ijazah_skl',
                'ktp_ayah',
                'ktp_ibu',
            ]);
        });
    }
};
