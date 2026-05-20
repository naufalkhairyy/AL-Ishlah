<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DataSekolahAsalCalonSantri extends Model
{
    protected $table = 'data_sekolah_asal_calon_santri';
    protected $primaryKey = 'sekolah_id';

    protected $fillable = [
        'calon_santri_id',
        'nama_sekolah',
        'alamat_sekolah',
        'kota',
        'provinsi',
        'tahun_lulus',
    ];

    public function calonSantri()
    {
        return $this->belongsTo(DataCalonSantri::class, 'calon_santri_id', 'calon_santri_id');
    }
}