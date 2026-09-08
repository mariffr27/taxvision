<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Traits\ApiResponse;
use App\Http\Requests\ModelPrediksi\StoreModelPrediksiRequest;
use App\Http\Requests\ModelPrediksi\UpdateModelPrediksiRequest;
use App\Services\ModelPrediksiService;

class ModelPrediksiController extends Controller
{

    use ApiResponse;

    public function __construct(
        protected ModelPrediksiService $modelPrediksiService
    ) {
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return $this->successResponse(
            $this->modelPrediksiService->getAll(),
            'Data model prediksi berhasil diambil'
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreModelPrediksiRequest $request)
    {
        return $this->successResponse(
            $this->modelPrediksiService->store($request->validated()),
            'Model prediksi berhasil dibuat',
            201
        );
    }

    /**
     * Display the specified resource.
     */

    public function show($id)
    {
        return $this->successResponse(
            $this->modelPrediksiService->getById($id),
            'Detail model prediksi berhasil diambil'
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateModelPrediksiRequest $request, $id)
    {
        return $this->successResponse(
            $this->modelPrediksiService->update($id, $request->validated()),
            'Model prediksi berhasil diupdate'
        );
    }
    /**
     * Remove the specified resource from storage.
     */

    public function destroy($id)
    {
        $this->modelPrediksiService->delete($id);

        return $this->successResponse(
            null,
            'Model prediksi berhasil dihapus'
        );
    }
}
