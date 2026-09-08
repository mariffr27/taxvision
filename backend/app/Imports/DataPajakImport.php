<?php

namespace App\Imports;

use App\Models\DataPajak;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

class DataPajakImport implements ToCollection, WithHeadingRow, SkipsEmptyRows
{
    protected array $errors = [];
    protected int $imported = 0;

    public function collection(Collection $rows)
    {
        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;

            $data = [
                'id_jenis_pajak' => $row['id_jenis_pajak'] ?? null,
                'id_user' => $row['id_user'] ?? null,
                'tanggal_pajak' => $row['tanggal_pajak'] ?? null,
                'jumlah_pendapatan' => $row['jumlah_pendapatan'] ?? null,
            ];

            $validator = Validator::make($data, [
                'id_jenis_pajak' => 'required|integer|exists:jenis_pajaks,id',
                'id_user' => 'required|integer|exists:users,id',
                'tanggal_pajak' => 'required|date',
                'jumlah_pendapatan' => 'required|numeric|min:0',
            ]);

            if ($validator->fails()) {
                $this->errors[] = [
                    'baris' => $rowNumber,
                    'errors' => $validator->errors()->all(),
                ];

                continue;
            }

            DataPajak::create([
                'id_jenis_pajak' => $data['id_jenis_pajak'],
                'id_user' => $data['id_user'],
                'tanggal_pajak' => $data['tanggal_pajak'],
                'jumlah_pendapatan' => $data['jumlah_pendapatan'],
            ]);

            $this->imported++;
        }
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function getImported(): int
    {
        return $this->imported;
    }
}
