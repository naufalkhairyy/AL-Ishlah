<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pembayaran extends Model
{
    protected $table = 'pembayaran';
    protected $primaryKey = 'pembayaran_id';

    protected $fillable = [
        'user_id',
        'santri_id',
        'jenis_pembayaran',
        'jumlah_bayar',
        'metode_pembayaran',
        'tanggal_bayar',
        'status',
        'catatan',
        'bukti_bayar',
        'bukti_bayar_nama_file',
        'bukti_bayar_mime_type',
        'bukti_bayar_size',
    ];

    protected $hidden = [
        'bukti_bayar',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function santri()
    {
        return $this->belongsTo(Santri::class, 'santri_id', 'santri_id');
    }
}
