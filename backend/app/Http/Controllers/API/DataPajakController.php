<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Traits\ApiResponse;
use App\Services\DataPajakService;
use App\Http\Requests\DataPajak\StoreDataPajakRequest;
use App\Http\Requests\DataPajak\UpdateDataPajakRequest;

use App\Imports\DataPajakImport;
use Maatwebsite\Excel\Facades\Excel;

class DataPajakController extends Controller
{

    use ApiResponse;
    protected $dataPajakService;
    public function __construct(DataPajakService $dataPajakService)
    {
        $this->dataPajakService = $dataPajakService;
    }
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return $this->successResponse(
            $this->dataPajakService->getAll(),
            'Data pajak berhasil diambil'
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreDataPajakRequest $request)
    {
        return $this->successResponse(
            $this->dataPajakService->store($request->validated()),
            'Data pajak berhasil dibuat',
            201
        );
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        return $this->successResponse(
            $this->dataPajakService->getById($id),
            'Detail data pajak berhasil diambil'
        );
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateDataPajakRequest $request, $id)
    {
        return $this->successResponse(
            $this->dataPajakService->update($id, $request->validated()),
            'Data pajak berhasil diupdate'
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $this->dataPajakService->delete($id);

        return $this->successResponse(
            null,
            'Data pajak berhasil dihapus'
        );
    }


    // Excel Import
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:5120',
        ]);

        try {
            $import = new DataPajakImport();

            Excel::import($import, $request->file('file'));

            return response()->json([
                'success' => true,
                'message' => 'Import data pajak selesai',
                'data' => [
                    'jumlah_berhasil' => $import->getImported(),
                    'jumlah_gagal' => count($import->getErrors()),
                    'errors' => $import->getErrors(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Import data pajak gagal',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

}
