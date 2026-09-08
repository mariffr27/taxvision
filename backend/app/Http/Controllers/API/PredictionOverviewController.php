<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PredictionOverviewController extends Controller
{
    public function index()
    {
        $dataAktualQuery = DB::table('data_pajaks')
            ->where(function ($query) {
                $query->whereNull('sumber_data')
                    ->orWhere('sumber_data', 'aktual');
            });

        $totalBulanHistoris = (clone $dataAktualQuery)
            ->selectRaw('COUNT(DISTINCT DATE_FORMAT(tanggal_pajak, "%Y-%m")) as total')
            ->value('total') ?? 0;

        $minDate = (clone $dataAktualQuery)->min('tanggal_pajak');
        $maxDate = (clone $dataAktualQuery)->max('tanggal_pajak');

        $periodeLabel = '-';

        if ($minDate && $maxDate) {
            $periodeLabel = Carbon::parse($minDate)->format('Y') . ' – ' . Carbon::parse($maxDate)->format('Y');
        }

        $modelTerakhir = DB::table('hasil_prediksis')
            ->leftJoin('model_prediksis', 'model_prediksis.id', '=', 'hasil_prediksis.id_model')
            ->orderByDesc('hasil_prediksis.created_at')
            ->value('model_prediksis.nama_model');

        $mapeRataRata = DB::table('hasil_prediksis')
            ->where('metode_akurasi', 'MAPE')
            ->avg('nilai_akurasi');

        $mapeLabel = $mapeRataRata !== null
            ? round($mapeRataRata, 2) . '%'
            : '-';

        return response()->json([
            'success' => true,
            'message' => 'Overview prediksi berhasil diambil.',
            'data' => [
                'nama_sistem' => 'Analitik PBB',
                'periode_label' => $periodeLabel,
                'judul' => 'Prediksi Penerimaan',
                'judul_aksen' => 'Pajak Bumi & Bangunan',
                'total_bulan_historis' => (int) $totalBulanHistoris,
                'metode_proyeksi' => $modelTerakhir ?? 'SMA',
                'mape_rata_rata' => $mapeRataRata ? round($mapeRataRata, 2) : null,
                'mape_label' => $mapeLabel,
                'pertanyaan_utama' => 'Bagaimana memproyeksikan penerimaan PBB bulan depan dari data historis secara akurat dan andal?',
            ],
        ]);
    }
}
