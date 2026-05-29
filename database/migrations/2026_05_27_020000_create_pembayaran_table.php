<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pembayaran', function (Blueprint $table) {
            $table->integer('pembayaran_id')->autoIncrement();
            $table->integer('user_id');
            $table->integer('santri_id')->nullable();
            $table->string('jenis_pembayaran', 100)->default('pendaftaran');
            $table->decimal('jumlah_bayar', 12, 2)->default(0);
            $table->string('metode_pembayaran', 50)->nullable();
            $table->date('tanggal_bayar')->nullable();
            $table->enum('status', ['pending', 'diterima', 'ditolak'])->default('pending');
            $table->text('catatan')->nullable();
            $table->longText('bukti_bayar')->nullable();
            $table->string('bukti_bayar_nama_file', 255)->nullable();
            $table->string('bukti_bayar_mime_type', 100)->nullable();
            $table->unsignedInteger('bukti_bayar_size')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pembayaran');
    }
};
