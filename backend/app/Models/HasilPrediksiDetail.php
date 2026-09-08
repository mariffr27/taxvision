<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HasilPrediksiDetail extends Model
{
    protected $table = 'hasil_prediksi_detail';

    protected $fillable = ['hasil_prediksi_id', 'detail_response'];

    protected $casts = [
        'detail_response' => 'array',
    ];

    public function hasilPrediksi()
    {
        return $this->belongsTo(HasilPrediksi::class, 'hasil_prediksi_id');
    }
}
