<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_sekolah_asal_calon_santri', function (Blueprint $table) {
            $table->integer('sekolah_id')->autoIncrement();
            $table->integer('calon_santri_id');
            $table->string('nama_sekolah', 100);
            $table->text('alamat_sekolah');
            $table->string('kota', 50);
            $table->string('provinsi', 50);
            $table->year('tahun_lulus');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_sekolah_asal_calon_santri');
    }
};