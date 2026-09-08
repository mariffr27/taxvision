<?php

namespace App\Services;

use App\Models\HasilPrediksi;

class HasilPrediksiService
{
    public function getAll()
    {
        return HasilPrediksi::with(['jenisPajak', 'modelPrediksi'])
            ->latest()
            ->get();
    }

    public function getById($id)
    {
        return HasilPrediksi::with(['jenisPajak', 'modelPrediksi'])
            ->findOrFail($id);
    }

    public function store(array $data)
    {
        return HasilPrediksi::create($data)
            ->load(['jenisPajak', 'modelPrediksi']);
    }

    public function update($id, array $data)
    {
        $hasilPrediksi = HasilPrediksi::findOrFail($id);

        $hasilPrediksi->update($data);

        return $hasilPrediksi->load(['jenisPajak', 'modelPrediksi']);
    }

    public function delete($id)
    {
        $hasilPrediksi = HasilPrediksi::findOrFail($id);

        return $hasilPrediksi->delete();
    }
}
