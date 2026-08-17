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
        'status_dokumen',
        'catatan_dokumen',
        'dokumen_status',
        'dokumen_catatan',
        'raport_semester_4',
        'raport_semester_4_nama_file',
        'raport_semester_4_mime_type',
        'raport_semester_4_size',
        'akta_kelahiran',
        'akta_kelahiran_nama_file',
        'akta_kelahiran_mime_type',
        'akta_kelahiran_size',
        'pas_foto',
        'pas_foto_nama_file',
        'pas_foto_mime_type',
        'pas_foto_size',
        'kartu_keluarga',
        'kartu_keluarga_nama_file',
        'kartu_keluarga_mime_type',
        'kartu_keluarga_size',
        'ktp_ayah',
        'ktp_ayah_nama_file',
        'ktp_ayah_mime_type',
        'ktp_ayah_size',
    ];

    protected $hidden = [
        'raport_semester_4',
        'akta_kelahiran',
        'pas_foto',
        'kartu_keluarga',
        'ktp_ayah',
    ];

    protected $casts = [
        'dokumen_status' => 'array',
        'dokumen_catatan' => 'array',
    ];
}
