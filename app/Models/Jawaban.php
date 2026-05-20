<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Jawaban extends Model
{
    use HasFactory;

    protected $table = 'jawaban';
    protected $primaryKey = 'jawaban_id';

    protected $fillable = [
        'soal_id',
        'santri_id',
        'jawaban_text',
        'nilai_jawaban',
        'waktu_submit',
    ];

    public function soal()
    {
        return $this->belongsTo(Soal::class, 'soal_id', 'soal_id');
    }

    public function santri()
    {
        return $this->belongsTo(Santri::class, 'santri_id', 'santri_id');
    }
}
