<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Traits\ApiResponse;
use App\Services\JenisPajakService;
use App\Http\Requests\JenisPajak\StoreJenisPajakRequest;
use App\Http\Requests\JenisPajak\UpdateJenisPajakRequest;

class JenisPajakController extends Controller
{
    use ApiResponse;
    protected $jenisPajakService;

    public function __construct(JenisPajakService $jenisPajakService)
    {
        $this->jenisPajakService = $jenisPajakService;
    }
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return $this->successResponse(
            $this->jenisPajakService->getAll(), 'Jenis Pajak retrieved successfully'
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreJenisPajakRequest $request)
    {
        $data = $this->jenisPajakService->store(
            $request->validated()
        );

        return $this->successResponse(
            $data, 'Jenis Pajak created successfully', 201
        );
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        return $this->successResponse(
            $this->jenisPajakService->getById($id), 'Jenis Pajak retrieved successfully'
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateJenisPajakRequest $request, $id)
    {
        $data = $this->jenisPajakService->update(
            $id, $request->validated()
        );

        return $this->successResponse(
            $data, 'Jenis Pajak updated successfully'
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $this->jenisPajakService->delete($id);

        return $this->successResponse(
            null, 'Jenis Pajak deleted successfully'
        );
    }
}
