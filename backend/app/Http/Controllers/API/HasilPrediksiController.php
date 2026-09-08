<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Traits\ApiResponse;
use App\Services\HasilPrediksiService;
use App\Http\Requests\HasilPrediksi\StoreHasilPrediksiRequest;
use App\Http\Requests\HasilPrediksi\UpdateHasilPrediksiRequest;
use App\Models\HasilPrediksi;

class HasilPrediksiController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected HasilPrediksiService $hasilPrediksiService
    ) {
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return $this->successResponse(
            $this->hasilPrediksiService->getAll(),
            'Data hasil prediksi berhasil diambil'
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreHasilPrediksiRequest $request)
    {
        return $this->successResponse(
            $this->hasilPrediksiService->store($request->validated()),
            'Hasil prediksi berhasil dibuat',
            201
        );
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        return $this->successResponse(
            $this->hasilPrediksiService->getById($id),
            'Detail hasil prediksi berhasil diambil'
        );
    }
    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateHasilPrediksiRequest $request, $id)
    {
        return $this->successResponse(
            $this->hasilPrediksiService->update($id, $request->validated()),
            'Hasil prediksi berhasil diupdate'
        );
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $this->hasilPrediksiService->delete($id);

        return $this->successResponse(
            null,
            'Hasil prediksi berhasil dihapus'
        );
    }
}
