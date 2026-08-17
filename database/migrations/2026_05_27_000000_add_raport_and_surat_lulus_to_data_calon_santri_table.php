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
        });
    }

    public function down(): void
    {
        Schema::table('data_calon_santri', function (Blueprint $table) {
            $table->dropColumn([
                'raport_semester_4',
            ]);
        });
    }
};
