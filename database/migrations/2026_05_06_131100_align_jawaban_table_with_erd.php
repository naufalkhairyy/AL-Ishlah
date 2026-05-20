<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jawaban', function (Blueprint $table) {
            $table->dropColumn('jawaban_file');
            $table->dateTime('waktu_submit')->nullable()->after('nilai_jawaban');
        });
    }

    public function down(): void
    {
        Schema::table('jawaban', function (Blueprint $table) {
            $table->string('jawaban_file', 255)->nullable()->after('jawaban_text');
            $table->dropColumn('waktu_submit');
        });
    }
};
