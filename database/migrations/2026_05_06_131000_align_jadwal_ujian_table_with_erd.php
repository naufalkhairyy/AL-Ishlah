<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jadwal_ujian', function (Blueprint $table) {
            $table->string('nama_ruangan', 200)->nullable()->after('waktu_selesai');
            $table->text('keterangan')->nullable()->after('nama_ruangan');
            $table->dropColumn('status_hadir');
        });
    }

    public function down(): void
    {
        Schema::table('jadwal_ujian', function (Blueprint $table) {
            $table->enum('status_hadir', ['belum_hadir', 'hadir', 'tidak_hadir'])
                ->default('belum_hadir')
                ->after('waktu_selesai');
            $table->dropColumn(['nama_ruangan', 'keterangan']);
        });
    }
};
