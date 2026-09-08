<?php

namespace App\Http\Requests\HasilPrediksi;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateHasilPrediksiRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'id_jenis_pajak' => 'required|exists:jenis_pajaks,id',
            'id_model' => 'required|exists:model_prediksis,id',
            'perioda_prediksi' => 'required|date',
            'nilai_prediksi' => 'required|numeric|min:0',
            'metode_akurasi' => 'nullable|string|max:20',
            'nilai_akurasi' => 'nullable|numeric|min:0',
        ];
    }
}
