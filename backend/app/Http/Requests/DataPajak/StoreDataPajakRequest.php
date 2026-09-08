<?php

namespace App\Http\Requests\DataPajak;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreDataPajakRequest extends FormRequest
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
            'id_user' => 'required|exists:users,id',
            'tanggal_pajak' => 'required|date',
            'jumlah_pendapatan' => 'required|numeric|min:0',
        ];
    }
}
