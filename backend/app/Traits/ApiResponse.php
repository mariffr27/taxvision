<?php

namespace App\Traits;

trait ApiResponse
{
    public function successResponse(
        $data = null,
        string $message = 'Success',
        int $code = 200
    ) {
        return response()->json([
            'success' => true, // gunakan boolean, jangan string
            'message' => $message,
            'data' => $data
        ], $code);
    }

    public function errorResponse(
        string $message = 'Error',
        int $code = 400,
        $data = null
    ) {
        return response()->json([
            'success' => false, // gunakan boolean
            'message' => $message,
            'data' => $data // pakai $data, bukan $error
        ], $code);
    }
}
