<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE pembayaran MODIFY jumlah_bayar DECIMAL(12, 2) NOT NULL DEFAULT 0');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE pembayaran MODIFY jumlah_bayar DECIMAL(12, 2) NOT NULL');
    }
};
