<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('data_calon_santri', function (Blueprint $table) {
            $table->enum('status_dokumen', ['pending', 'diterima', 'ditolak'])
                ->default('pending')
                ->after('nisn');
            $table->text('catatan_dokumen')->nullable()->after('status_dokumen');
        });
    }

    public function down(): void
    {
        Schema::table('data_calon_santri', function (Blueprint $table) {
            $table->dropColumn([
                'status_dokumen',
                'catatan_dokumen',
            ]);
        });
    }
};
