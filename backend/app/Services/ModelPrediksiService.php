<?php

namespace App\Services;

use App\Models\ModelPrediksi;

class ModelPrediksiService
{
    public function getAll()
    {
        return ModelPrediksi::latest()->get();
    }

    public function getById($id)
    {
        return ModelPrediksi::findOrFail($id);
    }

    public function store(array $data)
    {
        return ModelPrediksi::create($data);
    }

    public function update($id, array $data)
    {
        $modelPrediksi = ModelPrediksi::findOrFail($id);

        $modelPrediksi->update($data);

        return $modelPrediksi;
    }

    public function delete($id)
    {
        $modelPrediksi = ModelPrediksi::findOrFail($id);

        return $modelPrediksi->delete();
    }
}
