<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('soal', function (Blueprint $table) {
            $table->integer('soal_id')->autoIncrement();
            $table->integer('ujian_id');
            $table->string('judul_soal', 255);
            $table->string('file_soal', 255)->nullable();
            $table->enum('jenis_soal', ['pg', 'essay']);
            $table->integer('durasi_pengerjaan');
            $table->text('jawaban_benar')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('soal');
    }
};