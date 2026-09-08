<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LaporanController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'jenis_laporan' => 'nullable|string|in:rekap_data_pajak,hasil_prediksi,aktual_vs_prediksi,prediksi_tahunan',
            'id_jenis_pajak' => 'nullable|integer|exists:jenis_pajaks,id',
            'tahun_mulai' => 'nullable|integer|min:2000|max:2100',
            'tahun_selesai' => 'nullable|integer|min:2000|max:2100',
        ]);

        $jenisLaporan = $request->jenis_laporan ?? 'rekap_data_pajak';
        $idJenisPajak = $request->id_jenis_pajak;
        $tahunMulai = $request->tahun_mulai ?? now()->year - 5;
        $tahunSelesai = $request->tahun_selesai ?? now()->year;

        if ($tahunMulai > $tahunSelesai) {
            return response()->json([
                'success' => false,
                'message' => 'Tahun mulai tidak boleh lebih besar dari tahun selesai.',
            ], 422);
        }

        $filter = [
            'jenis_laporan' => $jenisLaporan,
            'id_jenis_pajak' => $idJenisPajak,
            'tahun_mulai' => (int) $tahunMulai,
            'tahun_selesai' => (int) $tahunSelesai,
        ];

        $data = match ($jenisLaporan) {
            'hasil_prediksi' => $this->hasilPrediksi($filter),
            'aktual_vs_prediksi' => $this->aktualVsPrediksi($filter),
            'prediksi_tahunan' => $this->prediksiTahunan($filter),
            default => $this->rekapDataPajak($filter),
        };

        return response()->json([
            'success' => true,
            'message' => 'Laporan berhasil diambil.',
            'data' => [
                'filter' => $filter,
                'jenis_laporan' => $jenisLaporan,
                'judul' => $this->judulLaporan($jenisLaporan),
                'ringkasan' => $data['ringkasan'],
                'rows' => $data['rows'],
            ],
        ]);
    }

    private function rekapDataPajak(array $filter): array
    {
        $query = DB::table('data_pajaks')
            ->leftJoin('jenis_pajaks', 'jenis_pajaks.id', '=', 'data_pajaks.id_jenis_pajak')
            ->whereYear('data_pajaks.tanggal_pajak', '>=', $filter['tahun_mulai'])
            ->whereYear('data_pajaks.tanggal_pajak', '<=', $filter['tahun_selesai']);

        if (!empty($filter['id_jenis_pajak'])) {
            $query->where('data_pajaks.id_jenis_pajak', $filter['id_jenis_pajak']);
        }

        $rows = $query
            ->selectRaw('
                YEAR(data_pajaks.tanggal_pajak) as tahun,
                MONTH(data_pajaks.tanggal_pajak) as bulan,
                data_pajaks.id_jenis_pajak,
                COALESCE(jenis_pajaks.nama_pajak, "-") as nama_pajak,
                COALESCE(data_pajaks.sumber_data, "aktual") as sumber_data,
                SUM(data_pajaks.jumlah_pendapatan) as total_pendapatan,
                COUNT(data_pajaks.id) as jumlah_data
            ')
            ->groupByRaw('
                YEAR(data_pajaks.tanggal_pajak),
                MONTH(data_pajaks.tanggal_pajak),
                data_pajaks.id_jenis_pajak,
                jenis_pajaks.nama_pajak,
                data_pajaks.sumber_data
            ')
            ->orderBy('tahun')
            ->orderBy('bulan')
            ->get()
            ->map(fn($item) => [
                'tahun' => (int) $item->tahun,
                'bulan' => (int) $item->bulan,
                'periode' => sprintf('%d-%02d', $item->tahun, $item->bulan),
                'id_jenis_pajak' => (int) $item->id_jenis_pajak,
                'nama_pajak' => $item->nama_pajak,
                'sumber_data' => $item->sumber_data,
                'total_pendapatan' => (float) $item->total_pendapatan,
                'jumlah_data' => (int) $item->jumlah_data,
            ])
            ->values();

        return [
            'ringkasan' => [
                'total_data' => $rows->sum('jumlah_data'),
                'total_pendapatan' => round($rows->sum('total_pendapatan'), 2),
                'jumlah_baris' => $rows->count(),
            ],
            'rows' => $rows,
        ];
    }

    private function hasilPrediksi(array $filter): array
    {
        $query = DB::table('hasil_prediksis')
            ->leftJoin('jenis_pajaks', 'jenis_pajaks.id', '=', 'hasil_prediksis.id_jenis_pajak')
            ->leftJoin('model_prediksis', 'model_prediksis.id', '=', 'hasil_prediksis.id_model')
            ->whereYear('hasil_prediksis.perioda_prediksi', '>=', $filter['tahun_mulai'])
            ->whereYear('hasil_prediksis.perioda_prediksi', '<=', $filter['tahun_selesai']);

        if (!empty($filter['id_jenis_pajak'])) {
            $query->where('hasil_prediksis.id_jenis_pajak', $filter['id_jenis_pajak']);
        }

        $rows = $query
            ->select([
                'hasil_prediksis.id',
                'hasil_prediksis.id_jenis_pajak',
                'jenis_pajaks.nama_pajak',
                'model_prediksis.nama_model',
                'hasil_prediksis.perioda_prediksi',
                'hasil_prediksis.nilai_prediksi',
                'hasil_prediksis.metode_akurasi',
                'hasil_prediksis.nilai_akurasi',
                'hasil_prediksis.created_at',
            ])
            ->orderBy('hasil_prediksis.perioda_prediksi')
            ->get()
            ->map(fn($item) => [
                'id' => (int) $item->id,
                'periode' => Carbon::parse($item->perioda_prediksi)->format('Y-m'),
                'perioda_prediksi' => $item->perioda_prediksi,
                'id_jenis_pajak' => (int) $item->id_jenis_pajak,
                'nama_pajak' => $item->nama_pajak ?? '-',
                'nama_model' => $item->nama_model ?? '-',
                'nilai_prediksi' => (float) $item->nilai_prediksi,
                'metode_akurasi' => $item->metode_akurasi,
                'nilai_akurasi' => (float) $item->nilai_akurasi,
                'created_at' => $item->created_at,
            ])
            ->values();

        return [
            'ringkasan' => [
                'jumlah_prediksi' => $rows->count(),
                'total_prediksi' => round($rows->sum('nilai_prediksi'), 2),
                'rata_rata_prediksi' => $rows->count() > 0
                    ? round($rows->avg('nilai_prediksi'), 2)
                    : 0,
                'rata_rata_akurasi' => $rows->count() > 0
                    ? round($rows->avg('nilai_akurasi'), 2)
                    : 0,
            ],
            'rows' => $rows,
        ];
    }

    private function aktualVsPrediksi(array $filter): array
    {
        $aktualQuery = DB::table('data_pajaks')
            ->where('sumber_data', 'aktual')
            ->whereYear('tanggal_pajak', '>=', $filter['tahun_mulai'])
            ->whereYear('tanggal_pajak', '<=', $filter['tahun_selesai']);

        $prediksiQuery = DB::table('data_pajaks')
            ->where('sumber_data', 'prediksi')
            ->whereYear('tanggal_pajak', '>=', $filter['tahun_mulai'])
            ->whereYear('tanggal_pajak', '<=', $filter['tahun_selesai']);

        if (!empty($filter['id_jenis_pajak'])) {
            $aktualQuery->where('id_jenis_pajak', $filter['id_jenis_pajak']);
            $prediksiQuery->where('id_jenis_pajak', $filter['id_jenis_pajak']);
        }

        $aktual = $aktualQuery
            ->selectRaw('DATE_FORMAT(tanggal_pajak, "%Y-%m") as periode, SUM(jumlah_pendapatan) as total_aktual')
            ->groupByRaw('DATE_FORMAT(tanggal_pajak, "%Y-%m")')
            ->pluck('total_aktual', 'periode');

        $prediksi = $prediksiQuery
            ->selectRaw('DATE_FORMAT(tanggal_pajak, "%Y-%m") as periode, SUM(jumlah_pendapatan) as total_prediksi')
            ->groupByRaw('DATE_FORMAT(tanggal_pajak, "%Y-%m")')
            ->pluck('total_prediksi', 'periode');

        $periodeGabungan = collect($aktual->keys())
            ->merge($prediksi->keys())
            ->unique()
            ->sort()
            ->values();

        $rows = $periodeGabungan->map(function ($periode) use ($aktual, $prediksi) {
            $nilaiAktual = (float) ($aktual[$periode] ?? 0);
            $nilaiPrediksi = (float) ($prediksi[$periode] ?? 0);
            $selisih = $nilaiAktual - $nilaiPrediksi;

            $errorPersen = $nilaiAktual > 0
                ? round((abs($selisih) / $nilaiAktual) * 100, 2)
                : null;

            return [
                'periode' => $periode,
                'aktual' => $nilaiAktual,
                'prediksi' => $nilaiPrediksi,
                'selisih' => round($selisih, 2),
                'error_persen' => $errorPersen,
                'status' => $nilaiAktual > 0 && $nilaiPrediksi > 0
                    ? 'Dapat Dibandingkan'
                    : 'Belum Lengkap',
            ];
        });

        $rowsValid = $rows->filter(fn($row) => $row['error_persen'] !== null);

        return [
            'ringkasan' => [
                'jumlah_periode' => $rows->count(),
                'total_aktual' => round($rows->sum('aktual'), 2),
                'total_prediksi' => round($rows->sum('prediksi'), 2),
                'rata_rata_error' => $rowsValid->count() > 0
                    ? round($rowsValid->avg('error_persen'), 2)
                    : 0,
            ],
            'rows' => $rows,
        ];
    }

    private function prediksiTahunan(array $filter): array
    {
        $query = DB::table('data_pajaks')
            ->where('sumber_data', 'prediksi')
            ->whereYear('tanggal_pajak', '>=', $filter['tahun_mulai'])
            ->whereYear('tanggal_pajak', '<=', $filter['tahun_selesai']);

        if (!empty($filter['id_jenis_pajak'])) {
            $query->where('id_jenis_pajak', $filter['id_jenis_pajak']);
        }

        $rows = $query
            ->selectRaw('
                YEAR(tanggal_pajak) as tahun,
                SUM(jumlah_pendapatan) as total_prediksi,
                AVG(jumlah_pendapatan) as rata_rata_bulanan,
                COUNT(id) as jumlah_bulan
            ')
            ->groupByRaw('YEAR(tanggal_pajak)')
            ->orderBy('tahun')
            ->get()
            ->map(fn($item) => [
                'tahun' => (int) $item->tahun,
                'total_prediksi' => (float) $item->total_prediksi,
                'rata_rata_bulanan' => (float) $item->rata_rata_bulanan,
                'jumlah_bulan' => (int) $item->jumlah_bulan,
            ])
            ->values();

        return [
            'ringkasan' => [
                'jumlah_tahun' => $rows->count(),
                'total_prediksi' => round($rows->sum('total_prediksi'), 2),
                'rata_rata_tahunan' => $rows->count() > 0
                    ? round($rows->avg('total_prediksi'), 2)
                    : 0,
            ],
            'rows' => $rows,
        ];
    }

    private function judulLaporan(string $jenisLaporan): string
    {
        return match ($jenisLaporan) {
            'hasil_prediksi' => 'Laporan Hasil Prediksi',
            'aktual_vs_prediksi' => 'Laporan Aktual vs Prediksi',
            'prediksi_tahunan' => 'Laporan Prediksi Tahunan',
            default => 'Laporan Rekap Data Pajak',
        };
    }
}
