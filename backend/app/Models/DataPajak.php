<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DataPajak extends Model
{
    protected $table = 'data_pajaks';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id_jenis_pajak',
        'id_user',
        'tanggal_pajak',
        'jumlah_pendapatan',
        'sumber_data',
        'hasil_prediksi_id'
    ];

    // Relasi
    public function jenisPajak()
    {
        return $this->belongsTo(JenisPajak::class, 'id_jenis_pajak');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }
}
