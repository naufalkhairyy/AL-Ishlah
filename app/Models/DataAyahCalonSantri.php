<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DataAyahCalonSantri extends Model
{
    protected $table = 'data_ayah_calon_santri';
    protected $primaryKey = 'ayah_id';

    protected $fillable = [
        'calon_santri_id',
        'nama',
        'tempat_lahir',
        'tanggal_lahir',
        'pekerjaan',
        'pendidikan',
        'penghasilan',
        'alamat',
        'desa',
        'kecamatan',
        'kota',
        'provinsi',
        'no_hp',
    ];

    public function calonSantri()
    {
        return $this->belongsTo(DataCalonSantri::class, 'calon_santri_id', 'calon_santri_id');
    }
}