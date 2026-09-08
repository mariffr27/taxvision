<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModelPrediksi extends Model
{
    protected $table = 'model_prediksis';

    protected $primaryKey = 'id';

    protected $fillable = ['nama_model', 'parameter', 'akurasi'];

    protected $casts = [
        'akurasi' => 'decimal:2',
    ];

    // Relasi
    public function hasilPrediksi()
    {
        return $this->hasMany(HasilPrediksi::class, 'id_model_prediksi');
    }
}
