<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('data_calon_santri', function (Blueprint $table) {
            $table->index('user_id', 'data_calon_santri_user_id_index');
            $table->index(['status_dokumen', 'updated_at'], 'data_calon_santri_status_updated_index');
        });

        Schema::table('santri', function (Blueprint $table) {
            $table->index('user_id', 'santri_user_id_index');
        });

        Schema::table('soal', function (Blueprint $table) {
            $table->index(['ujian_id', 'nomor_soal', 'soal_id'], 'soal_ujian_nomor_soal_index');
        });

        Schema::table('jadwal_ujian', function (Blueprint $table) {
            $table->index(['ujian_id', 'santri_id'], 'jadwal_ujian_ujian_santri_index');
            $table->index(['santri_id', 'tanggal'], 'jadwal_ujian_santri_tanggal_index');
        });
    }

    public function down(): void
    {
        Schema::table('jadwal_ujian', function (Blueprint $table) {
            $table->dropIndex('jadwal_ujian_ujian_santri_index');
            $table->dropIndex('jadwal_ujian_santri_tanggal_index');
        });

        Schema::table('soal', function (Blueprint $table) {
            $table->dropIndex('soal_ujian_nomor_soal_index');
        });

        Schema::table('santri', function (Blueprint $table) {
            $table->dropIndex('santri_user_id_index');
        });

        Schema::table('data_calon_santri', function (Blueprint $table) {
            $table->dropIndex('data_calon_santri_user_id_index');
            $table->dropIndex('data_calon_santri_status_updated_index');
        });
    }
};
