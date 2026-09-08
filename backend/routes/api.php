<?php

use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\DataPajakController;
use App\Http\Controllers\API\HasilPrediksiController;
use App\Http\Controllers\API\JenisPajakController;
use App\Http\Controllers\API\LaporanController;
use App\Http\Controllers\API\ModelPrediksiController;
use App\Http\Controllers\API\PredictionOverviewController;
use App\Http\Controllers\API\PrediksiController;
use App\Http\Controllers\API\UsersController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Route publik
|--------------------------------------------------------------------------
| Tidak memerlukan token autentikasi.
*/
Route::post('/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Route terautentikasi
|--------------------------------------------------------------------------
| Harus mengirim:
| Authorization: Bearer {token}
*/
Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Autentikasi pengguna
    |--------------------------------------------------------------------------
    */
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

});


/*
   |--------------------------------------------------------------------------
   | Dashboard
   |--------------------------------------------------------------------------
   */
Route::get(
    '/prediction-overview',
    [PredictionOverviewController::class, 'index']
);

/*
|--------------------------------------------------------------------------
| Pengguna
|--------------------------------------------------------------------------
*/
Route::apiResource('users', UsersController::class);

/*
|--------------------------------------------------------------------------
| Jenis pajak
|--------------------------------------------------------------------------
*/
Route::apiResource('jenis-pajak', JenisPajakController::class);

/*
|--------------------------------------------------------------------------
| Data pajak
|--------------------------------------------------------------------------
*/
Route::post(
    '/data-pajak-import',
    [DataPajakController::class, 'import']
);

Route::apiResource('data-pajak', DataPajakController::class);

/*
|--------------------------------------------------------------------------
| Model prediksi
|--------------------------------------------------------------------------
*/
Route::apiResource(
    'model-prediksi',
    ModelPrediksiController::class
);

/*
|--------------------------------------------------------------------------
| Hasil prediksi
|--------------------------------------------------------------------------
*/
Route::apiResource(
    'hasil-prediksi',
    HasilPrediksiController::class
);

/*
|--------------------------------------------------------------------------
| Proses prediksi
|--------------------------------------------------------------------------
*/
Route::post(
    '/prediksi-sma',
    [PrediksiController::class, 'smaBulanan']
);

Route::post(
    '/prediksi/multi-tahun',
    [PrediksiController::class, 'multiTahun']
);
Route::get(
    '/prediksi/multi-tahun',
    [PrediksiController::class, 'multiTahun']
);


Route::get(
    '/prediksi/detail/{id}',
    [PrediksiController::class, 'detail']
);

/*
|--------------------------------------------------------------------------
| Laporan
|--------------------------------------------------------------------------
*/
Route::get(
    '/laporan',
    [LaporanController::class, 'index']
);
