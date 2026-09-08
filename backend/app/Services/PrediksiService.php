<?php

namespace App\Services;

use App\Models\DataPajak;
use App\Models\HasilPrediksi;
use App\Models\HasilPrediksiDetail;
use Carbon\Carbon;

class PrediksiService
{
    /**
     * KONFIGURASI OPTIMASI
     * Aktifkan/nonaktifkan fitur sesuai kebutuhan
     */
    private $gunakanWeightedSeasonal = true;  // Gunakan weighted seasonal index
    private $gunakanDualSMA = false;          // Gunakan dual period strategy
    private $gunakanEnsembleSMA = false;      // Gunakan ensemble SMA
    private $gunakanTrend = false;            // Detrending (terbukti tidak efektif)

    /**
     * Melakukan prediksi penerimaan pajak menggunakan metode Simple Moving
     * Average (SMA) dengan Data Preprocessing dan Multiple Optimasi.
     *
     * STRATEGI PREPROCESSING DAN OPTIMASI:
     * 1. Log Transformation: mengurangi volatilitas ekstrem
     * 2. Weighted Seasonal Deseasonalisasi: indeks musiman dengan bobot temporal
     * 3. Optional: Dual SMA Strategy untuk high/low season
     * 4. Optional: Ensemble SMA dengan bobot berdasarkan historis MAPE
     * 5. Optional: Detrending (terbukti tidak efektif untuk data ini)
     */
    public function prediksiSMA5TahunBulanan(
        int $idJenisPajak,
        int $idModel,
        string $periodePrediksi
    ): array {
        // ═══ TAHAP 0: Ambil data historis bulanan (jendela 5 tahun) ═══════
        $periode = Carbon::parse($periodePrediksi);
        $startDate = $periode->copy()->subYears(5)->startOfMonth();
        $endDate = $periode->copy()->subMonth()->endOfMonth();

        $dataHistoris = $this->ambilDataHistorisBulananPrioritas(
            $idJenisPajak,
            $startDate,
            $endDate
        );

        if (count($dataHistoris) < 24) {
            throw new \Exception(
                'Minimal diperlukan 24 data bulanan untuk melakukan evaluasi SMA.'
            );
        }

        // ═══ TAHAP 1: Log Transformation ══════════════════════════════════
        $dataLogTransformed = $this->applyLogTransformation($dataHistoris);

        // ═══ TAHAP 2: Split data training (80%) & testing (20%) ══════════
        $splitIndex = (int) floor(count($dataLogTransformed) * 0.8);
        $train = array_slice($dataLogTransformed, 0, $splitIndex);
        $test = array_slice($dataLogTransformed, $splitIndex);

        // ═══ TAHAP 3: Hitung indeks musiman ═══════════════════════════════
        if ($this->gunakanWeightedSeasonal) {
            $indeksMusimanTrain = $this->hitungIndeksMusimanWeighted($train);
        } else {
            $indeksMusimanTrain = $this->hitungIndeksMusimanLog($train);
        }

        // ═══ TAHAP 4: Uji variasi periode dan strategi SMA ════════════════
        $hasilModel = [];

        // Uji SMA standar dengan berbagai periode
        $periodeUji = range(2, 12);
        foreach ($periodeUji as $periodeSMA) {
            if (count($train) < $periodeSMA) {
                continue;
            }

            $evaluasi = $this->evaluasiSMA($train, $test, $periodeSMA, $indeksMusimanTrain, 'standard');

            if (!empty($evaluasi)) {
                $hasilModel[] = [
                    'model' => 'SMA ' . $periodeSMA,
                    'tipe' => 'Standard SMA',
                    'periode_sma' => $periodeSMA,
                    'jumlah_data_training' => count($train),
                    'jumlah_data_testing' => count($test),
                    'jumlah_data_uji' => count($evaluasi),
                    'mape' => $this->hitungMAPE($evaluasi),
                    'evaluasi' => $evaluasi,
                ];
            }
        }

        // Uji Dual SMA Strategy jika diaktifkan
        if ($this->gunakanDualSMA) {
            $evaluasiDual = $this->evaluasiSMA($train, $test, 12, $indeksMusimanTrain, 'dual');
            if (!empty($evaluasiDual)) {
                $hasilModel[] = [
                    'model' => 'Dual SMA Strategy',
                    'tipe' => 'Dual Period SMA',
                    'periode_sma' => '3/6/12',
                    'jumlah_data_training' => count($train),
                    'jumlah_data_testing' => count($test),
                    'jumlah_data_uji' => count($evaluasiDual),
                    'mape' => $this->hitungMAPE($evaluasiDual),
                    'evaluasi' => $evaluasiDual,
                ];
            }
        }

        // Uji Ensemble SMA jika diaktifkan
        if ($this->gunakanEnsembleSMA) {
            $evaluasiEnsemble = $this->evaluasiSMA($train, $test, 12, $indeksMusimanTrain, 'ensemble');
            if (!empty($evaluasiEnsemble)) {
                $hasilModel[] = [
                    'model' => 'Ensemble SMA (6+9+12)',
                    'tipe' => 'Ensemble SMA',
                    'periode_sma' => '6,9,12',
                    'jumlah_data_training' => count($train),
                    'jumlah_data_testing' => count($test),
                    'jumlah_data_uji' => count($evaluasiEnsemble),
                    'mape' => $this->hitungMAPE($evaluasiEnsemble),
                    'evaluasi' => $evaluasiEnsemble,
                ];
            }
        }

        if (empty($hasilModel)) {
            throw new \Exception('Tidak ada model yang dapat diuji.');
        }

        // ═══ TAHAP 5: Pilih model dengan MAPE terkecil ════════════════════
        usort($hasilModel, fn($a, $b) => $a['mape'] <=> $b['mape']);
        $modelTerbaik = $hasilModel[0];

        // Tentukan strategi terbaik
        $strategiTerbaik = $modelTerbaik['tipe'];
        $periodeTerbaik = $modelTerbaik['periode_sma'];

        // ═══ TAHAP 6: Hitung prediksi produksi akhir ══════════════════════
        // Hitung ulang indeks musiman dari seluruh data
        if ($this->gunakanWeightedSeasonal) {
            $indeksMusimanFinal = $this->hitungIndeksMusimanWeighted($dataLogTransformed);
        } else {
            $indeksMusimanFinal = $this->hitungIndeksMusimanLog($dataLogTransformed);
        }

        $dataDeseasonFinal = $this->deseasonalisasiLog($dataLogTransformed, $indeksMusimanFinal);

        // Prediksi sesuai strategi terbaik
        $bulanTarget = (int) $periode->month;

        // Simpan detail SMA mana saja yang dipakai (untuk trace)
        $detailSMAFinal = [];

        switch ($strategiTerbaik) {
            case 'Dual Period SMA':
                $prediksiDeseasonLog = $this->prediksiDualSMA($dataDeseasonFinal, $bulanTarget);
                $periodeSMADipakai = in_array($bulanTarget, [6, 7, 8, 9]) ? 3
                    : (in_array($bulanTarget, [10, 11, 12, 1, 2]) ? 12 : 6);
                $detailSMAFinal = [
                    'strategi' => 'Dual Period SMA',
                    'periode_sma_dipakai' => $periodeSMADipakai,
                    'alasan' => in_array($bulanTarget, [6, 7, 8, 9])
                        ? 'High season (Jun-Sep) -> SMA 3'
                        : (in_array($bulanTarget, [10, 11, 12, 1, 2])
                            ? 'Low season (Okt-Feb) -> SMA 12'
                            : 'Transisi (Mar-Mei) -> SMA 6'),
                ];
                break;
            case 'Ensemble SMA':
                $sma6 = $this->prediksiSMAFinal($dataDeseasonFinal, 6);
                $sma9 = $this->prediksiSMAFinal($dataDeseasonFinal, 9);
                $sma12 = $this->prediksiSMAFinal($dataDeseasonFinal, 12);
                $prediksiDeseasonLog = $this->prediksiEnsembleSMA($dataDeseasonFinal);
                $detailSMAFinal = [
                    'strategi' => 'Ensemble SMA',
                    'sma_6_deseason_log' => round($sma6, 6),
                    'sma_9_deseason_log' => round($sma9, 6),
                    'sma_12_deseason_log' => round($sma12, 6),
                    'bobot' => ['sma6' => '14.5%', 'sma9' => '32.2%', 'sma12' => '53.3%'],
                ];
                break;
            default:
                $prediksiDeseasonLog = $this->prediksiSMAFinal($dataDeseasonFinal, (int) $periodeTerbaik);
                $nData = count($dataDeseasonFinal);
                $dataDipakaiSMA = array_slice($dataDeseasonFinal, max(0, $nData - (int) $periodeTerbaik), (int) $periodeTerbaik);
                $detailSMAFinal = [
                    'strategi' => 'Standard SMA',
                    'periode_sma_dipakai' => (int) $periodeTerbaik,
                    'data_bulan_dipakai' => array_map(fn($d) => [
                        'tahun' => $d['tahun'],
                        'bulan' => $d['bulan'],
                        'nilai_deseason_log' => round($d['total_pendapatan'], 6),
                    ], $dataDipakaiSMA),
                ];
        }

        $idxLogTarget = $indeksMusimanFinal[$bulanTarget] ?? 0.0;
        $nilaiReseasonLog = $prediksiDeseasonLog + $idxLogTarget;
        $nilaiPrediksi = exp($nilaiReseasonLog) - 1;
        $nilaiAkurasi = $modelTerbaik['mape'];

        // ═══ TAHAP 7: Simpan hasil prediksi ke database ═══════════════════
        $hasilDB = HasilPrediksi::create([
            'id_jenis_pajak' => $idJenisPajak,
            'id_model' => $idModel,
            'perioda_prediksi' => $periodePrediksi,
            'nilai_prediksi' => round($nilaiPrediksi, 2),
            'metode_akurasi' => 'MAPE',
            'nilai_akurasi' => $nilaiAkurasi,
        ]);

        $periodeTanggal = Carbon::parse($periodePrediksi)->startOfMonth();

        $adaDataAktual = DataPajak::where('id_jenis_pajak', $idJenisPajak)
            ->whereYear('tanggal_pajak', $periodeTanggal->year)
            ->whereMonth('tanggal_pajak', $periodeTanggal->month)
            ->where('sumber_data', 'aktual')
            ->exists();

        if (!$adaDataAktual) {
            DataPajak::updateOrCreate(
                [
                    'id_jenis_pajak' => $idJenisPajak,
                    'tanggal_pajak' => $periodeTanggal->format('Y-m-d'),
                    'sumber_data' => 'prediksi',
                ],
                [
                    'id_user' => request()->user()?->id ?? 1,
                    'jumlah_pendapatan' => round($nilaiPrediksi, 2),
                    'hasil_prediksi_id' => $hasilDB->id,
                ]
            );
        }

        // ═══ TAHAP 8: Susun response lengkap ══════════════════════════════
        $nilaiDataAsli = array_map(fn($d) => $d['total_pendapatan'], $dataHistoris);
        $nilaiDataLog = array_map(fn($d) => $d['total_pendapatan'], $dataLogTransformed);

        // ── Trace runtut per-bulan, masing-masing tahap jadi map tersendiri ──
        // Key seragam "YYYY-MM" (mis. "2023-01"), sama gayanya dengan indeks_musiman_log.
        // (dataHistoris, dataLogTransformed, dataDeseasonFinal punya urutan & jumlah baris yang sama)
        $dataAsliBulanan = [];
        $dataLogBulanan = [];
        $dataDeseasonBulanan = [];
        $sumberDataBulanan = [];

        foreach ($dataHistoris as $i => $asli) {
            $keyPeriode = $asli['tahun'] . '-' . str_pad($asli['bulan'], 2, '0', STR_PAD_LEFT);

            $dataAsliBulanan[$keyPeriode] = round($asli['total_pendapatan'], 2);
            $dataLogBulanan[$keyPeriode] = round($dataLogTransformed[$i]['total_pendapatan'], 6);
            $dataDeseasonBulanan[$keyPeriode] = round($dataDeseasonFinal[$i]['total_pendapatan'], 6);
            $sumberDataBulanan[$keyPeriode] = $asli['sumber_data'];
        }

        $responseArray = [
            'metode' => 'Simple Moving Average + Optimasi Preprocessing',
            'konfigurasi_optimasi' => [
                'weighted_seasonal_index' => $this->gunakanWeightedSeasonal ?
                    'Aktif - Indeks musiman dengan bobot temporal (tahun terbaru lebih penting)' :
                    'Nonaktif',
                'dual_sma_strategy' => $this->gunakanDualSMA ?
                    'Aktif - Periode SMA berbeda untuk high/low season' :
                    'Nonaktif',
                'ensemble_sma' => $this->gunakanEnsembleSMA ?
                    'Aktif - Gabungan SMA 6, 9, dan 12 bulan' :
                    'Nonaktif',
                'detrending' => 'Nonaktif - Terbukti tidak efektif (MAPE > 70%)',
            ],
            'preprocessing' => [
                'log_transformation' => 'Ya - Mengubah data ke skala logaritmik',
                'deseasonalisasi_musiman' => $this->gunakanWeightedSeasonal ?
                    'Ya - Weighted Seasonal Index dengan bobot temporal' :
                    'Ya - Trimmed-mean seasonal index',
            ],
            'periode_data' => $startDate->format('Y-m') . ' - ' . $endDate->format('Y-m'),
            'jumlah_data_bulanan' => count($dataHistoris),
            'pembagian_data' => [
                'training' => count($train),
                'testing' => count($test),
                'rasio' => '80:20',
            ],

            // ══════════════════════════════════════════════════════════
            // TAHAPAN PERHITUNGAN — tiap tahap jadi field sendiri, urut
            // dari data mentah sampai nilai prediksi akhir.
            // ══════════════════════════════════════════════════════════

            // Tahap 0: data mentah per bulan (hasil agregasi, sebelum diolah)
            'data_asli_bulanan' => $dataAsliBulanan,
            'sumber_data_bulanan' => $sumberDataBulanan,

            // Tahap 1: hasil log(x + 1)
            'data_log_bulanan' => $dataLogBulanan,

            // Tahap 3: indeks musiman (dihitung dari seluruh data log)
            'indeks_musiman_log' => $indeksMusimanFinal,

            // Tahap 3b: hasil deseasonalisasi = data_log - indeks_musiman[bulan]
            'data_deseason_bulanan' => $dataDeseasonBulanan,

            // Tahap 4-5: model-model yang diuji & model terbaik yang dipilih
            'model_diuji' => $hasilModel,
            'model_terbaik' => [
                'model' => $modelTerbaik['model'],
                'tipe' => $modelTerbaik['tipe'],
                'periode_sma' => $periodeTerbaik,
                'mape' => $modelTerbaik['mape'],
            ],

            // Tahap 6a: SMA/strategi final yang dipakai untuk prediksi produksi
            'perhitungan_sma_final' => $detailSMAFinal,

            // Tahap 6b: hasil rata-rata SMA (masih skala log & masih deseasonalized)
            'hasil_sma_deseason_log' => round($prediksiDeseasonLog, 6),

            // Tahap 6c: indeks musiman bulan yang diprediksi (ditambahkan kembali)
            'indeks_musiman_bulan_target' => [
                'bulan_target' => $bulanTarget,
                'nilai_indeks' => round($idxLogTarget, 6),
            ],

            // Tahap 6d: reseasonalisasi = hasil_sma_deseason_log + indeks_musiman_bulan_target
            'nilai_reseason_log' => round($nilaiReseasonLog, 6),

            // Tahap 6e: invers log = exp(nilai_reseason_log) - 1  →  nilai prediksi akhir
            'periode_prediksi' => $periodePrediksi,
            'nilai_prediksi' => round($nilaiPrediksi, 2),

            'hasil_db' => $hasilDB,
            'rumus' => $this->getRumusDeskripsi($strategiTerbaik),

            'statistik_data' => [
                'data_asli' => [
                    'min' => round(min($nilaiDataAsli), 2),
                    'max' => round(max($nilaiDataAsli), 2),
                    'range_ratio' => round(max($nilaiDataAsli) / max(min($nilaiDataAsli), 1), 2) . 'x',
                    'std_dev' => round($this->hitungStdDev($nilaiDataAsli), 2),
                ],
                'data_log' => [
                    'min' => round(min($nilaiDataLog), 2),
                    'max' => round(max($nilaiDataLog), 2),
                    'range_ratio' => round(max($nilaiDataLog) / max(min($nilaiDataLog), 0.0001), 2) . 'x',
                    'std_dev' => round($this->hitungStdDev($nilaiDataLog), 2),
                ],
            ],
        ];

        HasilPrediksiDetail::create([
            'hasil_prediksi_id' => $hasilDB->id,
            'detail_response' => $responseArray,
        ]);

        return $responseArray;
    }

    /**
     * [TAHAP 1] Log Transformation
     */
    private function applyLogTransformation(array $data): array
    {
        return array_map(function ($row) {
            return [
                ...$row,
                'total_pendapatan' => log($row['total_pendapatan'] + 1),
            ];
        }, $data);
    }

    /**
     * [OPTIMASI 1] Weighted Seasonal Index
     * Memberikan bobot lebih tinggi pada tahun-tahun terbaru
     * Formula bobot: e^(-0.5 × selisih_tahun)
     * - Tahun ini: bobot = 1.0
     * - 1 tahun lalu: bobot = 0.61
     * - 2 tahun lalu: bobot = 0.37
     * - 3 tahun lalu: bobot = 0.22
     * - 4 tahun lalu: bobot = 0.14
     */
    private function hitungIndeksMusimanWeighted(array $dataLog): array
    {
        $byBulan = [];
        $allValues = [];

        // Cari tahun terakhir dalam data
        $tahunTerakhir = max(array_column($dataLog, 'tahun'));

        // Kumpulkan data per bulan dengan bobot temporal
        foreach ($dataLog as $row) {
            $selisihTahun = $tahunTerakhir - $row['tahun'];
            $weight = exp(-0.5 * $selisihTahun);

            $byBulan[$row['bulan']][] = [
                'value' => $row['total_pendapatan'],
                'weight' => $weight
            ];
            $allValues[] = [
                'value' => $row['total_pendapatan'],
                'weight' => $weight
            ];
        }

        // Hitung weighted mean keseluruhan
        $sumWeightedAll = 0;
        $sumWeightAll = 0;
        foreach ($allValues as $item) {
            $sumWeightedAll += $item['value'] * $item['weight'];
            $sumWeightAll += $item['weight'];
        }
        $overallWeightedMean = $sumWeightAll > 0 ? $sumWeightedAll / $sumWeightAll : 0;

        // Hitung weighted mean per bulan dan selisihnya
        $indeks = [];
        for ($bulan = 1; $bulan <= 12; $bulan++) {
            if (!empty($byBulan[$bulan])) {
                $sumWeighted = 0;
                $sumWeight = 0;
                foreach ($byBulan[$bulan] as $item) {
                    $sumWeighted += $item['value'] * $item['weight'];
                    $sumWeight += $item['weight'];
                }
                $monthlyWeightedMean = $sumWeighted / $sumWeight;
                $indeks[$bulan] = $monthlyWeightedMean - $overallWeightedMean;
            } else {
                $indeks[$bulan] = 0.0;
            }
        }

        return $indeks;
    }

    /**
     * [ORIGINAL] Trimmed-mean seasonal index (versi sebelumnya)
     */
    private function hitungIndeksMusimanLog(array $dataLog): array
    {
        $byBulan = [];
        $semua = [];

        foreach ($dataLog as $row) {
            $byBulan[$row['bulan']][] = $row['total_pendapatan'];
            $semua[] = $row['total_pendapatan'];
        }

        $overallTrimmedMean = $this->trimmedMeanDropMax($semua);

        $indeks = [];
        for ($bulan = 1; $bulan <= 12; $bulan++) {
            $indeks[$bulan] = !empty($byBulan[$bulan])
                ? $this->trimmedMeanDropMax($byBulan[$bulan]) - $overallTrimmedMean
                : 0.0;
        }

        return $indeks;
    }

    /**
     * Trimmed-mean: membuang SATU nilai tertinggi jika data >= 3
     */
    private function trimmedMeanDropMax(array $values): float
    {
        if (count($values) === 0) {
            return 0.0;
        }

        if (count($values) >= 3) {
            sort($values);
            array_pop($values);
        }

        return array_sum($values) / count($values);
    }

    /**
     * Deseasonalisasi data log
     */
    private function deseasonalisasiLog(array $dataLog, array $indeksMusimanLog): array
    {
        return array_map(function ($row) use ($indeksMusimanLog) {
            $idx = $indeksMusimanLog[$row['bulan']] ?? 0.0;
            $row['total_pendapatan_log_asli'] = $row['total_pendapatan'];
            $row['total_pendapatan'] = $row['total_pendapatan'] - $idx;
            return $row;
        }, $dataLog);
    }

    /**
     * [OPTIMASI 2] Dual SMA Strategy
     * Menggunakan periode berbeda untuk musim berbeda
     */
    private function prediksiDualSMA(array $data, int $bulanTarget): float
    {
        // High season (Juni-September): periode pendek untuk responsif
        if (in_array($bulanTarget, [6, 7, 8, 9])) {
            return $this->prediksiSMAFinal($data, 3);
        }
        // Low season (Oktober-Februari): periode panjang untuk stabilitas
        elseif (in_array($bulanTarget, [10, 11, 12, 1, 2])) {
            return $this->prediksiSMAFinal($data, 12);
        }
        // Transition (Maret-Mei): periode menengah
        else {
            return $this->prediksiSMAFinal($data, 6);
        }
    }

    /**
     * [OPTIMASI 3] Ensemble SMA
     * Gabungan SMA 6, 9, dan 12 dengan bobot berdasarkan inverse MAPE
     */
    private function prediksiEnsembleSMA(array $data): float
    {
        try {
            $sma6 = $this->prediksiSMAFinal($data, 6);
            $sma9 = $this->prediksiSMAFinal($data, 9);
            $sma12 = $this->prediksiSMAFinal($data, 12);
        } catch (\Exception $e) {
            // Fallback ke SMA 12 jika data tidak cukup
            return $this->prediksiSMAFinal($data, 12);
        }

        // Bobot berdasarkan inverse MAPE dari hasil pengujian
        // SMA 12 = 47.86%, SMA 9 = 79.24%, SMA 6 = 92.95%
        $mape12 = 47.86;
        $mape9 = 79.24;
        $mape6 = 92.95;

        $totalInverseMAPE = (1 / $mape12) + (1 / $mape9) + (1 / $mape6);

        $bobot12 = (1 / $mape12) / $totalInverseMAPE; // ~53.3%
        $bobot9 = (1 / $mape9) / $totalInverseMAPE;   // ~32.2%
        $bobot6 = (1 / $mape6) / $totalInverseMAPE;   // ~14.5%

        return ($sma6 * $bobot6) + ($sma9 * $bobot9) + ($sma12 * $bobot12);
    }

    /**
     * Prediksi SMA standar
     */
    private function prediksiSMAFinal(array $data, int $periodeSMA): float
    {
        $jumlahData = count($data);

        if ($jumlahData < $periodeSMA) {
            throw new \Exception('Jumlah data tidak cukup untuk menghitung SMA.');
        }

        $total = 0;
        for ($i = 1; $i <= $periodeSMA; $i++) {
            $total += $data[$jumlahData - $i]['total_pendapatan'];
        }

        return $total / $periodeSMA;
    }

    /**
     * [MODIFIED] Evaluasi SMA dengan berbagai strategi
     */
    private function evaluasiSMA(
        array $train,
        array $test,
        $periodeSMA,
        array $indeksMusiman,
        string $strategi = 'standard'
    ): array {
        $trainDeseason = $this->deseasonalisasiLog($train, $indeksMusiman);
        $testDeseason = $this->deseasonalisasiLog($test, $indeksMusiman);

        $history = $trainDeseason;
        $hasilEvaluasi = [];

        foreach ($testDeseason as $i => $rowDeseason) {
            $rowAsliLog = $test[$i];

            try {
                switch ($strategi) {
                    case 'dual':
                        $prediksiDeseasonLog = $this->prediksiDualSMA($history, $rowAsliLog['bulan']);
                        break;
                    case 'ensemble':
                        $prediksiDeseasonLog = $this->prediksiEnsembleSMA($history);
                        break;
                    default: // standard
                        $prediksiDeseasonLog = $this->prediksiSMAFinal($history, (int) $periodeSMA);
                }
            } catch (\Exception $e) {
                $history[] = $rowDeseason;
                continue;
            }

            $idx = $indeksMusiman[$rowAsliLog['bulan']] ?? 0.0;
            $prediksi = exp($prediksiDeseasonLog + $idx) - 1;
            $aktual = exp($rowAsliLog['total_pendapatan']) - 1;

            $hasilEvaluasi[] = [
                'tahun' => $rowAsliLog['tahun'],
                'bulan' => $rowAsliLog['bulan'],
                'aktual' => round($aktual, 2),
                'prediksi' => round($prediksi, 2),
                'error' => round($aktual - $prediksi, 2),
                // Jika nilai aktual terlalu kecil (< 100.000 misalnya), batasi penulisan APE agar tidak bias
                'absolute_percentage_error' => $aktual > 100000
                    ? round((abs($aktual - $prediksi) / $aktual) * 100, 2)
                    : round((abs($aktual - $prediksi) / max($aktual, 1)) * 100, 2),
            ];

            $history[] = $rowDeseason;
        }

        return $hasilEvaluasi;
    }

    /**
     * Deskripsi rumus berdasarkan strategi
     */
    private function getRumusDeskripsi(string $strategi): string
    {
        switch ($strategi) {
            case 'Dual Period SMA':
                return 'Dual SMA Strategy: SMA 3 untuk high season (Jun-Sep), SMA 12 untuk low season (Okt-Feb), SMA 6 untuk transisi (Mar-Mei). Diterapkan pada data hasil preprocessing.';
            case 'Ensemble SMA':
                return 'Ensemble SMA = (SMA6 × 14.5%) + (SMA9 × 32.2%) + (SMA12 × 53.3%). Bobot berdasarkan inverse MAPE historis. Diterapkan pada data hasil preprocessing.';
            default:
                return 'F_t = (A_{t-1} + ... + A_{t-n}) / n, diterapkan pada data hasil log(x+1) yang sudah dideseasonalisasi dengan weighted seasonal index. Hasil direseasonalisasi lalu ditransformasi balik dengan exp(x) - 1.';
        }
    }

    /**
     * Menghitung MAPE
     */
    private function hitungMAPE(array $evaluasi): float
    {
        $totalAbsoluteError = 0;
        $totalAktual = 0;
        $jumlahValid = 0;

        foreach ($evaluasi as $row) {
            // Kita tetap hitung jika aktual nol/kecil karena pembagian dilakukan di akhir pembungkus
            $totalAbsoluteError += abs($row['aktual'] - $row['prediksi']);
            $totalAktual += abs($row['aktual']);
            $jumlahValid++;
        }

        // Proteksi jika total data aktual bernilai 0 semua
        if ($jumlahValid === 0 || $totalAktual == 0) {
            return 0.0;
        }

        // Rumus wMAPE: (Sum of |Aktual - Prediksi| / Sum of Aktual) * 100
        return round(($totalAbsoluteError / $totalAktual) * 100, 2);
    }

    /**
     * Standar deviasi
     */
    private function hitungStdDev(array $data): float
    {
        if (empty($data))
            return 0;

        $mean = array_sum($data) / count($data);
        $squaredDiffs = array_map(fn($x) => pow($x - $mean, 2), $data);
        $variance = array_sum($squaredDiffs) / count($squaredDiffs);
        return sqrt($variance);
    }

    /**
     * Median
     */
    private function median(array $values): float
    {
        $count = count($values);
        if ($count === 0) {
            return 0.0;
        }

        sort($values);
        $mid = (int) floor($count / 2);

        if ($count % 2 === 0) {
            return ((float) $values[$mid - 1] + (float) $values[$mid]) / 2;
        }

        return (float) $values[$mid];
    }

    /**
     * Ambil data historis dengan prioritas data aktual
     */
    private function ambilDataHistorisBulananPrioritas(
        int $idJenisPajak,
        Carbon $startDate,
        Carbon $endDate
    ): array {
        return DataPajak::where('id_jenis_pajak', $idJenisPajak)
            ->whereBetween('tanggal_pajak', [$startDate, $endDate])
            ->orderBy('tanggal_pajak', 'asc')
            ->get()
            ->groupBy(function ($item) {
                return Carbon::parse($item->tanggal_pajak)->format('Y-m');
            })
            ->map(function ($items, $periode) {
                $dataAktual = $items->where('sumber_data', 'aktual');

                if ($dataAktual->count() > 0) {
                    $totalPendapatan = $dataAktual->sum('jumlah_pendapatan');
                    $sumberData = 'aktual';
                } else {
                    $dataPrediksi = $items->where('sumber_data', 'prediksi');

                    if ($dataPrediksi->count() === 0) {
                        return null;
                    }

                    $totalPendapatan = $dataPrediksi->sum('jumlah_pendapatan');
                    $sumberData = 'prediksi';
                }

                [$tahun, $bulan] = explode('-', $periode);

                return [
                    'tahun' => (int) $tahun,
                    'bulan' => (int) $bulan,
                    'total_pendapatan' => (float) $totalPendapatan,
                    'sumber_data' => $sumberData,
                ];
            })
            ->filter()
            ->sortBy(function ($item) {
                return $item['tahun'] . '-' . str_pad($item['bulan'], 2, '0', STR_PAD_LEFT);
            })
            ->values()
            ->toArray();
    }

    /**
     * Prediksi multi-tahun real-time
     */
    public function prediksiMultiTahun(
        int $idJenisPajak,
        int $idModel,
        int $tahunMulai,
        int $tahunSelesai
    ): array {
        if ($tahunMulai > $tahunSelesai) {
            throw new \Exception('Tahun mulai tidak boleh lebih besar dari tahun selesai.');
        }

        $hasilPerTahun = [];
        $ringkasan = [];
        $totalBerhasil = 0;
        $totalGagal = 0;

        for ($tahun = $tahunMulai; $tahun <= $tahunSelesai; $tahun++) {
            $totalTahunan = 0;
            $prediksiBulanan = [];
            $mapeTahunan = 0;
            $modelTahunan = '';
            $jumlahBerhasilBulan = 0;
            $jumlahGagalBulan = 0;

            for ($bulan = 1; $bulan <= 12; $bulan++) {
                $periode = sprintf('%d-%02d-01', $tahun, $bulan);
                $periodeCarbon = Carbon::parse($periode);

                try {
                    $result = $this->prediksiSMA5TahunBulanan(
                        idJenisPajak: $idJenisPajak,
                        idModel: $idModel,
                        periodePrediksi: $periode,
                    );

                    $nilaiPrediksi = (float) $result['nilai_prediksi'];
                    $mape = (float) ($result['model_terbaik']['mape'] ?? 0);
                    $model = $result['model_terbaik']['model'] ?? '-';

                    $prediksiBulanan[] = [
                        'bulan' => $bulan,
                        'nama_bulan' => $this->namaBulanIndonesia($bulan),
                        'periode' => $periode,
                        'nilai_prediksi' => round($nilaiPrediksi, 2),
                        'mape' => round($mape, 2),
                        'model' => $model,
                        'status' => $periodeCarbon->year <= now()->year ? 'Testing' : 'Prediksi',
                        'keterangan' => 'Berhasil dihitung dengan SMA + Optimasi Preprocessing.',
                    ];

                    $totalTahunan += $nilaiPrediksi;
                    $mapeTahunan += $mape;
                    $modelTahunan = $model;
                    $totalBerhasil++;
                    $jumlahBerhasilBulan++;
                } catch (\Exception $e) {
                    $prediksiBulanan[] = [
                        'bulan' => $bulan,
                        'nama_bulan' => $this->namaBulanIndonesia($bulan),
                        'periode' => $periode,
                        'nilai_prediksi' => null,
                        'mape' => null,
                        'model' => null,
                        'status' => 'Gagal',
                        'error' => $e->getMessage(),
                    ];

                    $totalGagal++;
                    $jumlahGagalBulan++;
                }
            }

            $hasilPerTahun[(string) $tahun] = $prediksiBulanan;

            if ($jumlahBerhasilBulan > 0) {
                $ringkasan[] = [
                    'tahun' => (string) $tahun,
                    'total_prediksi' => round($totalTahunan, 2),
                    'rata_rata_bulan' => round($totalTahunan / $jumlahBerhasilBulan, 2),
                    'mape' => round($mapeTahunan / $jumlahBerhasilBulan, 2),
                    'model' => $modelTahunan,
                    'status' => $tahun <= now()->year ? 'Testing' : 'Prediksi',
                    'jumlah_bulan_berhasil' => $jumlahBerhasilBulan,
                    'jumlah_bulan_gagal' => $jumlahGagalBulan,
                    'keterangan' => 'Ringkasan prediksi tahunan dengan SMA + Optimasi Preprocessing.',
                ];
            } else {
                $ringkasan[] = [
                    'tahun' => (string) $tahun,
                    'total_prediksi' => 0,
                    'rata_rata_bulan' => 0,
                    'mape' => 0,
                    'model' => null,
                    'status' => 'Gagal',
                    'jumlah_bulan_berhasil' => 0,
                    'jumlah_bulan_gagal' => $jumlahGagalBulan,
                    'keterangan' => 'Tidak ada bulan yang berhasil diprediksi pada tahun ini.',
                ];
            }
        }

        return [
            'detail_per_bulan' => $hasilPerTahun,
            'ringkasan_per_tahun' => $ringkasan,
            'meta' => [
                'id_jenis_pajak' => $idJenisPajak,
                'id_model' => $idModel,
                'tahun_mulai' => $tahunMulai,
                'tahun_selesai' => $tahunSelesai,
                'total_berhasil' => $totalBerhasil,
                'total_gagal' => $totalGagal,
                'metode' => 'SMA + Optimasi Preprocessing',
                'optimasi_aktif' => [
                    'weighted_seasonal' => $this->gunakanWeightedSeasonal,
                    'dual_sma' => $this->gunakanDualSMA,
                    'ensemble_sma' => $this->gunakanEnsembleSMA,
                ],
                'keterangan' => 'Prediksi dengan SMA yang dioptimasi menggunakan preprocessing adaptif.',
            ],
        ];
    }

    /**
     * Helper untuk nama bulan
     */
    private function namaBulanIndonesia(int $bulan): string
    {
        $namaBulan = [
            1 => 'Januari',
            2 => 'Februari',
            3 => 'Maret',
            4 => 'April',
            5 => 'Mei',
            6 => 'Juni',
            7 => 'Juli',
            8 => 'Agustus',
            9 => 'September',
            10 => 'Oktober',
            11 => 'November',
            12 => 'Desember',
        ];

        return $namaBulan[$bulan] ?? '-';
    }
}
