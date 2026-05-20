<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DataIbuCalonSantri extends Model
{
    protected $table = 'data_ibu_calon_santri';
    protected $primaryKey = 'ibu_id';

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
        'no_hp_pondok',
    ];

    public function calonSantri()
    {
        return $this->belongsTo(DataCalonSantri::class, 'calon_santri_id', 'calon_santri_id');
    }
}