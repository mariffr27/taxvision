<?php

namespace App\Services;

use App\Models\JenisPajak;

class JenisPajakService
{
    public function getAll() {
        return JenisPajak::latest()->get();
    }

    public function getById($id) {
        return JenisPajak::findOrFail($id);
    }

    public function store(array $data) {
        return JenisPajak::create($data);
    }

    public function update($id, array $data) {
        $jenisPajak = JenisPajak::findOrFail($id);

        $jenisPajak->update($data);

        return $jenisPajak;
    }

    public function delete($id) {
        $jenisPajak = JenisPajak::findOrFail($id);

        return $jenisPajak->delete();
    }
}
