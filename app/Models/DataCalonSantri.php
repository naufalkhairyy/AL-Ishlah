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
        'ktp',
        'ktp_nama_file',
        'ktp_mime_type',
        'ktp_size',
        'ijazah_skl',
        'ijazah_skl_nama_file',
        'ijazah_skl_mime_type',
        'ijazah_skl_size',
        'surat_pernyataan_lulus',
        'surat_pernyataan_lulus_nama_file',
        'surat_pernyataan_lulus_mime_type',
        'surat_pernyataan_lulus_size',
        'ktp_ayah',
        'ktp_ayah_nama_file',
        'ktp_ayah_mime_type',
        'ktp_ayah_size',
        'ktp_ibu',
        'ktp_ibu_nama_file',
        'ktp_ibu_mime_type',
        'ktp_ibu_size',
    ];

    protected $hidden = [
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
