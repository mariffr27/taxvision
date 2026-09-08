import React, { useEffect, useMemo, useState } from 'react'
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Modal from '../../../components/common/Modal'
import { getJenisPajak } from '../../../services/jenisPajakService'
import { getModelPrediksi } from '../../../services/modelPrediksiService'
import {
    getDetailPrediksi,
    getPrediksiMultiTahun,
    postPrediksiMultiTahun,
    postPrediksiSma,
} from '../../../services/prediksiService'
import './Prediksi.css'

const currentYear = new Date().getFullYear()

const MODE = {
    WIZARD: 'wizard',
    RIWAYAT: 'riwayat',
}

const STEPS = [
    { key: 1, label: 'Jenis Pajak & Model' },
    { key: 2, label: 'Metode Prediksi' },
    { key: 3, label: 'Hasil' },
]

// Batas periode SMA yang diuji otomatis oleh backend (PrediksiService::prediksiSMA5TahunBulanan).
// Kalau batas ini berubah di backend, ubah juga di sini supaya teks penjelasan tetap akurat.
const SMA_PERIODE_MIN = 2
const SMA_PERIODE_MAX = 12

const METHODS = [
    {
        key: 'sma',
        label: 'SMA Bulanan',
        description: 'Prediksi satu bulan ke depan dengan Simple Moving Average.',
        kapanDipakai: `Cocok kalau kamu hanya butuh tahu perkiraan SATU bulan tertentu ke depan, misalnya bulan depan saja. Sistem otomatis mencoba periode SMA ${SMA_PERIODE_MIN}\u2013${SMA_PERIODE_MAX} bulan dan memilih yang paling akurat (MAPE terkecil).`,
    },
    {
        key: 'multi',
        label: 'Multi Tahun',
        description: 'Proyeksi penerimaan pajak untuk beberapa tahun ke depan sekaligus.',
        kapanDipakai: 'Cocok kalau kamu butuh gambaran BEBERAPA TAHUN sekaligus, misalnya untuk perencanaan anggaran jangka panjang. Setiap bulan dihitung berurutan (rolling forecast) menggunakan metode yang sama seperti SMA Bulanan.',
    },
]

const initialContextForm = {
    id_jenis_pajak: '',
    id_model: '',
}

// Catatan: backend (PrediksiService::prediksiSMA5TahunBulanan) TIDAK menerima parameter
// periode_sma dan SELALU memakai MAPE sebagai metode_akurasi (hardcoded). Oleh karena itu
// form ini tidak lagi menawarkan pilihan periode SMA manual atau metode akurasi lain,
// supaya tidak menampilkan opsi yang sebenarnya tidak berpengaruh ke hasil.
const initialSmaForm = {
    periode_prediksi: `${currentYear + 1}-01`,
}

const initialMultiForm = {
    tahun_mulai: String(currentYear + 1),
    tahun_selesai: String(currentYear + 3),
    method: 'POST',
}

const initialDetailForm = {
    id: '',
}

const TUTORIAL_STORAGE_KEY = 'prediksi_pajak_tutorial_seen'

const PROCESS_STEPS = [
    { key: 'data', label: 'Ringkasan Data & Anomali' },
    { key: 'split', label: 'Pembagian Training/Testing' },
    { key: 'compare', label: 'Perbandingan Periode SMA' },
    { key: 'best', label: 'Model Terbaik Terpilih' },
    { key: 'final', label: 'Hasil Akhir Prediksi' },
]

const PENJELASAN_AKURASI = {
    MAPE: {
        nama: 'MAPE (Mean Absolute Percentage Error)',
        awam: 'rata-rata persentase selisih antara prediksi dan kenyataan saat sistem diuji dengan data lama.',
    },
}

const getStatusMape = (mape) => {
    if (mape === null || mape === undefined || Number.isNaN(Number(mape))) {
        return { label: 'Tidak diketahui', tone: 'muted', saran: 'Data akurasi tidak tersedia untuk model ini.' }
    }
    const value = Number(mape)
    if (value < 10) {
        return {
            label: 'Sangat akurat',
            tone: 'good',
            saran: 'Prediksi ini bisa dijadikan acuan utama untuk perencanaan.',
        }
    }
    if (value < 20) {
        return {
            label: 'Cukup akurat',
            tone: 'good',
            saran: 'Prediksi ini cukup layak dipakai, tapi tetap baik untuk dibandingkan dengan pertimbangan lain.',
        }
    }
    if (value < 50) {
        return {
            label: 'Akurasi sedang',
            tone: 'warn',
            saran: 'Gunakan prediksi ini sebagai gambaran kasar saja, jangan jadi satu-satunya acuan keputusan.',
        }
    }
    return {
        label: 'Akurasi rendah',
        tone: 'bad',
        saran: 'Selisihnya cukup besar dari data historis. Sebaiknya tinjau ulang data pajak yang diinput, atau anggap hasil ini sebagai perkiraan sangat kasar.',
    }
}

const getStatusBulanTone = (status) => {
    if (status === 'Gagal') return 'gagal'
    if (status === 'Testing') return 'testing'
    if (status === 'Prediksi') return 'prediksi'
    return 'muted'
}

// ====== FUNGSI FORMAT PERIODE YANG LEBIH LENGKAP ======
const formatPeriodeRange = (rows) => {
    if (!rows || rows.length === 0) return 'Tidak ada data'

    // Ambil semua label yang valid
    const labels = rows.map(row => row.label).filter(label => label && label !== '-')
    if (labels.length === 0) return 'Tidak ada data'

    // Ambil periode pertama dan terakhir
    const firstLabel = labels[0]
    const lastLabel = labels[labels.length - 1]

    // Jika hanya 1 periode
    if (labels.length === 1) {
        return firstLabel
    }

    // Coba parse tanggal untuk format yang lebih baik
    const parseDateFromLabel = (label) => {
        // Coba format "Jan 2025" atau "Januari 2025"
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
        const monthNamesFull = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

        // Coba format "Tahun 2025"
        if (label.includes('Tahun')) {
            const yearMatch = label.match(/\d{4}/)
            if (yearMatch) {
                return { year: parseInt(yearMatch[0]), month: null, isYear: true }
            }
        }

        // Coba format "Jan 2025" atau "Januari 2025"
        for (let i = 0; i < monthNames.length; i++) {
            const regex = new RegExp(`${monthNames[i]}|${monthNamesFull[i]}`, 'i')
            if (regex.test(label)) {
                const yearMatch = label.match(/\d{4}/)
                if (yearMatch) {
                    return { year: parseInt(yearMatch[0]), month: i, isYear: false }
                }
                // Jika tidak ada tahun, coba cari di label lain atau gunakan currentYear
                const fallbackYear = new Date().getFullYear()
                return { year: fallbackYear, month: i, isYear: false }
            }
        }

        // Fallback: coba ekstrak tahun saja
        const yearMatch = label.match(/\d{4}/)
        if (yearMatch) {
            return { year: parseInt(yearMatch[0]), month: null, isYear: true }
        }

        return null
    }

    const firstDate = parseDateFromLabel(firstLabel)
    const lastDate = parseDateFromLabel(lastLabel)

    // Jika bisa parse dengan baik
    if (firstDate && lastDate && !firstDate.isYear && !lastDate.isYear) {
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
        const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

        // Jika tahun sama
        if (firstDate.year === lastDate.year) {
            return `${monthNames[firstDate.month]} ${firstDate.year} s.d. ${monthNames[lastDate.month]} ${lastDate.year}`
        }

        // Jika tahun berbeda
        return `${monthNames[firstDate.month]} ${firstDate.year} s.d. ${monthNames[lastDate.month]} ${lastDate.year}`
    }

    // Jika hanya tahun
    if (firstDate?.isYear && lastDate?.isYear) {
        if (firstDate.year === lastDate.year) {
            return `Tahun ${firstDate.year}`
        }
        return `Tahun ${firstDate.year} s.d. ${lastDate.year}`
    }

    // Fallback: gunakan label asli
    if (labels.length === 1) return firstLabel
    return `${firstLabel} s.d. ${lastLabel}`
}

export default function Prediksi() {
    const [mode, setMode] = useState(MODE.WIZARD)
    const [step, setStep] = useState(1)
    const [selectedMethod, setSelectedMethod] = useState(null)

    const [jenisPajak, setJenisPajak] = useState([])
    const [modelPrediksi, setModelPrediksi] = useState([])

    const [contextForm, setContextForm] = useState(initialContextForm)
    const [smaForm, setSmaForm] = useState(initialSmaForm)
    const [multiForm, setMultiForm] = useState(initialMultiForm)
    const [detailForm, setDetailForm] = useState(initialDetailForm)

    const [fieldErrors, setFieldErrors] = useState({})

    const [loading, setLoading] = useState(false)
    const [loadingMaster, setLoadingMaster] = useState(false)
    const [masterError, setMasterError] = useState('')

    const [toast, setToast] = useState(null)

    const [resultData, setResultData] = useState(null)
    const [isRawOpen, setIsRawOpen] = useState(false)
    const [detailResult, setDetailResult] = useState(null)

    const [isTutorialOpen, setIsTutorialOpen] = useState(false)

    const [isProcessing, setIsProcessing] = useState(false)
    const [processStepIndex, setProcessStepIndex] = useState(0)
    const [pendingResultData, setPendingResultData] = useState(null)
    const [isDataDetailOpen, setIsDataDetailOpen] = useState(false)
    const [isSplitDetailOpen, setIsSplitDetailOpen] = useState(false)

    // ====== FUNGSI HELPER DIDEKLARASIKAN DI SINI (sebelum useMemo) ======
    const formatRupiah = (value) => {
        if (value === null || value === undefined || value === '') return '-'
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(value))
    }

    const formatCompactRupiah = (value) => {
        if (value === null || value === undefined || value === '') return '-'
        const num = Number(value)
        if (Math.abs(num) >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)} M`
        if (Math.abs(num) >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)} Jt`
        return formatRupiah(num)
    }

    const formatDate = (dateString) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
    }

    const getNamaJenisPajak = (id) => {
        const item = jenisPajak.find(j => Number(j.id) === Number(id))
        return item ? item.nama_pajak : `ID ${id}`
    }

    const getNamaModel = (id) => {
        const item = modelPrediksi.find(m => Number(m.id) === Number(id))
        return item ? item.nama_model : `ID ${id}`
    }

    // ====== BUILD RESULT ROWS (dideklarasikan sebelum digunakan di useMemo) ======
    const buildResultRows = (raw) => {
        if (!raw) return []

        const data = raw?.data || raw
        const detailResponse = data?.detail_response || data?.detail?.detail_response || null
        const source = detailResponse || data

        // ====== KHUSUS RESPONSE MULTI TAHUN (rolling forecast per bulan) ======
        if (source?.detail_per_bulan && typeof source.detail_per_bulan === 'object') {
            return Object.entries(source.detail_per_bulan).flatMap(([tahun, bulanList]) => {
                if (!Array.isArray(bulanList)) return []

                return bulanList.map((item, index) => {
                    const periode = item.periode || `${tahun}-${String(item.bulan).padStart(2, '0')}-01`
                    const periodeLabel = new Date(periode).toLocaleDateString('id-ID', {
                        month: 'short',
                        year: 'numeric',
                    })

                    return {
                        id: `${tahun}-${item.bulan || index}`,
                        label: periodeLabel,
                        rawPeriod: periode,
                        nilai: item.nilai_prediksi ?? item.prediksi ?? null,
                        akurasi: item.mape ?? item.nilai_akurasi ?? null,
                        metodeAkurasi: item.mape !== undefined ? 'MAPE' : item.metode_akurasi ?? null,
                        model: item.model ?? null,
                        status: item.status ?? null,
                        error: item.error ?? null,
                    }
                })
            })
        }

        // ====== KALAU YANG ADA RINGKASAN TAHUNAN ======
        if (Array.isArray(source?.ringkasan_per_tahun)) {
            return source.ringkasan_per_tahun.map((item, index) => {
                return {
                    id: item.tahun ?? index,
                    label: item.tahun ? `Tahun ${item.tahun}` : `Baris ${index + 1}`,
                    rawPeriod: item.tahun ?? `Baris ${index + 1}`,
                    nilai: item.total_prediksi ?? item.nilai_prediksi ?? null,
                    akurasi: item.mape ?? item.nilai_akurasi ?? null,
                    metodeAkurasi: item.mape !== undefined ? 'MAPE' : null,
                    model: item.model ?? null,
                    status: item.status ?? null,
                    error: null,
                }
            })
        }

        // ====== RESPONSE SMA BULANAN / RIWAYAT BIASA ======
        let list = []

        if (Array.isArray(source)) {
            list = source
        } else if (Array.isArray(source?.data)) {
            list = source.data
        } else if (Array.isArray(source?.hasil)) {
            list = source.hasil
        } else if (Array.isArray(source?.detail)) {
            list = source.detail
        } else if (source?.detail_response && Array.isArray(source.detail_response)) {
            list = source.detail_response
        } else if (source?.prediksi && Array.isArray(source.prediksi)) {
            list = source.prediksi
        } else if (source?.results && Array.isArray(source.results)) {
            list = source.results
        } else if (source?.data_prediksi && Array.isArray(source.data_prediksi)) {
            list = source.data_prediksi
        } else if (Array.isArray(source?.model_diuji)) {
            const bestModel = source.model_terbaik
            const modelDiuji = source.model_diuji
            if (bestModel && modelDiuji) {
                const bestModelData = modelDiuji.find(m => m.model === bestModel.model)
                if (bestModelData?.evaluasi && Array.isArray(bestModelData.evaluasi)) {
                    list = bestModelData.evaluasi
                }
            }
        } else if (source && typeof source === 'object') {
            const possibleArrays = ['data', 'hasil', 'detail', 'prediksi', 'results', 'items']
            for (const key of possibleArrays) {
                if (Array.isArray(source[key]) && source[key].length > 0) {
                    list = source[key]
                    break
                }
            }
            if (list.length === 0 && source.nilai_prediksi !== undefined) {
                list = [source]
            }
        }

        if (list.length === 0 && source?.prediksi_sma) {
            const smaData = source.prediksi_sma
            if (Array.isArray(smaData)) {
                list = smaData
            } else if (smaData && typeof smaData === 'object') {
                for (const key of ['data', 'hasil', 'detail', 'prediksi']) {
                    if (Array.isArray(smaData[key])) {
                        list = smaData[key]
                        break
                    }
                }
            }
        }

        return list
            .filter((item) => item && typeof item === 'object')
            .map((item, index) => {
                const period =
                    item.periode_prediksi ||
                    item.perioda_prediksi ||
                    item.periode ||
                    item.tahun ||
                    item.bulan ||
                    `Baris ${index + 1}`

                let label = String(period)

                if (typeof period === 'string' && /^\d{4}-\d{2}$/.test(period)) {
                    label = new Date(`${period}-01`).toLocaleDateString('id-ID', {
                        month: 'short',
                        year: 'numeric',
                    })
                } else if (typeof period === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(period)) {
                    label = new Date(period).toLocaleDateString('id-ID', {
                        month: 'short',
                        year: 'numeric',
                    })
                } else if (typeof period === 'string' && /^\d{4}$/.test(period)) {
                    label = `Tahun ${period}`
                }

                const nilai =
                    item.nilai_prediksi ??
                    item.nilai ??
                    item.total_prediksi ??
                    item.prediksi ??
                    item.predicted_value ??
                    item.value ??
                    item.aktual ??
                    null

                let akurasi =
                    item.nilai_akurasi ??
                    item.mape ??
                    item.model_terbaik?.mape ??
                    item.accuracy ??
                    item.error_rate ??
                    null

                if (akurasi === null && item.mae !== undefined && item.aktual !== undefined) {
                    const actual = Number(item.aktual)
                    const pred = Number(item.prediksi || item.nilai_prediksi || 0)
                    if (actual > 0 && pred > 0) {
                        akurasi = Math.abs((pred - actual) / actual) * 100
                    }
                }

                return {
                    id: item.id ?? index,
                    label,
                    rawPeriod: period,
                    nilai: nilai,
                    akurasi: akurasi,
                    metodeAkurasi:
                        item.metode_akurasi ??
                        (item.mape !== undefined || item.model_terbaik?.mape !== undefined ? 'MAPE' : null),
                    model: item.model ?? item.model_terbaik?.model ?? null,
                    status: item.status ?? null,
                    error: item.error ?? null,
                }
            })
    }

    // ====== BUILD RINGKASAN PENJELASAN (khusus hasil SMA Bulanan) ======
    const buildRingkasanPenjelasan = (raw) => {
        if (!raw || typeof raw !== 'object') return null

        const modelTerbaik = raw.model_terbaik
        const anomali = raw.anomali
        const pembagianData = raw.pembagian_data
        const nilaiPrediksi = raw.nilai_prediksi
        const modelDiuji = raw.model_diuji
        const periodeDiuji = raw.periode_diuji
        const periodePrediksi = raw.periode_prediksi
        const periodeData = raw.periode_data

        if (!modelTerbaik) return null

        const metodeAkurasiKey = Object.keys(PENJELASAN_AKURASI).find((key) =>
            String(modelTerbaik.model || '').toUpperCase().includes(key) || key === 'MAPE',
        )

        const status = getStatusMape(modelTerbaik.mape)

        const modelDiujiList = Array.isArray(modelDiuji) ? modelDiuji : []
        const periodeDiujiList = Array.isArray(periodeDiuji) ? periodeDiuji : []
        const modelTerbaikLengkap = modelDiujiList.find((item) => item.model === modelTerbaik.model)
        const evaluasiTerbaik = Array.isArray(modelTerbaikLengkap?.evaluasi) ? modelTerbaikLengkap.evaluasi : []

        return {
            nilaiPrediksi,
            periodeData,
            jumlahDataBulanan: raw.jumlah_data_bulanan,
            periodePrediksi,
            periodeDiuji: periodeDiujiList,
            model: modelTerbaik,
            modelDiuji: modelDiujiList,
            evaluasiTerbaik,
            anomali,
            pembagianData,
            status,
            penjelasanAkurasi: PENJELASAN_AKURASI[metodeAkurasiKey] || PENJELASAN_AKURASI.MAPE,
        }
    }

    // ====== RENDER ROWS TABLE (menggunakan resultRows dari parameter) ======
    const renderRowsTable = (rows) => {
        const hasStatus = rows.some((row) => row.status)

        return (
            <div className="prediksi-table-wrap">
                <table className="prediksi-table">
                    <thead>
                        <tr>
                            <th>Periode</th>
                            <th>Nilai Prediksi</th>
                            <th>Akurasi</th>
                            {hasStatus && <th>Status</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id}>
                                <td>
                                    {/^\d{4}-\d{2}$/.test(String(row.rawPeriod))
                                        ? formatDate(`${row.rawPeriod}-01`)
                                        : row.label}
                                </td>
                                <td>{formatRupiah(row.nilai)}</td>
                                <td>
                                    {row.akurasi !== null && row.akurasi !== undefined
                                        ? `${Number(row.akurasi).toFixed(2)}%${row.metodeAkurasi ? ` (${row.metodeAkurasi})` : ''}`
                                        : '-'}
                                </td>
                                {hasStatus && (
                                    <td>
                                        <span
                                            className={`prediksi-status-badge status-${getStatusBulanTone(row.status)}`}
                                            title={row.status === 'Gagal' ? row.error || '' : ''}
                                        >
                                            {row.status || '-'}
                                        </span>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    // ====== USE MEMO (dideklarasikan setelah semua fungsi helper) ======
    const jenisPajakMap = useMemo(() => {
        const map = {}
        jenisPajak.forEach((item) => {
            map[item.id] = item.nama_pajak
        })
        return map
    }, [jenisPajak])

    const modelPrediksiMap = useMemo(() => {
        const map = {}
        modelPrediksi.forEach((item) => {
            map[item.id] = item.nama_model
        })
        return map
    }, [modelPrediksi])

    const resultRows = useMemo(() => buildResultRows(resultData), [resultData])
    const detailRows = useMemo(() => buildResultRows(detailResult), [detailResult])

    // ====== PERBAIKAN CHART: Filter data yang valid dan pastikan ada minimal 2 titik data ======
    const chartData = useMemo(() => {
        const validRows = resultRows.filter((row) =>
            row.nilai !== null &&
            row.nilai !== undefined &&
            !isNaN(Number(row.nilai))
        )

        return validRows.map((row) => ({
            name: row.label,
            nilai: Number(row.nilai)
        }))
    }, [resultRows])

    const totalNilai = useMemo(
        () => resultRows.reduce((sum, row) => sum + (Number(row.nilai) || 0), 0),
        [resultRows],
    )

    // ====== PERBAIKAN: Format periode range untuk ditampilkan ======
    const periodeRange = useMemo(() => formatPeriodeRange(resultRows), [resultRows])

    const ringkasanPenjelasan = useMemo(() => buildRingkasanPenjelasan(resultData), [resultData])
    const ringkasanProses = useMemo(() => buildRingkasanPenjelasan(pendingResultData), [pendingResultData])

    // Data multi-tahun (rolling forecast) hanya punya "meta", bukan "model_terbaik", jadi
    // dideteksi terpisah dari ringkasanPenjelasan supaya penjelasannya bisa ditampilkan sendiri.
    const ringkasanMultiTahun = useMemo(() => {
        if (!resultData || typeof resultData !== 'object') return null
        const meta = resultData.meta
        if (!meta || !Array.isArray(resultData.ringkasan_per_tahun)) return null

        return {
            meta,
            totalBulan: (meta.total_berhasil ?? 0) + (meta.total_gagal ?? 0),
        }
    }, [resultData])

    // ====== LOAD MASTER DATA ======
    const loadMasterData = async () => {
        try {
            setLoadingMaster(true)
            setMasterError('')

            const [jenisResponse, modelResponse] = await Promise.all([
                getJenisPajak(),
                getModelPrediksi(),
            ])

            setJenisPajak(jenisResponse.data || [])
            setModelPrediksi(modelResponse.data || [])
        } catch (err) {
            setMasterError(err.message || 'Gagal mengambil data jenis pajak dan model prediksi')
        } finally {
            setLoadingMaster(false)
        }
    }

    useEffect(() => {
        loadMasterData()
    }, [])

    useEffect(() => {
        try {
            const sudahLihat = window.localStorage.getItem(TUTORIAL_STORAGE_KEY)
            if (!sudahLihat) {
                setIsTutorialOpen(true)
            }
        } catch (err) {
            setIsTutorialOpen(true)
        }
    }, [])

    const closeTutorial = () => {
        setIsTutorialOpen(false)
        try {
            window.localStorage.setItem(TUTORIAL_STORAGE_KEY, '1')
        } catch (err) {
            // Aman diabaikan.
        }
    }

    useEffect(() => {
        if (!toast) return
        const timer = setTimeout(() => setToast(null), 5000)
        return () => clearTimeout(timer)
    }, [toast])

    const getValidationErrors = (err) => {
        if (!err.errors) {
            return { general: err.message || 'Terjadi kesalahan, silakan coba lagi' }
        }

        const mapped = {}
        Object.entries(err.errors).forEach(([field, messages]) => {
            mapped[field] = Array.isArray(messages) ? messages[0] : messages
        })
        return mapped
    }

    const showToast = (type, text) => setToast({ type, text })

    const resetWizard = () => {
        setStep(1)
        setSelectedMethod(null)
        setContextForm(initialContextForm)
        setSmaForm(initialSmaForm)
        setMultiForm(initialMultiForm)
        setFieldErrors({})
        setResultData(null)
        setIsRawOpen(false)
        setIsProcessing(false)
        setProcessStepIndex(0)
        setPendingResultData(null)
        setIsDataDetailOpen(false)
        setIsSplitDetailOpen(false)
    }

    const switchMode = (nextMode) => {
        setMode(nextMode)
        setFieldErrors({})
        if (nextMode === MODE.RIWAYAT) {
            setDetailResult(null)
            setDetailForm(initialDetailForm)
        }
    }

    const handleContextChange = (e) => {
        const { name, value } = e.target
        setContextForm((prev) => ({ ...prev, [name]: value }))
        setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    const handleSmaChange = (e) => {
        const { name, value } = e.target
        setSmaForm((prev) => ({ ...prev, [name]: value }))
        setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    const handleMultiChange = (e) => {
        const { name, value } = e.target
        setMultiForm((prev) => ({ ...prev, [name]: value }))
        setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    const handleDetailChange = (e) => {
        const { name, value } = e.target
        setDetailForm((prev) => ({ ...prev, [name]: value }))
        setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    // ---------- Step 1: konteks (jenis pajak + model) ----------
    const validateContext = () => {
        const errors = {}
        if (!contextForm.id_jenis_pajak) errors.id_jenis_pajak = 'Jenis pajak wajib dipilih'
        if (!contextForm.id_model) errors.id_model = 'Model prediksi wajib dipilih'
        return errors
    }

    const goToStep2 = () => {
        const errors = validateContext()
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            return
        }
        setFieldErrors({})
        setStep(2)
    }

    // ---------- Step 2: metode + parameter ----------
    const validateSma = () => {
        const errors = {}
        if (!smaForm.periode_prediksi) errors.periode_prediksi = 'Periode prediksi wajib diisi'
        return errors
    }

    const validateMulti = () => {
        const errors = {}
        if (!multiForm.tahun_mulai) errors.tahun_mulai = 'Tahun mulai wajib diisi'
        if (!multiForm.tahun_selesai) errors.tahun_selesai = 'Tahun selesai wajib diisi'
        if (
            multiForm.tahun_mulai &&
            multiForm.tahun_selesai &&
            Number(multiForm.tahun_selesai) < Number(multiForm.tahun_mulai)
        ) {
            errors.tahun_selesai = 'Tahun selesai tidak boleh lebih kecil dari tahun mulai'
        }
        return errors
    }

    const startProcessSteps = (data) => {
        setPendingResultData(data)
        setIsProcessing(true)
        setProcessStepIndex(0)
        setIsDataDetailOpen(false)
        setIsSplitDetailOpen(false)
    }

    const goToNextProcessStep = () => {
        if (processStepIndex >= PROCESS_STEPS.length - 1) {
            if (!pendingResultData) return
            setResultData(pendingResultData)
            setIsRawOpen(false)
            setIsProcessing(false)
            setPendingResultData(null)
            setStep(3)
            return
        }
        setProcessStepIndex((prev) => prev + 1)
    }

    const goToPrevProcessStep = () => {
        if (processStepIndex <= 0) {
            setIsProcessing(false)
            setPendingResultData(null)
            return
        }
        setProcessStepIndex((prev) => prev - 1)
    }

    const skipProcessAnimation = () => {
        if (!pendingResultData) return
        setResultData(pendingResultData)
        setIsRawOpen(false)
        setIsProcessing(false)
        setPendingResultData(null)
        setStep(3)
    }

    const handleSubmitSma = async (e) => {
        e.preventDefault()

        const errors = validateSma()
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            return
        }

        try {
            setLoading(true)
            setFieldErrors({})

            const payload = {
                id_jenis_pajak: Number(contextForm.id_jenis_pajak),
                id_model: Number(contextForm.id_model),
                periode_prediksi: smaForm.periode_prediksi,
                metode_akurasi: 'MAPE',
            }

            const response = await postPrediksiSma(payload)
            const data = response.data || response

            showToast('success', response.message || 'Prediksi SMA berhasil diproses')

            startProcessSteps(data)
        } catch (err) {
            const errors = getValidationErrors(err)
            setFieldErrors(errors)
            showToast('error', errors.general || 'Gagal memproses prediksi SMA')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmitMultiTahun = async (e) => {
        e.preventDefault()

        const errors = validateMulti()
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            return
        }

        try {
            setLoading(true)
            setFieldErrors({})

            const payload = {
                id_jenis_pajak: Number(contextForm.id_jenis_pajak),
                id_model: Number(contextForm.id_model),
                tahun_mulai: Number(multiForm.tahun_mulai),
                tahun_selesai: Number(multiForm.tahun_selesai),
            }

            const response =
                multiForm.method === 'GET'
                    ? await getPrediksiMultiTahun(payload)
                    : await postPrediksiMultiTahun(payload)

            const data = response.data || response

            showToast('success', response.message || 'Prediksi multi-tahun berhasil diproses')
            setResultData(data)
            setIsRawOpen(false)
            setStep(3)
        } catch (err) {
            const errors = getValidationErrors(err)
            setFieldErrors(errors)
            showToast('error', errors.general || 'Gagal memproses prediksi multi tahun')
        } finally {
            setLoading(false)
        }
    }

    // ---------- Mode riwayat (lookup ID, independen dari wizard) ----------
    const handleSubmitDetail = async (e) => {
        e.preventDefault()

        if (!detailForm.id) {
            setFieldErrors({ id: 'ID hasil prediksi wajib diisi' })
            return
        }

        try {
            setLoading(true)
            setFieldErrors({})

            const response = await getDetailPrediksi(detailForm.id)
            const data = response.data || response

            showToast('success', response.message || 'Detail prediksi berhasil diambil')
            setDetailResult(data)
        } catch (err) {
            const errors = getValidationErrors(err)
            setFieldErrors(errors)
            setDetailResult(null)
            showToast('error', errors.general || 'Data prediksi dengan ID tersebut tidak ditemukan')
        } finally {
            setLoading(false)
        }
    }

    // ====== RENDER FUNCTIONS ======
    const renderTutorialBody = () => (
        <div className="prediksi-tutorial">
            <div className="prediksi-tutorial-item">
                <span className="prediksi-tutorial-number">1</span>
                <div>
                    <strong>Pilih Jenis Pajak & Model</strong>
                    <p>
                        Tentukan dulu pajak apa yang ingin diprediksi (misalnya Pajak Restoran) dan model
                        prediksi yang akan dipakai sebagai "metode hitung"-nya.
                    </p>
                </div>
            </div>

            <div className="prediksi-tutorial-item">
                <span className="prediksi-tutorial-number">2</span>
                <div>
                    <strong>Pilih Metode Prediksi</strong>
                    <p>
                        Ada dua pilihan: <em>SMA Bulanan</em> untuk prediksi satu bulan tertentu, atau{' '}
                        <em>Multi Tahun</em> untuk proyeksi beberapa tahun sekaligus. Keduanya sama-sama
                        memakai Simple Moving Average di baliknya — bedanya hanya cakupan waktunya.
                    </p>
                </div>
            </div>

            <div className="prediksi-tutorial-item">
                <span className="prediksi-tutorial-number">3</span>
                <div>
                    <strong>Ikuti Prosesnya</strong>
                    <p>
                        Untuk SMA Bulanan, sistem akan menunjukkan tahapan prosesnya selangkah demi
                        selangkah — mulai dari data yang dipakai, cara datanya dibagi untuk
                        latihan/pengujian, perbandingan periode SMA yang dicoba, sampai model terbaik
                        dipilih. Klik tombol <em>Lanjut</em> untuk melihat tahap berikutnya, sebelum
                        akhirnya sampai ke hasil akhir beserta penjelasannya.
                    </p>
                </div>
            </div>

            <div className="prediksi-tutorial-note">
                Tips: sistem bekerja dengan melihat data pajak 5 tahun ke belakang, lalu "berlatih" dan
                "menguji diri sendiri" dengan data tersebut (mencoba periode SMA {SMA_PERIODE_MIN} s.d.{' '}
                {SMA_PERIODE_MAX} bulan) sebelum membuat prediksi. Karena itu, semakin lengkap data pajak
                yang sudah diinput di halaman <em>Data Pajak</em>, semakin baik hasil prediksinya.
            </div>
        </div>
    )

    const renderStep1 = () => (
        <div className="prediksi-step-body">
            <div className="prediksi-info-panel">
                <span className="prediksi-info-icon" aria-hidden="true">💡</span>
                <p>
                    Mulai dengan memilih <strong>jenis pajak</strong> yang ingin diprediksi (misalnya Pajak
                    Hotel atau Pajak Restoran), lalu pilih <strong>model prediksi</strong> yang akan dipakai.
                    Pilihan ini akan berlaku untuk metode di langkah berikutnya.
                </p>
            </div>

            {loadingMaster ? (
                <div className="prediksi-skeleton" aria-hidden="true">
                    <div className="skeleton-line" />
                    <div className="skeleton-line" />
                </div>
            ) : (
                <div className="prediksi-form-grid prediksi-form-grid-2">
                    <div className="form-group">
                        <label htmlFor="ctx_id_jenis_pajak">
                            Jenis Pajak <span>*</span>
                        </label>

                        <select
                            id="ctx_id_jenis_pajak"
                            name="id_jenis_pajak"
                            value={contextForm.id_jenis_pajak}
                            onChange={handleContextChange}
                            className={fieldErrors.id_jenis_pajak ? 'has-error' : ''}
                        >
                            <option value="">Pilih jenis pajak</option>
                            {jenisPajak.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.nama_pajak}
                                </option>
                            ))}
                        </select>
                        {fieldErrors.id_jenis_pajak && (
                            <span className="field-error">{fieldErrors.id_jenis_pajak}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="ctx_id_model">
                            Model Prediksi <span>*</span>
                        </label>

                        <select
                            id="ctx_id_model"
                            name="id_model"
                            value={contextForm.id_model}
                            onChange={handleContextChange}
                            className={fieldErrors.id_model ? 'has-error' : ''}
                        >
                            <option value="">Pilih model prediksi</option>
                            {modelPrediksi.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.nama_model}
                                </option>
                            ))}
                        </select>
                        {fieldErrors.id_model && (
                            <span className="field-error">{fieldErrors.id_model}</span>
                        )}
                    </div>
                </div>
            )}

            <div className="prediksi-step-action">
                <Button variant="primary" onClick={goToStep2} disabled={loadingMaster}>
                    Lanjut: Pilih Metode
                </Button>
            </div>
        </div>
    )

    const renderStep2 = () => (
        <div className="prediksi-step-body">
            <div className="prediksi-context-summary">
                <span className="result-tag">{jenisPajakMap[contextForm.id_jenis_pajak]}</span>
                <span className="result-tag result-tag-muted">{modelPrediksiMap[contextForm.id_model]}</span>
                <button type="button" className="prediksi-link-btn" onClick={() => setStep(1)}>
                    Ganti
                </button>
            </div>

            <div className="prediksi-info-panel">
                <span className="prediksi-info-icon" aria-hidden="true">💡</span>
                <p>
                    Pilih metode prediksi yang sesuai kebutuhanmu. Tidak yakin pilih yang mana? Lihat
                    keterangan "kapan dipakai" di tiap kartu di bawah ini.
                </p>
            </div>

            <div className="prediksi-method-grid">
                {METHODS.map((method) => (
                    <button
                        key={method.key}
                        type="button"
                        className={`prediksi-method-card ${selectedMethod === method.key ? 'active' : ''}`}
                        onClick={() => setSelectedMethod(method.key)}
                    >
                        <span className="prediksi-method-title">{method.label}</span>
                        <span className="prediksi-method-desc">{method.description}</span>
                        <span className="prediksi-method-kapan">{method.kapanDipakai}</span>
                    </button>
                ))}
            </div>

            {selectedMethod === 'sma' && (
                <form onSubmit={handleSubmitSma} className="prediksi-form" noValidate>
                    <div className="prediksi-form-grid prediksi-form-grid-2">
                        <div className="form-group">
                            <Input
                                label="Periode Prediksi"
                                type="month"
                                name="periode_prediksi"
                                value={smaForm.periode_prediksi}
                                onChange={handleSmaChange}
                                error={fieldErrors.periode_prediksi}
                                help="Bulan & tahun yang ingin diprediksi penerimaan pajaknya."
                            />
                        </div>

                        <div className="form-group">
                            <label>Metode Akurasi</label>
                            <div className="prediksi-fixed-value">MAPE (Mean Absolute Percentage Error)</div>
                            <span className="field-help">
                                Saat ini sistem hanya mendukung MAPE sebagai metode pengukuran akurasi.
                            </span>
                        </div>
                    </div>

                    <div className="prediksi-info-panel prediksi-info-panel-muted">
                        <span className="prediksi-info-icon" aria-hidden="true">⚙️</span>
                        <p>
                            Kamu tidak perlu menentukan periode SMA secara manual. Sistem akan otomatis
                            mencoba <strong>semua periode SMA dari {SMA_PERIODE_MIN} sampai {SMA_PERIODE_MAX}{' '}
                                bulan</strong>, menguji masing-masing terhadap data historis, lalu memilih
                            periode dengan tingkat kesalahan (MAPE) paling kecil sebagai model terbaik.
                        </p>
                    </div>

                    <div className="prediksi-step-action prediksi-step-action-split">
                        <Button variant="secondary" onClick={() => setStep(1)}>
                            Kembali
                        </Button>
                        <Button type="submit" variant="primary" loading={loading}>
                            Generate SMA
                        </Button>
                    </div>
                </form>
            )}

            {selectedMethod === 'multi' && (
                <form onSubmit={handleSubmitMultiTahun} className="prediksi-form" noValidate>
                    <div className="prediksi-form-grid">
                        <div className="form-group">
                            <Input
                                label="Tahun Mulai"
                                type="number"
                                name="tahun_mulai"
                                value={multiForm.tahun_mulai}
                                placeholder="Contoh: 2026"
                                onChange={handleMultiChange}
                                error={fieldErrors.tahun_mulai}
                            />
                        </div>

                        <div className="form-group">
                            <Input
                                label="Tahun Selesai"
                                type="number"
                                name="tahun_selesai"
                                value={multiForm.tahun_selesai}
                                placeholder="Contoh: 2029"
                                onChange={handleMultiChange}
                                error={fieldErrors.tahun_selesai}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="method">Method Request</label>
                            <select
                                id="method"
                                name="method"
                                value={multiForm.method}
                                onChange={handleMultiChange}
                            >
                                <option value="POST">POST (simpan hasil baru)</option>
                                <option value="GET">GET (lihat tanpa menyimpan)</option>
                            </select>
                            <span className="field-help">
                                Pilih GET jika hanya ingin melihat simulasi tanpa menyimpan ke riwayat.
                            </span>
                        </div>
                    </div>

                    <div className="prediksi-info-panel prediksi-info-panel-muted">
                        <span className="prediksi-info-icon" aria-hidden="true">🔁</span>
                        <p>
                            Setiap bulan dalam rentang tahun ini dihitung <strong>berurutan</strong> (rolling
                            forecast) memakai metode SMA yang sama seperti SMA Bulanan. Selama data aktual
                            belum tersedia, hasil prediksi bulan sebelumnya ikut dipakai sebagai data
                            sementara untuk memprediksi bulan berikutnya.
                        </p>
                    </div>

                    <div className="prediksi-step-action prediksi-step-action-split">
                        <Button variant="secondary" onClick={() => setStep(1)}>
                            Kembali
                        </Button>
                        <Button type="submit" variant="primary" loading={loading}>
                            Generate Multi Tahun
                        </Button>
                    </div>
                </form>
            )}

            {!selectedMethod && (
                <p className="prediksi-empty">Pilih salah satu metode di atas untuk melanjutkan.</p>
            )}
        </div>
    )

    const renderProcessStepContent = () => {
        if (!ringkasanProses) return null

        const currentKey = PROCESS_STEPS[processStepIndex].key
        const {
            anomali,
            pembagianData,
            modelDiuji,
            periodeDiuji,
            model,
            status,
            jumlahDataBulanan,
            periodeData,
            evaluasiTerbaik,
        } = ringkasanProses

        const periodeMin = periodeDiuji.length > 0 ? Math.min(...periodeDiuji) : SMA_PERIODE_MIN
        const periodeMax = periodeDiuji.length > 0 ? Math.max(...periodeDiuji) : SMA_PERIODE_MAX

        const labelBulanTahun = (tahun, bulan) => {
            try {
                return new Date(`${tahun}-${String(bulan).padStart(2, '0')}-01`).toLocaleDateString('id-ID', {
                    month: 'short',
                    year: 'numeric',
                })
            } catch (err) {
                return `${bulan}/${tahun}`
            }
        }

        if (currentKey === 'data') {
            return (
                <div className="prediksi-process-card">
                    <p className="prediksi-process-text">
                        Sistem mengambil <strong>{jumlahDataBulanan ?? '-'} bulan</strong> data historis
                        penerimaan pajak (digabung per bulan dari data harian yang sudah kamu input), dari
                        periode <strong>{periodeData || '-'}</strong>.
                    </p>

                    {anomali && (
                        <p className="prediksi-process-text">
                            {anomali.jumlah_terdeteksi > 0 ? (
                                <>
                                    Dari {jumlahDataBulanan ?? '-'} bulan tersebut, ditemukan{' '}
                                    <strong>{anomali.jumlah_terdeteksi} bulan</strong> dengan lonjakan data
                                    tidak wajar (naik/turun lebih dari {anomali.threshold} dibanding bulan
                                    sebelumnya). Sistem otomatis "meratakan" bulan-bulan tersebut supaya
                                    tidak membuat prediksi jadi bias karena lonjakan sesaat.
                                </>
                            ) : (
                                <>
                                    Tidak ditemukan lonjakan data yang tidak wajar (naik/turun lebih dari{' '}
                                    {anomali.threshold}) pada data historis ini, jadi semua data dipakai
                                    apa adanya.
                                </>
                            )}
                        </p>
                    )}

                    <p className="prediksi-process-text prediksi-process-text-muted">
                        Catatan: data per bulan ini didapat dengan menjumlahkan seluruh data pajak harian
                        yang sudah diinput di halaman <em>Data Pajak</em> untuk jenis pajak yang dipilih,
                        dalam bulan yang sama.
                    </p>

                    {evaluasiTerbaik.length > 0 && (
                        <div className="prediksi-process-detail">
                            <button
                                type="button"
                                className="prediksi-process-detail-toggle"
                                onClick={() => setIsDataDetailOpen((prev) => !prev)}
                            >
                                {isDataDetailOpen ? '▾' : '▸'} Lihat contoh data bulanan ({evaluasiTerbaik.length} bulan terakhir)
                            </button>

                            {isDataDetailOpen && (
                                <div className="prediksi-process-detail-table-wrap">
                                    <table className="prediksi-process-detail-table">
                                        <thead>
                                            <tr>
                                                <th>Bulan</th>
                                                <th>Pendapatan Tercatat</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {evaluasiTerbaik.map((row, idx) => (
                                                <tr key={`${row.tahun}-${row.bulan}-${idx}`}>
                                                    <td>{labelBulanTahun(row.tahun, row.bulan)}</td>
                                                    <td>{formatRupiah(row.aktual)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <p className="prediksi-process-detail-note">
                                        Ini contoh {evaluasiTerbaik.length} bulan terakhir dari data historis
                                        (bagian yang dipakai untuk "menguji" sistem — lihat detail lengkapnya
                                        di langkah berikutnya).
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )
        }

        if (currentKey === 'split' && pembagianData) {
            const total = (pembagianData.training || 0) + (pembagianData.testing || 0)
            const persenTraining = total > 0 ? Math.round((pembagianData.training / total) * 100) : 80

            return (
                <div className="prediksi-process-card">
                    <p className="prediksi-process-text">
                        Dari total <strong>{total} bulan</strong> data historis, sistem membaginya menjadi
                        dua kelompok secara berurutan (bulan-bulan paling awal untuk training, bulan-bulan
                        paling akhir untuk testing):
                    </p>

                    <ul className="prediksi-process-list">
                        <li>
                            <strong>Data Training ({pembagianData.training} bulan)</strong> — kelompok data
                            paling awal yang dipakai sistem untuk "belajar" pola kenaikan/penurunan
                            penerimaan pajak dari bulan ke bulan.
                        </li>
                        <li>
                            <strong>Data Testing ({pembagianData.testing} bulan)</strong> — kelompok data
                            paling akhir yang "disembunyikan" dari proses belajar, lalu dipakai untuk
                            menguji: seandainya sistem diminta menebak bulan-bulan ini, seberapa dekat
                            tebakannya dengan kenyataan?
                        </li>
                    </ul>

                    <div className="prediksi-process-split-bar">
                        <div className="prediksi-process-split-fill" style={{ width: `${persenTraining}%` }}>
                            Training {pembagianData.training} bulan
                        </div>
                        <div className="prediksi-process-split-rest">Testing {pembagianData.testing} bulan</div>
                    </div>

                    {evaluasiTerbaik.length > 0 && (
                        <div className="prediksi-process-detail">
                            <button
                                type="button"
                                className="prediksi-process-detail-toggle"
                                onClick={() => setIsSplitDetailOpen((prev) => !prev)}
                            >
                                {isSplitDetailOpen ? '▾' : '▸'} Lihat detail {evaluasiTerbaik.length} bulan data testing
                            </button>

                            {isSplitDetailOpen && (
                                <div className="prediksi-process-detail-table-wrap">
                                    <table className="prediksi-process-detail-table">
                                        <thead>
                                            <tr>
                                                <th>Bulan (Testing)</th>
                                                <th>Aktual</th>
                                                <th>Tebakan Sistem</th>
                                                <th>Selisih</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {evaluasiTerbaik.map((row, idx) => (
                                                <tr key={`${row.tahun}-${row.bulan}-${idx}`}>
                                                    <td>{labelBulanTahun(row.tahun, row.bulan)}</td>
                                                    <td>{formatRupiah(row.aktual)}</td>
                                                    <td>{formatRupiah(row.prediksi)}</td>
                                                    <td>
                                                        {formatRupiah(row.error)}{' '}
                                                        <span className="prediksi-process-detail-percent">
                                                            ({row.absolute_percentage_error}%)
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <p className="prediksi-process-detail-note">
                                        "Tebakan Sistem" adalah hasil percobaan sistem menebak bulan tersebut
                                        menggunakan model <strong>{model?.model}</strong> (model yang
                                        akhirnya terpilih sebagai yang terbaik). Kolom "Selisih" adalah
                                        Aktual dikurangi Tebakan — dipakai untuk menghitung nilai MAPE di
                                        langkah berikutnya.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )
        }

        if (currentKey === 'compare' && modelDiuji.length > 0) {
            return (
                <div className="prediksi-process-card">
                    <p className="prediksi-process-text">
                        Sistem mencoba <strong>{modelDiuji.length} variasi periode SMA</strong> (dari{' '}
                        {periodeMin} sampai {periodeMax} bulan) — tiap periode diuji dengan cara yang sama:
                        menebak nilai bulan-bulan testing satu per satu, lalu membandingkan tebakan dengan
                        nilai aktualnya. Berikut hasil perbandingannya, diurutkan dari yang paling akurat:
                    </p>
                    <div className="prediksi-process-compare-grid">
                        {modelDiuji.map((item) => (
                            <div
                                key={item.model}
                                className={`prediksi-process-compare-card ${item.model === model?.model ? 'is-best' : ''
                                    }`}
                            >
                                <span className="prediksi-process-compare-title">{item.model}</span>
                                <span className="prediksi-process-compare-mape">MAPE {item.mape}%</span>

                                <span className="prediksi-process-compare-detail">
                                    Diuji dengan {item.jumlah_data_uji ?? item.jumlah_data_testing ?? '-'} bulan data
                                </span>
                                {item.model === model?.model && (
                                    <span className="prediksi-process-compare-badge">Terbaik</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )
        }

        if (currentKey === 'best' && model) {
            return (
                <div className="prediksi-process-card">
                    <p className="prediksi-process-text">
                        Model <strong>{model.model}</strong> terpilih karena memiliki nilai error (MAPE)
                        paling kecil dibanding {modelDiuji.length > 1 ? `${modelDiuji.length - 1} periode SMA lainnya` : 'periode SMA lainnya'}.
                    </p>
                    <div className={`prediksi-explainer-card tone-${status.tone}`}>
                        <strong>{status.label}</strong>
                        <p>{status.saran}</p>
                    </div>
                </div>
            )
        }

        if (currentKey === 'final') {
            return (
                <div className="prediksi-process-card">
                    <p className="prediksi-process-text">
                        Menghitung nilai prediksi akhir menggunakan model terbaik dan seluruh data historis
                        yang sudah dibersihkan dari anomali...
                    </p>
                    <div className="prediksi-process-final-value">
                        {formatRupiah(ringkasanProses.nilaiPrediksi)}
                    </div>
                </div>
            )
        }

        return null
    }

    const renderProcessAnimation = () => {
        const isLastStep = processStepIndex === PROCESS_STEPS.length - 1

        return (
            <div className="prediksi-step-body">
                <div className="prediksi-process">
                    <div className="prediksi-process-stepper" role="list">
                        {PROCESS_STEPS.map((item, index) => {
                            const isActive = index === processStepIndex
                            const isDone = index < processStepIndex

                            return (
                                <div
                                    key={item.key}
                                    className={`prediksi-process-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                                    role="listitem"
                                >
                                    <span className="prediksi-process-step-dot">
                                        {isDone ? '✓' : index + 1}
                                    </span>
                                    <span className="prediksi-process-step-label">{item.label}</span>
                                </div>
                            )
                        })}
                    </div>

                    <div className="prediksi-process-content" key={PROCESS_STEPS[processStepIndex].key}>
                        <h4 className="prediksi-process-heading">{PROCESS_STEPS[processStepIndex].label}</h4>
                        {renderProcessStepContent()}
                    </div>

                    <div className="prediksi-process-nav">
                        <button type="button" className="prediksi-link-btn" onClick={skipProcessAnimation}>
                            Lewati, langsung lihat hasil akhir
                        </button>

                        <div className="prediksi-process-nav-buttons">
                            <Button variant="secondary" onClick={goToPrevProcessStep}>
                                Kembali
                            </Button>
                            <Button variant="primary" onClick={goToNextProcessStep}>
                                {isLastStep ? 'Lihat Hasil Akhir' : 'Lanjut'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ====== PERBAIKAN: Penjelasan Hasil dengan Periode yang Jelas ======
    const renderPenjelasanHasil = () => {
        if (!ringkasanPenjelasan) return null

        const {
            model,
            anomali,
            pembagianData,
            status,
            penjelasanAkurasi,
            modelDiuji,
            periodeDiuji,
            periodePrediksi,
            periodeData,
            jumlahDataBulanan,
            nilaiPrediksi
        } = ringkasanPenjelasan

        const periodeMin = periodeDiuji.length > 0 ? Math.min(...periodeDiuji) : SMA_PERIODE_MIN
        const periodeMax = periodeDiuji.length > 0 ? Math.max(...periodeDiuji) : SMA_PERIODE_MAX

        // Format periode prediksi untuk ditampilkan
        const formattedPeriodePrediksi = periodePrediksi
            ? new Date(`${periodePrediksi}-01`).toLocaleDateString('id-ID', {
                month: 'long',
                year: 'numeric'
            })
            : 'periode yang dipilih'

        // ====== PERBAIKAN: Format periode data historis ======
        const formattedPeriodeData = periodeData || 'periode sebelumnya'

        return (
            <div className="prediksi-explainer">
                <div className="prediksi-explainer-header">
                    <span className="prediksi-info-icon" aria-hidden="true">📖</span>
                    <h4>Penjelasan Hasil Prediksi</h4>
                </div>

                {/* ====== PERBAIKAN: Hero card dengan periode jelas ====== */}
                <div className="prediksi-result-hero">
                    <div className="prediksi-result-hero-value">
                        <span>Nilai Prediksi untuk {formattedPeriodePrediksi}</span>
                        <strong>{formatRupiah(nilaiPrediksi)}</strong>
                    </div>
                    <div className="prediksi-result-hero-period">
                        <span>Berdasarkan data historis {formattedPeriodeData} ({jumlahDataBulanan || 0} bulan)</span>
                    </div>
                    <p className="prediksi-result-hero-source">
                        <strong>Model terbaik:</strong> {model?.model} dengan nilai error (MAPE) {model?.mape}% —
                        artinya {penjelasanAkurasi.awam}
                    </p>
                </div>

                <div className={`prediksi-explainer-card tone-${status.tone}`}>
                    <strong>{status.label}</strong>
                    <p>{status.saran}</p>
                </div>

                {model && (
                    <div className="prediksi-explainer-row">
                        <span className="prediksi-explainer-label">Mengapa model "{model.model}" yang dipilih?</span>
                        <p>
                            Sistem mencoba {modelDiuji.length} variasi periode SMA (dari {periodeMin} sampai{' '}
                            {periodeMax} bulan), lalu memilih yang paling akurat saat diuji dengan data
                            historis (data testing). Model <strong>{model.model}</strong> terpilih karena
                            memiliki nilai error paling kecil dibanding periode-periode lainnya.
                        </p>
                        <p className="prediksi-explainer-istilah">
                            <strong>{penjelasanAkurasi.nama}</strong> bernilai{' '}
                            <strong>{model.mape}%</strong> — artinya {penjelasanAkurasi.awam}
                        </p>
                    </div>
                )}

                {anomali && (
                    <div className="prediksi-explainer-row">
                        <span className="prediksi-explainer-label">Tentang data yang dipakai</span>
                        <p>
                            {anomali.jumlah_terdeteksi > 0 ? (
                                <>
                                    Sistem mendeteksi <strong>{anomali.jumlah_terdeteksi} bulan</strong> dengan
                                    lonjakan data yang tidak wajar (naik/turun lebih dari 20% secara
                                    tiba-tiba), dan otomatis menyesuaikannya supaya tidak membuat prediksi
                                    jadi bias. Ini bukan kesalahan input — sistem yang menanganinya secara
                                    otomatis.
                                </>
                            ) : (
                                <>Tidak ada lonjakan data tak wajar yang ditemukan pada data historis yang dipakai.</>
                            )}
                        </p>
                    </div>
                )}

                {pembagianData && (
                    <div className="prediksi-explainer-row">
                        <span className="prediksi-explainer-label">Bagaimana sistem "belajar"?</span>
                        <p>
                            Dari seluruh data historis, <strong>{pembagianData.training} bulan</strong>{' '}
                            dipakai untuk "berlatih" dan <strong>{pembagianData.testing} bulan</strong>{' '}
                            terakhir dipakai untuk "menguji diri sendiri" sebelum membuat prediksi akhir.
                            Semakin banyak data pajak yang sudah diinput, biasanya semakin baik hasilnya.
                        </p>
                    </div>
                )}

                <div className="prediksi-explainer-row prediksi-explainer-row-action">
                    <span className="prediksi-explainer-label">Sebaiknya apa yang dilakukan?</span>
                    <ul className="prediksi-explainer-list">
                        <li>
                            Angka ini adalah estimasi berdasarkan pola data historis, bukan angka pasti —
                            sebaiknya sampaikan sebagai perkiraan, terutama saat dilaporkan ke pihak lain.
                        </li>
                        {status.tone === 'bad' || status.tone === 'warn' ? (
                            <li>
                                Karena tingkat akurasinya {status.label.toLowerCase()}, sebaiknya periksa
                                kembali kelengkapan data pajak historis di halaman <em>Data Pajak</em>{' '}
                                sebelum mengambil keputusan penting berdasarkan hasil ini.
                            </li>
                        ) : (
                            <li>
                                Hasil ini cukup bisa diandalkan, namun tetap baik untuk dibandingkan dengan
                                data atau pertimbangan lain sebelum dijadikan keputusan akhir.
                            </li>
                        )}
                        <li>
                            Kalau ingin gambaran beberapa tahun ke depan sekaligus, coba metode{' '}
                            <em>Multi Tahun</em> dari halaman ini.
                        </li>
                    </ul>
                </div>
            </div>
        )
    }

    const renderPenjelasanMultiTahun = () => {
        if (!ringkasanMultiTahun) return null

        const { meta, totalBulan } = ringkasanMultiTahun

        return (
            <div className="prediksi-explainer">
                <div className="prediksi-explainer-header">
                    <span className="prediksi-info-icon" aria-hidden="true">📖</span>
                    <h4>Bagaimana Prediksi Multi Tahun Ini Dihitung?</h4>
                </div>

                <div className="prediksi-explainer-row">
                    <span className="prediksi-explainer-label">Konsep: Rolling Forecast</span>
                    <p>
                        Setiap bulan diprediksi satu per satu secara berurutan menggunakan metode SMA yang
                        sama seperti pada mode "SMA Bulanan" (sistem otomatis menguji periode{' '}
                        {SMA_PERIODE_MIN} sampai {SMA_PERIODE_MAX} bulan dan memilih yang paling akurat
                        untuk tiap bulan). Selama belum ada data aktual, hasil prediksi bulan sebelumnya
                        ikut dipakai sebagai data historis sementara untuk memprediksi bulan berikutnya.
                    </p>
                </div>

                <div className="prediksi-explainer-row">
                    <span className="prediksi-explainer-label">Ringkasan Proses</span>
                    <p>
                        Dari total <strong>{totalBulan} bulan</strong> yang diminta,{' '}
                        <strong>{meta.total_berhasil ?? 0} bulan berhasil</strong> diprediksi
                        {meta.total_gagal > 0 ? (
                            <>
                                {' '}dan <strong>{meta.total_gagal} bulan gagal</strong> (biasanya karena data
                                historis 5 tahun ke belakang untuk bulan tersebut belum mencukupi minimal 24
                                bulan data).
                            </>
                        ) : (
                            '.'
                        )}
                    </p>
                </div>

                <div className="prediksi-explainer-row prediksi-explainer-row-action">
                    <span className="prediksi-explainer-label">Sebaiknya apa yang dilakukan?</span>
                    <ul className="prediksi-explainer-list">
                        <li>
                            Karena bulan-bulan berikutnya bisa ikut dipengaruhi hasil prediksi bulan
                            sebelumnya (bukan hanya data aktual), anggap prediksi untuk tahun yang lebih
                            jauh sebagai perkiraan yang semakin kasar.
                        </li>
                        {meta.total_gagal > 0 && (
                            <li>
                                Ada bulan berstatus "Gagal" pada tabel di bawah — lengkapi data pajak
                                historis di halaman <em>Data Pajak</em>, lalu ulangi proses prediksi untuk
                                bulan tersebut.
                            </li>
                        )}
                        <li>
                            Kalau hanya butuh satu bulan tertentu dengan penjelasan proses lebih detail,
                            gunakan metode <em>SMA Bulanan</em> dari halaman ini.
                        </li>
                    </ul>
                </div>
            </div>
        )
    }

    const renderStep3 = () => (
        <div className="prediksi-step-body">
            <div className="prediksi-result">
                <div className="prediksi-result-meta">
                    <span className="result-tag">{jenisPajakMap[contextForm.id_jenis_pajak]}</span>
                    <span className="result-tag result-tag-muted">{modelPrediksiMap[contextForm.id_model]}</span>
                </div>

                {/* ====== PERBAIKAN: Summary cards dengan informasi periode yang lebih detail ====== */}
                {resultRows.length > 0 && (
                    <div className="prediksi-result-summary">
                        <div className="prediksi-result-card">
                            <span>Periode Data</span>
                            <strong>{periodeRange}</strong>
                            <small style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                                {resultRows.length} periode
                            </small>
                        </div>
                        <div className="prediksi-result-card">
                            <span>Total Nilai Prediksi</span>
                            <strong>{formatCompactRupiah(totalNilai)}</strong>
                            <small style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                                {resultRows.length > 1 ? 'Akumulasi seluruh periode' : 'Nilai prediksi'}
                            </small>
                        </div>
                    </div>
                )}

                {/* ====== PERBAIKAN: Chart dengan minimal 2 titik data ====== */}
                {chartData.length > 1 && (
                    <div className="prediksi-chart">
                        <div className="prediksi-chart-title">
                            Tren Nilai Prediksi
                            <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#6b7280', marginLeft: '8px' }}>
                                ({chartData.length} periode • {periodeRange})
                            </span>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 12, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                    interval={Math.max(0, Math.floor(chartData.length / 10))}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                    tickFormatter={(value) => formatCompactRupiah(value)}
                                    width={70}
                                />
                                <Tooltip
                                    formatter={(value) => [formatRupiah(value), 'Nilai Prediksi']}
                                    labelStyle={{ color: '#1f2937' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="nilai"
                                    stroke="#0f5132"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* ====== PERBAIKAN: Pesan jika chart tidak bisa ditampilkan ====== */}
                {chartData.length === 1 && (
                    <div className="prediksi-info-panel prediksi-info-panel-muted">
                        <span className="prediksi-info-icon" aria-hidden="true">ℹ️</span>
                        <p>
                            Hanya ada <strong>1 periode</strong> data prediksi ({periodeRange}), sehingga grafik tren tidak
                            dapat ditampilkan. Untuk melihat grafik, hasil prediksi harus memiliki minimal
                            2 periode data.
                        </p>
                    </div>
                )}

                {chartData.length === 0 && (
                    <div className="prediksi-info-panel prediksi-info-panel-muted">
                        <span className="prediksi-info-icon" aria-hidden="true">ℹ️</span>
                        <p>
                            Tidak ada data prediksi yang valid untuk ditampilkan dalam grafik.
                        </p>
                    </div>
                )}

                {resultRows.length > 0 ? (
                    renderRowsTable(resultRows)
                ) : (
                    <p className="prediksi-empty">Tidak ada data yang bisa ditampilkan.</p>
                )}

                {renderPenjelasanHasil()}
                {renderPenjelasanMultiTahun()}

                <button type="button" className="prediksi-raw-toggle" onClick={() => setIsRawOpen((prev) => !prev)}>
                    {isRawOpen ? 'Sembunyikan response API' : 'Lihat response API (JSON)'}
                </button>

                {isRawOpen && (
                    <div className="prediksi-result-json">
                        <pre>{JSON.stringify(resultData, null, 2)}</pre>
                    </div>
                )}
            </div>

            <div className="prediksi-step-action prediksi-step-action-split">
                <Button variant="secondary" onClick={() => setStep(2)}>
                    Ubah Parameter
                </Button>
                <Button variant="primary" onClick={resetWizard}>
                    Buat Prediksi Baru
                </Button>
            </div>
        </div>
    )

    const renderStepper = () => (
        <div className="prediksi-stepper" role="list">
            {STEPS.map((item, index) => {
                const isActive = step === item.key
                const isDone = step > item.key

                return (
                    <React.Fragment key={item.key}>
                        <div className={`prediksi-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`} role="listitem">
                            <span className="prediksi-step-circle">{isDone ? '✓' : item.key}</span>
                            <span className="prediksi-step-label">{item.label}</span>
                        </div>
                        {index < STEPS.length - 1 && (
                            <span className={`prediksi-step-connector ${step > item.key ? 'done' : ''}`} />
                        )}
                    </React.Fragment>
                )
            })}
        </div>
    )

    const renderRiwayat = () => (
        <div className="prediksi-panel">
            <div className="prediksi-panel-header">
                <h3>Cari Riwayat Prediksi</h3>
                <p>Lihat kembali hasil prediksi yang sudah pernah dibuat sebelumnya, berdasarkan ID-nya.</p>
            </div>

            <form onSubmit={handleSubmitDetail} className="prediksi-form prediksi-form-narrow" noValidate>
                <div className="form-group">
                    <Input
                        label="ID Hasil Prediksi"
                        type="number"
                        name="id"
                        value={detailForm.id}
                        placeholder="Contoh: 1040"
                        onChange={handleDetailChange}
                        error={fieldErrors.id}
                        help="ID ini biasanya kamu catat / lihat dari hasil prediksi yang sudah pernah dibuat sebelumnya."
                    />
                </div>

                <div className="prediksi-form-action">
                    <Button type="submit" variant="primary" loading={loading}>
                        Cari
                    </Button>
                </div>
            </form>

            {detailResult && (
                <div className="prediksi-result">
                    <div className="prediksi-result-meta">
                        {detailResult?.jenis_pajak?.nama_pajak && (
                            <span className="result-tag">{detailResult.jenis_pajak.nama_pajak}</span>
                        )}
                        {detailResult?.model_prediksi?.nama_model && (
                            <span className="result-tag result-tag-muted">{detailResult.model_prediksi.nama_model}</span>
                        )}
                    </div>

                    {detailRows.length > 0 ? (
                        renderRowsTable(detailRows)
                    ) : (
                        <p className="prediksi-empty">Tidak ada data yang bisa ditampilkan.</p>
                    )}

                    <button type="button" className="prediksi-raw-toggle" onClick={() => setIsRawOpen((prev) => !prev)}>
                        {isRawOpen ? 'Sembunyikan response API' : 'Lihat response API (JSON)'}
                    </button>

                    {isRawOpen && (
                        <div className="prediksi-result-json">
                            <pre>{JSON.stringify(detailResult, null, 2)}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    )

    return (
        <div className="prediksi-page">
            <div className="prediksi-header">
                <div>
                    <h2>Prediksi Pajak</h2>
                    <p>Jalankan proses prediksi penerimaan pajak berdasarkan data historis.</p>
                </div>

                <button type="button" className="prediksi-tutorial-trigger" onClick={() => setIsTutorialOpen(true)}>
                    <span aria-hidden="true">❓</span> Cara Pakai Halaman Ini
                </button>
            </div>

            {masterError && (
                <div className="alert alert-error">
                    <span>{masterError}</span>
                    <button type="button" className="alert-retry" onClick={loadMasterData}>
                        Coba lagi
                    </button>
                </div>
            )}

            <div className="prediksi-mode-switch" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={mode === MODE.WIZARD}
                    className={`prediksi-mode-tab ${mode === MODE.WIZARD ? 'active' : ''}`}
                    onClick={() => switchMode(MODE.WIZARD)}
                >
                    Buat Prediksi
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={mode === MODE.RIWAYAT}
                    className={`prediksi-mode-tab ${mode === MODE.RIWAYAT ? 'active' : ''}`}
                    onClick={() => switchMode(MODE.RIWAYAT)}
                >
                    Cari Riwayat
                </button>
            </div>

            {mode === MODE.WIZARD ? (
                <div className="prediksi-panel">
                    {isProcessing ? (
                        renderProcessAnimation()
                    ) : (
                        <>
                            {renderStepper()}
                            {step === 1 && renderStep1()}
                            {step === 2 && renderStep2()}
                            {step === 3 && renderStep3()}
                        </>
                    )}
                </div>
            ) : (
                renderRiwayat()
            )}

            {toast && (
                <div className={`prediksi-toast prediksi-toast-${toast.type}`} role="status">
                    <span>{toast.text}</span>
                    <button type="button" onClick={() => setToast(null)} aria-label="Tutup notifikasi">
                        ×
                    </button>
                </div>
            )}

            <Modal
                isOpen={isTutorialOpen}
                title="Cara Menggunakan Halaman Prediksi"
                onClose={closeTutorial}
                size="medium"
                footer={
                    <Button variant="primary" onClick={closeTutorial}>
                        Mengerti, Mulai Sekarang
                    </Button>
                }
            >
                {renderTutorialBody()}
            </Modal>
        </div>
    )
}