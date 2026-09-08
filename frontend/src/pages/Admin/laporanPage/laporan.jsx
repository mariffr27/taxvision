import React, { useEffect, useMemo, useState } from 'react'
import TableData from '../../../components/admin/TableData'
import Button from '../../../components/common/Button'
import { getJenisPajak } from '../../../services/jenisPajakService'
import { getLaporan } from '../../../services/laporanService'
import './Laporan.css'

const jenisLaporanOptions = [
    { value: 'rekap_data_pajak', label: 'Rekap Data Pajak' },
    { value: 'hasil_prediksi', label: 'Hasil Prediksi' },
    { value: 'aktual_vs_prediksi', label: 'Aktual vs Prediksi' },
    { value: 'prediksi_tahunan', label: 'Prediksi Tahunan' },
]

const initialFilter = {
    jenis_laporan: 'rekap_data_pajak',
    id_jenis_pajak: '',
    tahun_mulai: '2020',
    tahun_selesai: '2025',
}

export default function Laporan() {
    const [filter, setFilter] = useState(initialFilter)
    const [jenisPajak, setJenisPajak] = useState([])
    const [laporan, setLaporan] = useState(null)
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState(null)

    useEffect(() => {
        loadJenisPajak()
        loadLaporan(initialFilter)
    }, [])

    useEffect(() => {
        if (!toast) return
        const timer = setTimeout(() => setToast(null), 4000)
        return () => clearTimeout(timer)
    }, [toast])

    const showToast = (type, text) => {
        setToast({ type, text })
    }

    const loadJenisPajak = async () => {
        try {
            const response = await getJenisPajak()
            setJenisPajak(response.data || [])
        } catch (err) {
            console.error(err)
        }
    }

    const loadLaporan = async (params = filter) => {
        try {
            setLoading(true)
            const response = await getLaporan(params)
            setLaporan(response.data)
        } catch (err) {
            showToast('error', err.message || 'Gagal memuat laporan')
        } finally {
            setLoading(false)
        }
    }

    const handleFilterChange = (e) => {
        const { name, value } = e.target
        setFilter((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        loadLaporan(filter)
    }

    const handleReset = () => {
        setFilter(initialFilter)
        loadLaporan(initialFilter)
    }

    const formatRupiah = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(value || 0))
    }

    const formatPercent = (value) => {
        if (value === null || value === undefined) return '-'
        return `${Number(value).toFixed(2)}%`
    }

    const formatDate = (dateString) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
    }

    const getNamaBulan = (bulan) => {
        const namaBulan = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
        ]

        return namaBulan[Number(bulan) - 1] || '-'
    }

    const rows = laporan?.rows || []
    const ringkasan = laporan?.ringkasan || {}

    const columns = useMemo(() => {
        switch (filter.jenis_laporan) {
            case 'hasil_prediksi':
                return [
                    { key: 'periode', label: 'Periode' },
                    { key: 'nama_pajak', label: 'Jenis Pajak' },
                    { key: 'nama_model', label: 'Model' },
                    {
                        key: 'nilai_prediksi',
                        label: 'Nilai Prediksi',
                        render: (item) => formatRupiah(item.nilai_prediksi),
                    },
                    { key: 'metode_akurasi', label: 'Metode Akurasi' },
                    {
                        key: 'nilai_akurasi',
                        label: 'Nilai Akurasi',
                        render: (item) => formatPercent(item.nilai_akurasi),
                    },
                    {
                        key: 'created_at',
                        label: 'Dibuat',
                        render: (item) => formatDate(item.created_at),
                    },
                ]

            case 'aktual_vs_prediksi':
                return [
                    { key: 'periode', label: 'Periode' },
                    {
                        key: 'aktual',
                        label: 'Aktual',
                        render: (item) => formatRupiah(item.aktual),
                    },
                    {
                        key: 'prediksi',
                        label: 'Prediksi',
                        render: (item) => formatRupiah(item.prediksi),
                    },
                    {
                        key: 'selisih',
                        label: 'Selisih',
                        render: (item) => formatRupiah(item.selisih),
                    },
                    {
                        key: 'error_persen',
                        label: 'Error',
                        render: (item) => formatPercent(item.error_persen),
                    },
                    { key: 'status', label: 'Status' },
                ]

            case 'prediksi_tahunan':
                return [
                    { key: 'tahun', label: 'Tahun' },
                    {
                        key: 'total_prediksi',
                        label: 'Total Prediksi',
                        render: (item) => formatRupiah(item.total_prediksi),
                    },
                    {
                        key: 'rata_rata_bulanan',
                        label: 'Rata-rata Bulanan',
                        render: (item) => formatRupiah(item.rata_rata_bulanan),
                    },
                    { key: 'jumlah_bulan', label: 'Jumlah Bulan' },
                ]

            default:
                return [
                    { key: 'periode', label: 'Periode' },
                    {
                        key: 'bulan',
                        label: 'Bulan',
                        render: (item) => getNamaBulan(item.bulan),
                    },
                    { key: 'tahun', label: 'Tahun' },
                    { key: 'nama_pajak', label: 'Jenis Pajak' },
                    { key: 'sumber_data', label: 'Sumber Data' },
                    {
                        key: 'total_pendapatan',
                        label: 'Total Pendapatan',
                        render: (item) => formatRupiah(item.total_pendapatan),
                    },
                    { key: 'jumlah_data', label: 'Jumlah Data' },
                ]
        }
    }, [filter.jenis_laporan])

    const summaryCards = useMemo(() => {
        switch (filter.jenis_laporan) {
            case 'hasil_prediksi':
                return [
                    { label: 'Jumlah Prediksi', value: ringkasan.jumlah_prediksi || 0 },
                    { label: 'Total Prediksi', value: formatRupiah(ringkasan.total_prediksi) },
                    { label: 'Rata-rata Prediksi', value: formatRupiah(ringkasan.rata_rata_prediksi) },
                    { label: 'Rata-rata Akurasi', value: formatPercent(ringkasan.rata_rata_akurasi) },
                ]

            case 'aktual_vs_prediksi':
                return [
                    { label: 'Jumlah Periode', value: ringkasan.jumlah_periode || 0 },
                    { label: 'Total Aktual', value: formatRupiah(ringkasan.total_aktual) },
                    { label: 'Total Prediksi', value: formatRupiah(ringkasan.total_prediksi) },
                    { label: 'Rata-rata Error', value: formatPercent(ringkasan.rata_rata_error) },
                ]

            case 'prediksi_tahunan':
                return [
                    { label: 'Jumlah Tahun', value: ringkasan.jumlah_tahun || 0 },
                    { label: 'Total Prediksi', value: formatRupiah(ringkasan.total_prediksi) },
                    { label: 'Rata-rata Tahunan', value: formatRupiah(ringkasan.rata_rata_tahunan) },
                    { label: 'Jumlah Baris', value: rows.length },
                ]

            default:
                return [
                    { label: 'Total Data', value: ringkasan.total_data || 0 },
                    { label: 'Total Pendapatan', value: formatRupiah(ringkasan.total_pendapatan) },
                    { label: 'Jumlah Baris', value: ringkasan.jumlah_baris || 0 },
                    { label: 'Periode', value: `${filter.tahun_mulai} - ${filter.tahun_selesai}` },
                ]
        }
    }, [filter.jenis_laporan, ringkasan, rows.length])

    const exportCsv = () => {
        if (!rows.length) {
            showToast('error', 'Tidak ada data untuk diexport')
            return
        }

        const headers = columns.map((column) => column.label)
        const csvRows = rows.map((item) => {
            return columns.map((column) => {
                const rawValue = item[column.key]
                const value = rawValue === null || rawValue === undefined ? '' : String(rawValue)
                return `"${value.replaceAll('"', '""')}"`
            }).join(',')
        })

        const csvContent = [headers.join(','), ...csvRows].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.download = `laporan-${filter.jenis_laporan}-${filter.tahun_mulai}-${filter.tahun_selesai}.csv`
        link.click()

        URL.revokeObjectURL(url)
    }

    const cetakLaporan = () => {
        window.print()
    }

    return (
        <div className="laporan-page">
            <div className="laporan-header">
                <div>
                    <h2>Laporan</h2>
                    <p>Rekap data pajak, hasil prediksi, dan perbandingan aktual dengan prediksi.</p>
                </div>

                <div className="laporan-actions">
                    <Button variant="secondary" onClick={exportCsv}>
                        Export Excel
                    </Button>
                    <Button variant="primary" onClick={cetakLaporan}>
                        Cetak
                    </Button>
                </div>
            </div>

            <form className="laporan-filter" onSubmit={handleSubmit}>
                <div className="laporan-filter-field">
                    <label>Jenis Laporan</label>
                    <select
                        name="jenis_laporan"
                        value={filter.jenis_laporan}
                        onChange={handleFilterChange}
                    >
                        {jenisLaporanOptions.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="laporan-filter-field">
                    <label>Jenis Pajak</label>
                    <select
                        name="id_jenis_pajak"
                        value={filter.id_jenis_pajak}
                        onChange={handleFilterChange}
                    >
                        <option value="">Semua jenis pajak</option>
                        {jenisPajak.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.nama_pajak}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="laporan-filter-field">
                    <label>Tahun Mulai</label>
                    <input
                        type="number"
                        name="tahun_mulai"
                        value={filter.tahun_mulai}
                        onChange={handleFilterChange}
                    />
                </div>

                <div className="laporan-filter-field">
                    <label>Tahun Selesai</label>
                    <input
                        type="number"
                        name="tahun_selesai"
                        value={filter.tahun_selesai}
                        onChange={handleFilterChange}
                    />
                </div>

                <div className="laporan-filter-actions">
                    <Button type="submit" variant="primary">
                        Tampilkan
                    </Button>
                    <Button type="button" variant="secondary" onClick={handleReset}>
                        Reset
                    </Button>
                </div>
            </form>

            <div className="laporan-print-area">
                <div className="laporan-title-box">
                    <h3>{laporan?.judul || 'Laporan'}</h3>
                    <p>
                        Periode {filter.tahun_mulai} - {filter.tahun_selesai}
                    </p>
                </div>

                <div className="laporan-summary">
                    {summaryCards.map((item, index) => (
                        <div className="laporan-summary-card" key={index}>
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                        </div>
                    ))}
                </div>

                <TableData
                    columns={columns}
                    data={rows}
                    loading={loading}
                    emptyMessage="Data laporan tidak tersedia"
                />
            </div>

            {toast && (
                <div className={`laporan-toast laporan-toast-${toast.type}`}>
                    <span>{toast.text}</span>
                    <button type="button" onClick={() => setToast(null)}>
                        ×
                    </button>
                </div>
            )}
        </div>
    )
}