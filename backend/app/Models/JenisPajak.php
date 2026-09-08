<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JenisPajak extends Model
{
    protected $table = 'jenis_pajaks';
    protected $primaryKey = 'id';

    protected $fillable = ['nama_pajak', 'keterangan'];


    // Relasi
    public function dataPajak()
    {
        return $this->hasMany(DataPajak::class, 'id_jenis_pajak');
    }

    public function hasilPrediksi()
    {
        return $this->hasMany(HasilPrediksi::class, 'id_jenis_pajak');
    }
}
