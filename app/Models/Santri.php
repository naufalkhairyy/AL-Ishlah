<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Santri extends Model
{
    protected $table = 'santri';
    protected $primaryKey = 'santri_id';

    protected $fillable = [
        'user_id',
        'nama_lengkap',
        'tempat_lahir',
        'tanggal_lahir',
        'jenis_kelamin',
        'alamat',
        'no_hp',
        'kelas'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function jadwalUjian()
    {
        return $this->hasMany(JadwalUjian::class, 'santri_id', 'santri_id');
    }

    public function jawaban()
    {
        return $this->hasMany(Jawaban::class, 'santri_id', 'santri_id');
    }
}
