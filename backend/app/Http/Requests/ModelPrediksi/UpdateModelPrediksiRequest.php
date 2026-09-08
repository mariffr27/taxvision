<?php

namespace App\Http\Requests\ModelPrediksi;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateModelPrediksiRequest extends FormRequest
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
            'nama_model' => 'required|string|max:50',
            'parameter' => 'nullable|string|max:255',
            'akurasi' => 'nullable|numeric|min:0|max:100',
        ];
    }
}
