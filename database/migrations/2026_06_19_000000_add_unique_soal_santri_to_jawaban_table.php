<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jawaban', function (Blueprint $table) {
            $table->unique(['soal_id', 'santri_id'], 'jawaban_soal_santri_unique');
        });
    }

    public function down(): void
    {
        Schema::table('jawaban', function (Blueprint $table) {
            $table->dropUnique('jawaban_soal_santri_unique');
        });
    }
};
