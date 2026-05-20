<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DataWaliCalonSantri extends Model
{
    protected $table = 'data_wali_calon_santri';
    protected $primaryKey = 'wali_id';

    protected $fillable = [
        'calon_santri_id',
        'nama',
        'tempat_lahir',
        'tanggal_lahir',
        'pekerjaan',
        'pendidikan',
        'alamat',
        'desa',
        'kecamatan',
        'kota',
        'provinsi',
        'no_hp',
        'hubungan',
    ];

    public function calonSantri()
    {
        return $this->belongsTo(DataCalonSantri::class, 'calon_santri_id', 'calon_santri_id');
    }
}