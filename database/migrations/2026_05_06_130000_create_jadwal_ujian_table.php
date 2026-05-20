<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jadwal_ujian', function (Blueprint $table) {
            $table->integer('jadwal_id')->autoIncrement();
            $table->integer('ujian_id');
            $table->integer('santri_id');
            $table->date('tanggal');
            $table->time('waktu_mulai');
            $table->time('waktu_selesai');
            $table->enum('status_hadir', ['belum_hadir', 'hadir', 'tidak_hadir'])->default('belum_hadir');
            $table->timestamps();

            $table->foreign('ujian_id')->references('ujian_id')->on('ujian')->cascadeOnDelete();
            $table->foreign('santri_id')->references('santri_id')->on('santri')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jadwal_ujian');
    }
};
