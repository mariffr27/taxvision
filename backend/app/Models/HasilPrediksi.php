<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HasilPrediksi extends Model
{
    protected $table = 'hasil_prediksis';

    protected $fillable = ['id_jenis_pajak', 'id_model', 'perioda_prediksi', 'nilai_prediksi', 'metode_akurasi', 'nilai_akurasi'];

    protected $casts = [
        'perioda_prediksi' => 'date',
        'nilai_prediksi' => 'decimal:2',
    ];

    public function jenisPajak()
    {
        return $this->belongsTo(JenisPajak::class, 'id_jenis_pajak');
    }

    public function modelPrediksi()
    {
        return $this->belongsTo(ModelPrediksi::class, 'id_model');
    }

    public function detail()
    {
        return $this->hasOne(HasilPrediksiDetail::class, 'hasil_prediksi_id');
    }
}
