<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DataCalonSantri extends Model
{
    protected $table = 'data_calon_santri';
    protected $primaryKey = 'calon_santri_id';

    protected $fillable = [
        'user_id',
        'nama_lengkap',
        'nama_panggilan',
        'tempat_lahir',
        'tanggal_lahir',
        'jenis_kelamin',
        'golongan_darah',
        'jumlah_saudara',
        'anak_ke',
        'alamat',
        'nisn',
        'raport_semester_4',
        'akta_kelahiran',
        'pas_foto',
        'kartu_keluarga',
        'ktp',
        'ijazah_skl',
        'surat_pernyataan_lulus',
        'ktp_ayah',
        'ktp_ibu',
    ];
}
