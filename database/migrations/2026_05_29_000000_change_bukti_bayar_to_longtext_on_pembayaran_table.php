<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE pembayaran MODIFY bukti_bayar LONGTEXT NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE pembayaran MODIFY bukti_bayar LONGBLOB NULL');
    }
};
