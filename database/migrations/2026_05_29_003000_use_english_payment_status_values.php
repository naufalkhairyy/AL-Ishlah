<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE pembayaran MODIFY status VARCHAR(20) NOT NULL DEFAULT 'pending'");
        DB::table('pembayaran')->where('status', 'diterima')->update(['status' => 'approved']);
        DB::table('pembayaran')->where('status', 'ditolak')->update(['status' => 'rejected']);
        DB::statement("ALTER TABLE pembayaran MODIFY status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE pembayaran MODIFY status VARCHAR(20) NOT NULL DEFAULT 'pending'");
        DB::table('pembayaran')->where('status', 'approved')->update(['status' => 'diterima']);
        DB::table('pembayaran')->where('status', 'rejected')->update(['status' => 'ditolak']);
        DB::statement("ALTER TABLE pembayaran MODIFY status ENUM('pending', 'diterima', 'ditolak') NOT NULL DEFAULT 'pending'");
    }
};
