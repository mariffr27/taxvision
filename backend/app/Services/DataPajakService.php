<?php

namespace App\Services;
use App\Models\DataPajak;

class DataPajakService
{
    public function getAll()
    {
        return DataPajak::latest()->get();
    }

    public function getById($id)
    {
        return DataPajak::findOrFail($id);
    }
    public function store(array $data)
    {
        return DataPajak::create($data);
    }

    public function update($id, array $data)
    {
        $dataPajak = $this->getById($id);
        $dataPajak->update($data);
        return $dataPajak;
    }

    public function delete($id)
    {
        $dataPajak = $this->getById($id);
        $dataPajak->delete();
    }
}
