<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE soal MODIFY durasi_pengerjaan INT NOT NULL DEFAULT 0');

        Schema::table('soal', function (Blueprint $table) {
            $table->unsignedInteger('nomor_soal')->nullable()->after('ujian_id');
            $table->text('opsi_a')->nullable()->after('jenis_soal');
            $table->text('opsi_b')->nullable()->after('opsi_a');
            $table->text('opsi_c')->nullable()->after('opsi_b');
            $table->text('opsi_d')->nullable()->after('opsi_c');
            $table->text('opsi_e')->nullable()->after('opsi_d');
            $table->decimal('bobot_nilai', 5, 2)->default(1)->after('jawaban_benar');
        });
    }

    public function down(): void
    {
        Schema::table('soal', function (Blueprint $table) {
            $table->dropColumn([
                'nomor_soal',
                'opsi_a',
                'opsi_b',
                'opsi_c',
                'opsi_d',
                'opsi_e',
                'bobot_nilai',
            ]);
        });

        DB::statement('ALTER TABLE soal MODIFY durasi_pengerjaan INT NOT NULL');
    }
};
