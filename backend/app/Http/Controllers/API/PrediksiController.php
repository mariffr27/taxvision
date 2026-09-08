<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\HasilPrediksiDetail;
use App\Services\PrediksiService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class PrediksiController extends Controller
{
    use ApiResponse;

    public function __construct(protected PrediksiService $prediksiService)
    {
    }

    /**
     * Endpoint prediksi SMA 5 tahun terakhir dengan akurasi pilihan
     */
    // public function sma(Request $request)
    // {
    //     $request->validate([
    //         'id_jenis_pajak' => 'required|exists:jenis_pajaks,id',
    //         'id_model' => 'required|exists:model_prediksis,id',
    //         'perioda_prediksi' => 'required|date',
    //         'metode_akurasi' => 'nullable|string|in:MAPE,MAE,RMSE,NONE'
    //     ]);

    //     $metode = $request->input('metode_akurasi', 'MAPE');

    //     try {
    //         $hasil = $this->prediksiService->prediksiSMA5TahunDenganAkurasi(
    //             $request->id_jenis_pajak,
    //             $request->id_model,
    //             $request->perioda_prediksi,
    //             $metode
    //         );

    //         return $this->successResponse($hasil, 'Prediksi SMA 5 tahun berhasil dibuat', 201);

    //     } catch (\Exception $e) {
    //         return $this->errorResponse($e->getMessage(), 400);
    //     }
    // }

    public function smaBulanan(Request $request)
    {
        $request->validate([
            'id_jenis_pajak' => 'required|integer',
            'id_model' => 'required|integer',
            'periode_prediksi' => 'required|date_format:Y-m',
            'periode_sma' => 'nullable|integer',
        ]);

        $service = new PrediksiService();
        $result = $service->prediksiSMA5TahunBulanan(
            $request->id_jenis_pajak,
            $request->id_model,
            $request->periode_prediksi,
            // $request->metode_akurasi ?? 'MAPE',
            // $request->periode_sma ?? 3
        );

        return response()->json($result);
    }

    public function detail($id)
    {
        $detail = HasilPrediksiDetail::where('hasil_prediksi_id', $id)->first();

        if (!$detail) {
            return response()->json([
                'success' => false,
                'message' => 'Detail prediksi tidak ditemukan',
                'data' => null
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $detail->detail_response
        ]);
    }

    public function terbaru()
    {
        $detail = HasilPrediksiDetail::latest()->first();

        if (!$detail) {
            return response()->json([
                'success' => false,
                'message' => 'Belum ada data prediksi',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $detail->detail_response,
        ]);
    }

    /**
     * Prediksi multi-tahun real-time.
     */
    public function multiTahun(Request $request)
    {
        $request->validate([
            'tahun_mulai' => 'required|integer|min:2020|max:2035',
            'tahun_selesai' => 'required|integer|min:2020|max:2035|gte:tahun_mulai',
            'id_jenis_pajak' => 'required|integer|exists:jenis_pajaks,id',
            'id_model' => 'required|integer|exists:model_prediksis,id',
        ]);

        $result = $this->prediksiService->prediksiMultiTahun(
            idJenisPajak: $request->input('id_jenis_pajak'),
            idModel: $request->input('id_model'),
            tahunMulai: $request->input('tahun_mulai'),
            tahunSelesai: $request->input('tahun_selesai'),
        );

        return response()->json([
            'success' => true,
            'data' => [
                'detail_per_bulan' => $result['detail_per_bulan'],
                'ringkasan_per_tahun' => $result['ringkasan_per_tahun'],
            ],
            'meta' => array_merge($result['meta'], [
                'waktu' => now()->toDateTimeString(),
            ]),
        ]);
    }
}
