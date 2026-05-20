<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ujian extends Model
{
    protected $table = 'ujian';
    protected $primaryKey = 'ujian_id';

    protected $fillable = [
        'nama_ujian',
        'tanggal',
        'durasi',
        'status',
    ];

    public function soal()
    {
        return $this->hasMany(Soal::class, 'ujian_id', 'ujian_id');
    }

    public function jadwalUjian()
    {
        return $this->hasMany(JadwalUjian::class, 'ujian_id', 'ujian_id');
    }
}