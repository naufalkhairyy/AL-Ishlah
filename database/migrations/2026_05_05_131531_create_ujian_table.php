<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ujian', function (Blueprint $table) {
            $table->integer('ujian_id')->autoIncrement();
            $table->string('nama_ujian', 100);
            $table->date('tanggal');
            $table->integer('durasi');
            $table->enum('status', ['aktif', 'nonaktif', 'selesai']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ujian');
    }
};