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
        'nomor_soal',
        'judul_soal',
        'file_soal',
        'file_soal_nama_file',
        'file_soal_mime_type',
        'file_soal_size',
        'jenis_soal',
        'opsi_a',
        'opsi_b',
        'opsi_c',
        'opsi_d',
        'opsi_e',
        'durasi_pengerjaan',
        'jawaban_benar',
        'bobot_nilai',
    ];

    protected $hidden = [
        'file_soal',
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
