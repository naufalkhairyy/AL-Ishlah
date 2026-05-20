<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('data_calon_santri', function (Blueprint $table) {
        $table->integer('calon_santri_id')->autoIncrement();
        $table->integer('user_id');
        $table->string('nama_lengkap', 100);
        $table->string('nama_panggilan', 100);
        $table->string('tempat_lahir', 50);
        $table->date('tanggal_lahir');
        $table->enum('jenis_kelamin', ['L', 'P']);
        $table->string('golongan_darah', 3);
        $table->integer('jumlah_saudara');
        $table->integer('anak_ke');
        $table->text('alamat');
        $table->string('nisn', 20);
        $table->timestamps();
    });
}
    public function down(): void
    {
        Schema::dropIfExists('data_calon_santri');
    }
};