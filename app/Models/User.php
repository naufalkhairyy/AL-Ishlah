<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

// Import model
use App\Models\Santri;
use App\Models\CalonSantri;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'users';
    protected $primaryKey = 'user_id';

    protected $fillable = [
        'username',
        'password',
        'role'
    ];

    protected $hidden = [
        'password'
    ];

    /**
     * Gunakan username untuk login (bukan email)
     */
    public function getAuthIdentifierName()
    {
        return 'username';
    }

    /**
     * Relasi ke Calon Santri (1 user = 1 calon santri)
     */
    public function calonSantri()
    {
        return $this->hasOne(CalonSantri::class, 'user_id', 'user_id');
    }

    /**
     * Relasi ke Santri (1 user = 1 santri)
     */
    public function santri()
    {
        return $this->hasOne(Santri::class, 'user_id', 'user_id');
    }

    public function pembayaran()
    {
        return $this->hasMany(Pembayaran::class, 'user_id', 'user_id');
    }
}
