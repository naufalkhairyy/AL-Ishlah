<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_ayah_calon_santri', function (Blueprint $table) {
            $table->integer('ayah_id')->autoIncrement();
            $table->integer('calon_santri_id');
            $table->string('nama', 100);
            $table->string('tempat_lahir', 50);
            $table->date('tanggal_lahir');
            $table->string('pekerjaan', 100);
            $table->string('pendidikan', 50);
            $table->decimal('penghasilan', 12, 2);
            $table->text('alamat');
            $table->string('desa', 50);
            $table->string('kecamatan', 50);
            $table->string('kota', 50);
            $table->string('provinsi', 50);
            $table->string('no_hp', 20);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_ayah_calon_santri');
    }
};