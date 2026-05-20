<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jawaban', function (Blueprint $table) {
            $table->integer('jawaban_id')->autoIncrement();
            $table->integer('soal_id');
            $table->integer('santri_id');
            $table->text('jawaban_text')->nullable();
            $table->string('jawaban_file', 255)->nullable();
            $table->decimal('nilai_jawaban', 5, 2)->nullable();
            $table->timestamps();

            $table->foreign('soal_id')->references('soal_id')->on('soal')->cascadeOnDelete();
            $table->foreign('santri_id')->references('santri_id')->on('santri')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jawaban');
    }
};
