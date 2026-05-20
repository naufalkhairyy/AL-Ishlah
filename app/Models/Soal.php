<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Soal extends Model
{
    use HasFactory;

    protected $table = 'soal';
    protected $primaryKey = 'soal_id';

    protected $fillable = [
        'ujian_id',
        'judul_soal',
        'file_soal',
        'jenis_soal',
        'durasi_pengerjaan',
        'jawaban_benar',
    ];

    public function ujian()
    {
        return $this->belongsTo(Ujian::class, 'ujian_id', 'ujian_id');
    }

    public function jawaban()
    {
        return $this->hasMany(Jawaban::class, 'soal_id', 'soal_id');
    }
}
