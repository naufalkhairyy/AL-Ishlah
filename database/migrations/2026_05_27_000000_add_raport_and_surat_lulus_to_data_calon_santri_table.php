<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('data_calon_santri', function (Blueprint $table) {
            $table->string('raport_semester_4', 255)->nullable()->after('nisn');
            $table->string('surat_pernyataan_lulus', 255)->nullable()->after('ijazah_skl');
        });
    }

    public function down(): void
    {
        Schema::table('data_calon_santri', function (Blueprint $table) {
            $table->dropColumn([
                'raport_semester_4',
                'surat_pernyataan_lulus',
            ]);
        });
    }
};
