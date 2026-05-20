<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE jadwal_ujian CHANGE nama_ruangan ruang_ujian VARCHAR(200) NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE jadwal_ujian CHANGE ruang_ujian nama_ruangan VARCHAR(200) NULL');
    }
};
