<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CalonSantri extends Model
{
    use HasFactory;
    protected $table = 'calon_santri';
    protected $fillable = [
    'user_id',
    'nama_lengkap',
    'tempat_lahir',
    'tanggal_lahir',
    'jenis_kelamin',
    'alamat',
    'no_hp'
];
}
