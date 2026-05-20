<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JadwalUjian extends Model
{
    use HasFactory;

    protected $table = 'jadwal_ujian';
    protected $primaryKey = 'jadwal_id';

    protected $fillable = [
        'ujian_id',
        'santri_id',
        'tanggal',
        'waktu_mulai',
        'waktu_selesai',
        'ruang_ujian',
        'keterangan',
    ];

    public function ujian()
    {
        return $this->belongsTo(Ujian::class, 'ujian_id', 'ujian_id');
    }

    public function santri()
    {
        return $this->belongsTo(Santri::class, 'santri_id', 'santri_id');
    }
}
