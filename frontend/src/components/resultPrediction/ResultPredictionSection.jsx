// ResultPredictionSection.js
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Filler,
    Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { getResultPredictionMultiTahun, getDataPajakList } from '../../services/resultPredictionService'
import './ResultPredictionSection.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend)

const CACHE_KEY = 'prediksi_multi_tahun_cache'
const CACHE_DURATION = 30 * 60 * 1000 // 30 menit
const AUTO_REFRESH_INTERVAL = 30 * 60 * 1000

const DEFAULT_PARAMS = {
    id_jenis_pajak: 1,
    id_model: 1,
    tahun_mulai: 2020,
    tahun_selesai: 2026,
}

export default function ResultPredictionSection({
    idJenisPajak = DEFAULT_PARAMS.id_jenis_pajak,
    idModel = DEFAULT_PARAMS.id_model,
    tahunMulai = DEFAULT_PARAMS.tahun_mulai,
    tahunSelesai = DEFAULT_PARAMS.tahun_selesai,
    autoRefresh = true,
}) {
    const sectionRef = useRef(null)
    const isInView = true
    const refreshTimerRef = useRef(null)
    const isMountedRef = useRef(true)

    const [apiData, setApiData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedYear, setSelectedYear] = useState(null)
    const [progress, setProgress] = useState('Menghubungkan ke server...')
    const [lastUpdate, setLastUpdate] = useState(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [showZeroData, setShowZeroData] = useState(false)
    const [dataStats, setDataStats] = useState(null)
    const [isDebugMode, setIsDebugMode] = useState(false)

    // ===== TAMBAHAN: data mentah bulanan (aktual + prediksi) untuk chart overlay =====
    // Endpoint data-pajak mengembalikan SEMUA baris (sumber_data: 'aktual' atau 'prediksi').
    // Kita pisahkan keduanya nanti di overlayComparison, jadi cuma perlu satu fetch.
    const [rawActualMonthly, setRawActualMonthly] = useState([])
    const [loadingActualMonthly, setLoadingActualMonthly] = useState(true)
    const [actualMonthlyError, setActualMonthlyError] = useState(null)

    const cacheKey = `${CACHE_KEY}_${idJenisPajak}_${idModel}_${tahunMulai}_${tahunSelesai}`

    // Normalize response data
    const normalizeResponseData = (response) => {
        return response?.data || response || null
    }

    // Di dalam getDataWithLabels
    const getDataWithLabels = useCallback((data) => {
        if (!data?.ringkasan_per_tahun) return data

        const tahunSekarang = new Date().getFullYear()

        const ringkasanWithLabels = data.ringkasan_per_tahun.map(item => {
            const tahun = parseInt(item.tahun)
            let label = 'Historis'

            if (tahun > tahunSekarang) {
                label = 'Prediksi'
            } else if (tahun === tahunSekarang) {
                label = 'Tahun Berjalan'
            }

            const totalPrediksi = Number(item.total_prediksi || 0)
            // isZero hanya true jika total_prediksi === 0 DAN item memiliki properti total_prediksi
            const isZeroData = totalPrediksi === 0 && item.total_prediksi !== undefined && item.total_prediksi !== null

            return {
                ...item,
                label,
                isPrediksi: tahun > tahunSekarang,
                isHistoris: tahun <= tahunSekarang,
                isZero: isZeroData,
                hasData: item.total_prediksi !== undefined && item.total_prediksi !== null,
            }
        })

        return {
            ...data,
            ringkasan_per_tahun: ringkasanWithLabels,
        }
    }, [])

    // Update data statistics
    const updateDataStats = useCallback((data) => {
        if (!data?.ringkasan_per_tahun) return

        const ringkasan = data.ringkasan_per_tahun
        const totalData = ringkasan.length
        const zeroData = ringkasan.filter(item => item.isZero)
        const validData = ringkasan

        setDataStats({
            total: totalData,
            zeroCount: zeroData.length,
            validCount: validData.length,
            tahunZero: zeroData.map(item => item.tahun),
            tahunValid: validData.map(item => item.tahun),
        })
    }, [])

    // Filter data 0
    const filterZeroData = useCallback((data) => {
        if (!data?.ringkasan_per_tahun) return data

        const filteredData = data.ringkasan_per_tahun.filter(item => !item.isZero)

        return {
            ...data,
            ringkasan_per_tahun: filteredData
        }
    }, [])

    // Cached data functions
    const getCachedData = useCallback(() => {
        try {
            const cached = localStorage.getItem(cacheKey)
            if (!cached) return null

            const { data, timestamp } = JSON.parse(cached)
            const age = Date.now() - timestamp

            if (age < CACHE_DURATION) {
                const dataWithLabels = getDataWithLabels(data)
                return showZeroData ? dataWithLabels : filterZeroData(dataWithLabels)
            }

            localStorage.removeItem(cacheKey)
            return null
        } catch (error) {
            console.warn('Cache read error:', error)
            return null
        }
    }, [cacheKey, getDataWithLabels, filterZeroData, showZeroData])

    const setCachedData = useCallback((data) => {
        try {
            const dataWithLabels = getDataWithLabels(data)
            const dataToCache = showZeroData ? dataWithLabels : filterZeroData(dataWithLabels)

            localStorage.setItem(cacheKey, JSON.stringify({
                data: dataToCache,
                timestamp: Date.now(),
            }))
            return dataToCache
        } catch (error) {
            console.warn('Cache write error:', error)
            return data
        }
    }, [cacheKey, getDataWithLabels, filterZeroData, showZeroData])

    // Fetch data function
    const fetchMultiTahun = useCallback(async (force = false) => {
        if (!isMountedRef.current) return

        try {
            if (force) {
                setIsRefreshing(true)
                setProgress('Memperbarui data...')
            } else {
                setLoading(true)
                setProgress('Mengambil data prediksi...')
            }

            setError(null)

            if (!force) {
                const cachedData = getCachedData()
                if (cachedData) {
                    console.log('📦 Using cached data')
                    setApiData(cachedData)
                    updateDataStats(cachedData)

                    if (cachedData?.ringkasan_per_tahun?.length > 0) {
                        const prediksiYear = cachedData.ringkasan_per_tahun.find(
                            item => item.isPrediksi === true && !item.isZero
                        )
                        const defaultYear = prediksiYear || cachedData.ringkasan_per_tahun.find(
                            item => !item.isZero
                        ) || cachedData.ringkasan_per_tahun[0]
                        setSelectedYear(String(defaultYear.tahun))
                    }

                    setLastUpdate(new Date())
                    setLoading(false)
                    setIsRefreshing(false)
                    return
                }
            }

            console.log(`🔄 Fetching data from API (${force ? 'force' : 'normal'})`)
            // Di dalam fetchMultiTahun, setelah mendapatkan response
            const response = await getResultPredictionMultiTahun({
                id_jenis_pajak: idJenisPajak,
                id_model: idModel,
                tahun_mulai: tahunMulai,
                tahun_selesai: tahunSelesai,
                showZeroData: showZeroData,
            })

            if (!response) {
                throw new Error('Gagal mengambil data')
            }

            const rawData = normalizeResponseData(response)
            const dataWithLabels = getDataWithLabels(rawData)
            console.log('📊 Ringkasan dari API:', rawData?.ringkasan_per_tahun)

            // Filter data 0 jika diperlukan
            const finalData = showZeroData ? dataWithLabels : filterZeroData(dataWithLabels)

            // Update statistik
            updateDataStats(finalData)

            // Update state
            setApiData(finalData)
            setLastUpdate(new Date())

            // Simpan ke cache
            setCachedData(finalData)

            if (finalData?.ringkasan_per_tahun?.length > 0) {
                const prediksiYear = finalData.ringkasan_per_tahun.find(
                    item => item.isPrediksi === true && !item.isZero
                )
                const defaultYear = prediksiYear || finalData.ringkasan_per_tahun.find(
                    item => !item.isZero
                ) || finalData.ringkasan_per_tahun[0]
                setSelectedYear(String(defaultYear.tahun))
            }

            setError(null)
            console.log('✅ Data fetched successfully')

        } catch (err) {
            console.error('❌ Gagal mengambil hasil prediksi:', err)

            // Fallback ke cache
            try {
                const cached = localStorage.getItem(cacheKey)
                if (cached) {
                    const { data } = JSON.parse(cached)
                    console.warn('⚠️ Using expired cache as fallback')
                    setApiData(data)
                    updateDataStats(data)
                    setLastUpdate(new Date())
                    setError('Data mungkin sudah tidak terbaru. Silakan refresh.')
                    return
                }
            } catch (e) {
                // Ignore
            }

            setError(err.message || 'Gagal terhubung ke server')
        } finally {
            if (isMountedRef.current) {
                setLoading(false)
                setIsRefreshing(false)
                setProgress('')
            }
        }
    }, [cacheKey, getCachedData, idJenisPajak, idModel, tahunMulai, tahunSelesai, setCachedData, getDataWithLabels, filterZeroData, showZeroData, updateDataStats])

    // Setup auto-refresh
    useEffect(() => {
        isMountedRef.current = true

        fetchMultiTahun()

        if (autoRefresh) {
            refreshTimerRef.current = setInterval(() => {
                if (isMountedRef.current) {
                    console.log('🔄 Auto-refreshing data...')
                    fetchMultiTahun(true)
                }
            }, AUTO_REFRESH_INTERVAL)
        }

        return () => {
            isMountedRef.current = false
            if (refreshTimerRef.current) {
                clearInterval(refreshTimerRef.current)
            }
        }
    }, [fetchMultiTahun, autoRefresh])

    // ===== TAMBAHAN: fetch data aktual bulanan (mentah) dari endpoint data-pajak =====
    // Dipisah dari effect multi-tahun di atas supaya tidak ganggu logic cache yang sudah ada.
    useEffect(() => {
        let mounted = true

        async function fetchActualMonthly() {
            try {
                setLoadingActualMonthly(true)
                setActualMonthlyError(null)

                const list = await getDataPajakList({ id_jenis_pajak: idJenisPajak })

                if (mounted) {
                    setRawActualMonthly(Array.isArray(list) ? list : [])
                }
            } catch (err) {
                console.error('❌ Gagal mengambil data pajak aktual bulanan:', err)
                if (mounted) setActualMonthlyError(err.message || 'Gagal mengambil data aktual')
            } finally {
                if (mounted) setLoadingActualMonthly(false)
            }
        }

        fetchActualMonthly()
        return () => { mounted = false }
    }, [idJenisPajak])

    const handleRefresh = useCallback(async () => {
        if (isRefreshing || loading) return
        await fetchMultiTahun(true)
    }, [fetchMultiTahun, isRefreshing, loading])

    const toggleShowZeroData = useCallback(() => {
        setShowZeroData(!showZeroData)
        fetchMultiTahun(true)
    }, [showZeroData, fetchMultiTahun])

    const toggleDebugMode = useCallback(() => {
        setIsDebugMode(!isDebugMode)
    }, [isDebugMode])

    // Debug function
    const handleDebug = useCallback(async () => {
        console.log('🔍 Debugging data...')
        try {
            const rawData = await getResultPredictionMultiTahun({
                id_jenis_pajak: idJenisPajak,
                id_model: idModel,
                tahun_mulai: tahunMulai,
                tahun_selesai: tahunSelesai,
                forceRefresh: true,
                showZeroData: true,
            })

            console.log('📊 Raw Response:', rawData)

            if (rawData?.ringkasan_per_tahun) {
                const ringkasan = rawData.ringkasan_per_tahun
                console.log(`Total tahun: ${ringkasan.length}`)

                const tableData = ringkasan.map(item => ({
                    Tahun: item.tahun,
                    'Total Prediksi': Number(item.total_prediksi || 0),
                    'Status': Number(item.total_prediksi || 0) === 0 ? '⚠️ ZERO' : '✅ VALID',
                    'MAPE': item.mape || '-',
                    'Model': item.model || '-'
                }))
                console.table(tableData)

                const zeroCount = ringkasan.filter(item => Number(item.total_prediksi || 0) === 0).length
                alert(`📊 Data: ${ringkasan.length} tahun, ${zeroCount} tahun memiliki nilai 0`)
            }
        } catch (error) {
            console.error('Debug error:', error)
            alert('Error saat debug: ' + error.message)
        }
    }, [idJenisPajak, idModel, tahunMulai, tahunSelesai])

    // Formatting functions
    const formatRp = (value) => {
        if (value === null || value === undefined || value === '') return 'Rp 0 M'
        const numberValue = Number(value)
        if (Number.isNaN(numberValue)) return 'Rp 0 M'
        const juta = numberValue / 1_000_000
        return `Rp ${juta.toFixed(2)} M`
    }

    const formatRpShort = (value) => {
        if (value === null || value === undefined || value === '') return 'Rp 0'
        const numberValue = Number(value)
        if (Number.isNaN(numberValue)) return 'Rp 0'
        if (Math.abs(numberValue) >= 1_000_000_000) {
            return `Rp ${(numberValue / 1_000_000_000).toFixed(1)}M`
        }
        if (Math.abs(numberValue) >= 1_000_000) {
            return `Rp ${(numberValue / 1_000_000).toFixed(1)}Jt`
        }
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(numberValue)
    }

    const formatPercent = (value) => {
        if (value === null || value === undefined || value === '') return '-'
        const numberValue = Number(value)
        if (Number.isNaN(numberValue)) return '-'
        return `${numberValue.toFixed(2)}%`
    }

    // Chart data
    // Chart data - Tampilkan semua data tanpa filter
    const getChartData = useMemo(() => {
        const ringkasan = apiData?.ringkasan_per_tahun || []

        // JANGAN filter data 0 - tampilkan semua
        // const validData = ringkasan.filter(item => !item.isZero)
        const validData = ringkasan // Tampilkan semua data

        if (!validData.length) return null

        const labels = validData.map(item => String(item.tahun))
        const nilaiData = validData.map(item => Number(item.total_prediksi || 0) / 1_000_000)
        const upperData = nilaiData.map(v => parseFloat((v * 1.1).toFixed(3)))
        const lowerData = nilaiData.map(v => parseFloat((v * 0.9).toFixed(3)))

        const selectedIndex = labels.indexOf(String(selectedYear))

        // Cek apakah data bernilai 0
        const isZeroData = (idx) => nilaiData[idx] === 0

        return {
            labels,
            datasets: [
                // ── Dataset 0: Historis ──────────────────────────────────────
                {
                    label: 'Historis',
                    data: nilaiData.map((val, idx) =>
                        validData[idx]?.isPrediksi ? null : val
                    ),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.05)',
                    pointBackgroundColor: (ctx) => {
                        const idx = ctx.dataIndex
                        return isZeroData(idx) ? '#9ca3af' : '#3b82f6'
                    },
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: nilaiData.map((_, idx) => {
                        const isPrediksi = validData[idx]?.isPrediksi || false
                        if (isPrediksi) return 0
                        if (isZeroData(idx)) return 3 // Titik kecil untuk data 0
                        return idx === selectedIndex ? 8 : 5
                    }),
                    borderWidth: 2.5,
                    tension: 0.35,
                    fill: false,
                    order: 1,
                    spanGaps: false,
                },
                // ── Dataset 1: Prediksi ──────────────────────────────────────
                {
                    label: 'Prediksi',
                    data: nilaiData.map((val, idx) =>
                        validData[idx]?.isPrediksi ? val : null
                    ),
                    borderColor: '#0d9488',
                    backgroundColor: 'rgba(13,148,136,0.05)',
                    pointBackgroundColor: '#0d9488',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: nilaiData.map((_, idx) => {
                        const isPrediksi = validData[idx]?.isPrediksi || false
                        if (!isPrediksi) return 0
                        return idx === selectedIndex ? 8 : 6
                    }),
                    borderWidth: 2.5,
                    borderDash: [6, 4],
                    tension: 0.35,
                    fill: false,
                    order: 1,
                    spanGaps: false,
                },
                // ── Dataset 2: Batas Atas ────────────────────────────────────
                {
                    label: 'Batas Atas',
                    data: upperData,
                    borderColor: 'rgba(13,148,136,0.35)',
                    backgroundColor: 'rgba(13,148,136,0.08)',
                    pointRadius: 0,
                    borderWidth: 1.5,
                    borderDash: [4, 4],
                    tension: 0.35,
                    fill: '+1',
                    order: 2,
                },
                // ── Dataset 3: Batas Bawah ──────────────────────────────────
                {
                    label: 'Batas Bawah',
                    data: lowerData,
                    borderColor: 'rgba(13,148,136,0.35)',
                    backgroundColor: 'transparent',
                    pointRadius: 0,
                    borderWidth: 1.5,
                    borderDash: [4, 4],
                    tension: 0.35,
                    fill: false,
                    order: 2,
                },
            ],
        }
    }, [apiData, selectedYear])

    // ===== TAMBAHAN: chart overlay aktual vs prediksi (bulanan, periode sama) =====
    // PENTING: baik "aktual" maupun "prediksi" SAMA-SAMA diambil dari rawActualMonthly
    // (endpoint data-pajak), dibedakan lewat field sumber_data. Ini memastikan chart
    // hanya menampilkan bulan yang BENAR-BENAR sudah diprediksi & tersimpan di database
    // — bukan hasil hitung on-the-fly untuk bulan yang belum pernah diprediksi.
    const overlayComparison = useMemo(() => {
        if (!rawActualMonthly.length) return null

        // 1) Pisahkan baris aktual & prediksi, key per "YYYY-MM"
        const aktualMap = new Map()
        const prediksiMap = new Map()

        rawActualMonthly.forEach((item) => {
            const key = String(item.tanggal_pajak).slice(0, 7) // "YYYY-MM"
            const nilai = Number(item.jumlah_pendapatan || 0)

            if (item.sumber_data === 'aktual') {
                aktualMap.set(key, (aktualMap.get(key) || 0) + nilai)
            } else if (item.sumber_data === 'prediksi') {
                prediksiMap.set(key, (prediksiMap.get(key) || 0) + nilai)
            }
        })

        // 2) HANYA bulan yang punya data prediksi tersimpan yang masuk sumbu-X
        const periodeKeys = Array.from(prediksiMap.keys()).sort()

        if (!periodeKeys.length) {
            return { chartData: null, jumlahOverlap: 0, jumlahBulan: 0, rataRataDeviasi: null }
        }

        const labels = periodeKeys.map((key) => {
            const d = new Date(`${key}-01`)
            return d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
        })

        const prediksiValues = periodeKeys.map((key) => prediksiMap.get(key) / 1_000_000)
        const aktualValues = periodeKeys.map((key) => {
            const nilai = aktualMap.get(key)
            return nilai !== undefined ? nilai / 1_000_000 : null
        })

        // 3) Deviasi rata-rata (%) hanya pada bulan yang punya KEDUA nilai
        let totalAbsDiff = 0
        let totalAktual = 0
        let jumlahOverlap = 0

        aktualValues.forEach((aktual, idx) => {
            if (aktual === null || aktual === undefined) return
            const prediksi = prediksiValues[idx]
            totalAbsDiff += Math.abs(aktual - prediksi)
            totalAktual += Math.abs(aktual)
            jumlahOverlap += 1
        })

        const rataRataDeviasi = totalAktual > 0
            ? (totalAbsDiff / totalAktual) * 100
            : null

        return {
            chartData: {
                labels,
                datasets: [
                    {
                        label: 'Aktual',
                        data: aktualValues,
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37,99,235,0.1)',
                        pointStyle: 'circle',
                        pointBackgroundColor: '#2563eb',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 9,
                        pointHoverBorderWidth: 3,
                        borderWidth: 3,
                        tension: 0.25,
                        fill: false,
                        spanGaps: false,
                        order: 1,
                    },
                    {
                        label: 'Prediksi model',
                        data: prediksiValues,
                        borderColor: '#d97706',
                        backgroundColor: 'rgba(217,119,6,0.1)',
                        pointStyle: 'triangle',
                        pointBackgroundColor: '#d97706',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 7,
                        pointHoverRadius: 10,
                        pointHoverBorderWidth: 3,
                        borderWidth: 3,
                        borderDash: [8, 5],
                        tension: 0.25,
                        fill: false,
                        spanGaps: false,
                        order: 2,
                    },
                ],
            },
            jumlahOverlap,
            jumlahBulan: periodeKeys.length,
            rataRataDeviasi,
        }
    }, [rawActualMonthly])

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        size: 12,
                    },
                },
            },
            tooltip: {
                backgroundColor: '#ffffff',
                borderColor: 'rgba(10,26,15,0.1)',
                borderWidth: 1,
                titleColor: '#071a12',
                bodyColor: '#52645b',
                padding: 12,
                cornerRadius: 10,
                callbacks: {
                    label: (ctx) => {
                        if (ctx.parsed.y === null) return null
                        const label = ctx.dataset.label || ''
                        return ` ${label}: Rp ${ctx.parsed.y.toFixed(2)}M`
                    },
                },
            },
        },
        scales: {
            x: {
                grid: { color: 'rgba(10,26,15,0.04)' },
                ticks: {
                    color: '#52645b',
                    font: { size: 12 },
                },
            },
            y: {
                grid: { color: 'rgba(10,26,15,0.04)' },
                ticks: {
                    color: '#52645b',
                    font: { size: 12 },
                    callback: (value) => `Rp ${Number(value).toFixed(1)}M`,
                },
            },
        },
    }

    const fadeUp = {
        hidden: { opacity: 0, y: 32, filter: 'blur(8px)' },
        visible: (index = 0) => ({
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            transition: {
                duration: 0.7,
                delay: index * 0.1,
                ease: [0.25, 0.46, 0.45, 0.94],
            },
        }),
    }

    // Render last update info
    const renderLastUpdate = () => {
        if (!lastUpdate) return null

        const diff = Math.floor((Date.now() - lastUpdate.getTime()) / 1000)
        const minutes = Math.floor(diff / 60)
        const seconds = diff % 60

        let timeText = 'baru saja'
        if (minutes > 0) {
            timeText = `${minutes}m ${seconds}s yang lalu`
        } else if (seconds > 0) {
            timeText = `${seconds}s yang lalu`
        }

        return (
            <div className="rps-last-update">
                <span className="rps-last-update-icon">🕐</span>
                <span>Update: {timeText}</span>
                {error && <span className="rps-last-update-warning">⚠️ {error}</span>}
            </div>
        )
    }

    // Render data warning - tampilkan informasi lengkap
    const renderDataWarning = () => {
        if (!dataStats) return null

        const zeroCount = dataStats.zeroCount || 0
        const totalData = dataStats.total || 0

        // Jika semua data valid, tidak perlu warning
        if (zeroCount === 0) {
            return (
                <div className="rps-data-info">

                </div>
            )
        }

        // Jika ada data 0
        return (
            <div className="rps-data-warning">
                <span className="rps-data-warning-icon">⚠️</span>
                <div>
                    <strong>Data 0 ditemukan:</strong>
                    <span> Tahun {dataStats.tahunZero?.join(', ')} tidak memiliki data (nilai 0).</span>
                    <button
                        type="button"
                        onClick={toggleShowZeroData}
                        className="rps-data-warning-btn"
                    >
                        {showZeroData ? 'Sembunyikan' : 'Tampilkan'} Data 0
                    </button>
                </div>
            </div>
        )
    }

    // Render empty chart
    const renderEmptyChart = () => {
        return (
            <div className="rps-chart-empty">
                <div className="rps-chart-empty-icon">📊</div>
                <div className="rps-chart-empty-text">Tidak ada data valid untuk ditampilkan</div>
                <div className="rps-chart-empty-sub">Pastikan data prediksi tersedia</div>
            </div>
        )
    }

    // Loading state
    if (loading && !apiData) {
        return (
            <section className="rps" id="hasil-prediksi">
                <div className="rps-inner" style={{ textAlign: 'center', padding: '6rem 0' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <svg
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#0d9488"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ animation: 'spin 1s linear infinite' }}
                        >
                            <path d="M21 12a9 9 0 11-6.219-8.56" />
                        </svg>
                    </div>
                    <p style={{ color: '#52645b', fontSize: '1rem', marginBottom: '0.5rem' }}>
                        {progress || 'Memuat data prediksi...'}
                    </p>
                    <p style={{ color: '#8a9e94', fontSize: '0.8rem' }}>
                        Mengambil data historis (2020-2025) dan prediksi 2026
                    </p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </section>
        )
    }

    // Error state
    if (error && !apiData) {
        return (
            <section className="rps" id="hasil-prediksi">
                <div className="rps-inner" style={{ textAlign: 'center', padding: '4rem 0' }}>
                    <p style={{ color: '#dc2626', fontSize: '1rem', marginBottom: '1rem' }}>
                        {error}
                    </p>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        style={{
                            padding: '0.6rem 1.5rem',
                            background: '#0d9488',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            opacity: isRefreshing ? 0.6 : 1,
                        }}
                    >
                        {isRefreshing ? 'Memuat...' : 'Coba Lagi'}
                    </button>
                </div>
            </section>
        )
    }

    const ringkasan = apiData?.ringkasan_per_tahun || []

    if (!ringkasan.length) {
        return (
            <section className="rps" id="hasil-prediksi">
                <div className="rps-inner" style={{ textAlign: 'center', padding: '4rem 0' }}>
                    <p style={{ color: '#52645b', fontSize: '1rem', marginBottom: '1rem' }}>
                        {showZeroData ? 'Semua data bernilai 0' : 'Belum ada data ringkasan prediksi yang bisa ditampilkan.'}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            style={{
                                padding: '0.6rem 1.5rem',
                                background: '#0d9488',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                            }}
                        >
                            {isRefreshing ? 'Memuat...' : 'Refresh'}
                        </button>
                        <button
                            type="button"
                            onClick={toggleShowZeroData}
                            style={{
                                padding: '0.6rem 1.5rem',
                                background: 'transparent',
                                color: '#0d9488',
                                border: '1px solid #0d9488',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                            }}
                        >
                            {showZeroData ? 'Sembunyikan Data 0' : 'Tampilkan Data 0'}
                        </button>
                    </div>
                </div>
            </section>
        )
    }

    // Cari data yang dipilih (prioritaskan yang valid)
    const selectedData = ringkasan.find(
        (item) => String(item.tahun) === String(selectedYear) && !item.isZero
    ) || ringkasan.find(item => !item.isZero) || ringkasan[0]

    // Hitung statistik
    const historisData = ringkasan.filter(item => item.isHistoris && !item.isZero)
    const prediksiData = ringkasan.filter(item => item.isPrediksi && !item.isZero)
    const totalHistoris = historisData.reduce((sum, item) => sum + Number(item.total_prediksi || 0), 0)
    const totalPrediksi = prediksiData.reduce((sum, item) => sum + Number(item.total_prediksi || 0), 0)

    // MAIN RENDER
    return (
        <section className="rps" id="hasil-prediksi" ref={sectionRef}>
            <div className="rps-inner">
                <motion.div
                    className="rps-header"
                    variants={fadeUp}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                >
                    <span className="rps-overline">Hasil Prediksi</span>

                    <h2 className="rps-title">
                        Proyeksi Penerimaan
                        <br />
                        PBB Multi-Tahun
                    </h2>

                    <p className="rps-sub">
                        Data historis <strong>2020-2025</strong> dan prediksi <strong>2026</strong>{' '}
                        menggunakan model <strong>{selectedData?.model || 'SMA'}</strong> dengan MAPE{' '}
                        <strong>{formatPercent(selectedData?.mape)}</strong>.
                    </p>
                    {renderDataWarning()}

                </motion.div>

                {/* Hero Section */}
                {selectedData && (
                    <motion.div
                        className={`rps-hero ${selectedData.isPrediksi ? 'rps-hero--prediksi' : 'rps-hero--historis'
                            } ${selectedData.isZero ? 'rps-hero--zero' : ''}`}
                        variants={fadeUp}
                        custom={0.15}
                        initial="hidden"
                        animate={isInView ? 'visible' : 'hidden'}
                        key={selectedYear}
                    >
                        <div className="rps-hero-badge">
                            <span className={`rps-hero-badge-dot ${selectedData.isPrediksi ? 'rps-hero-badge-dot--prediksi' : ''
                                } ${selectedData.isZero ? 'rps-hero-badge-dot--zero' : ''}`} />
                            {selectedData.isZero ? '⚠️ Tidak Ada Data' : (
                                selectedData.isPrediksi ? '🔮 Prediksi' : '📊 Historis'
                            )} {selectedYear}
                            {selectedData.isPrediksi && !selectedData.isZero && ' (Proyeksi)'}
                        </div>

                        <div className="rps-hero-value">
                            {selectedData.isZero ? '-' : formatRp(selectedData.total_prediksi)}
                        </div>

                        <div className="rps-hero-label">
                            {selectedData.isZero ? 'Data tidak tersedia' : (
                                `Total Penerimaan PBB ${selectedYear}${selectedData.isPrediksi ? ' (Proyeksi)' : ''
                                }`
                            )}
                        </div>

                        {selectedData.isPrediksi && !selectedData.isZero && (
                            <div className="rps-hero-range">
                                <div className="rps-hero-range-labels">
                                    <span>Batas Bawah</span>
                                    <span>Batas Atas</span>
                                </div>
                                <div className="rps-hero-range-bar">
                                    <div className="rps-hero-range-track">
                                        <div className="rps-hero-range-fill" />
                                        <div className="rps-hero-range-dot rps-hero-range-dot--left" />
                                        <div className="rps-hero-range-dot rps-hero-range-dot--center" />
                                        <div className="rps-hero-range-dot rps-hero-range-dot--right" />
                                    </div>
                                    <div className="rps-hero-range-values">
                                        <span>{formatRpShort(Number(selectedData.total_prediksi) * 0.9)}</span>
                                        <span>{formatRpShort(Number(selectedData.total_prediksi) * 1.1)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!selectedData.isZero && (
                            <div className="rps-hero-meta">
                                <div className="rps-hero-meta-item">
                                    <span className="rps-hero-meta-label">Model</span>
                                    <span className="rps-hero-meta-val">
                                        {selectedData.model || '-'}
                                    </span>
                                </div>
                                <div className="rps-hero-meta-divider" />
                                <div className="rps-hero-meta-item">
                                    <span className="rps-hero-meta-label">MAPE</span>
                                    <span className="rps-hero-meta-val">
                                        {formatPercent(selectedData.mape)}
                                    </span>
                                </div>
                                <div className="rps-hero-meta-divider" />
                                <div className="rps-hero-meta-item">
                                    <span className="rps-hero-meta-label">Rata/Bulan</span>
                                    <span className="rps-hero-meta-val">
                                        {formatRpShort(selectedData.rata_rata_bulan)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Table Section */}
                <motion.div
                    className="rps-divider"
                    variants={fadeUp}
                    custom={0.3}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                >
                    <span>Ringkasan Proyeksi</span>
                    {dataStats && dataStats.zeroCount > 0 && (
                        <span className="rps-divider-badge">
                            {dataStats.validCount} dari {dataStats.total} tahun valid
                        </span>
                    )}
                </motion.div>

                <motion.div
                    className="rps-table-wrap"
                    variants={fadeUp}
                    custom={0.4}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                >
                    <table className="rps-table">
                        <thead>
                            <tr>
                                <th>Tahun</th>
                                <th>Total</th>
                                <th>Rata/Bulan</th>
                                <th>MAPE</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ringkasan.map((row) => {
                                const isZero = row.isZero
                                const isPrediksi = row.isPrediksi || false
                                const isHistoris = row.isHistoris || false
                                const isActive = String(selectedYear) === String(row.tahun)

                                return (
                                    <tr
                                        key={row.tahun}
                                        className={`rps-table-row 
                                            ${isPrediksi && !isZero ? 'rps-table-row--prediksi' : ''} 
                                            ${isHistoris && !isZero ? 'rps-table-row--historis' : ''}
                                            ${isZero ? 'rps-table-row--zero' : ''}
                                            ${isActive ? 'rps-table-row--active' : ''}
                                        `}
                                        onClick={() => {
                                            if (!isZero) {
                                                setSelectedYear(String(row.tahun))
                                            }
                                        }}
                                    >
                                        <td className="rps-td-year">
                                            {row.tahun}
                                            {isPrediksi && !isZero && <span className="rps-td-badge">🔮</span>}
                                            {isZero && <span className="rps-td-badge rps-td-badge--zero">⚠️</span>}
                                        </td>
                                        <td className={`rps-td-prediksi ${isPrediksi && !isZero ? 'rps-td-prediksi--forecast' : ''
                                            } ${isZero ? 'rps-td-prediksi--zero' : ''}`}>
                                            {isZero ? 'Tidak Ada Data' : formatRpShort(row.total_prediksi)}
                                        </td>
                                        <td>{isZero ? '-' : formatRpShort(row.rata_rata_bulan)}</td>
                                        <td>{isZero ? '-' : formatPercent(row.mape)}</td>
                                        <td>
                                            <span className={`rps-status ${isZero ? 'rps-status--zero' :
                                                isPrediksi ? 'rps-status--prediksi' :
                                                    'rps-status--historis'
                                                }`}>
                                                {isZero ? '⚠️ Tidak Ada' : (
                                                    isPrediksi ? '🔮 Prediksi' : '📊 Historis'
                                                )}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </motion.div>

                {/* Chart Section */}
                <motion.div
                    className="rps-divider"
                    variants={fadeUp}
                    custom={0.5}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                >
                    <span>Tren Proyeksi (Historis vs Prediksi)</span>
                </motion.div>

                <motion.div
                    className="rps-chart-card"
                    variants={fadeUp}
                    custom={0.6}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                >
                    <div className="rps-chart-card-header">
                        <div className="rps-chart-card-header-left">
                            <span className="rps-chart-card-dot" />
                            <span className="rps-chart-card-title">
                                Total Penerimaan PBB ({ringkasan[0]?.tahun}–{ringkasan[ringkasan.length - 1]?.tahun})
                            </span>
                        </div>
                        <div className="rps-chart-card-legend">
                            <div className="rps-chart-card-legend-item">
                                <span className="rps-chart-card-legend-line rps-chart-card-legend-line--historic" />
                                Histori
                            </div>
                            <div className="rps-chart-card-legend-item">
                                <span className="rps-chart-card-legend-line rps-chart-card-legend-line--prediction" />
                                Prediksi
                            </div>
                            <div className="rps-chart-card-legend-item">
                                <span className="rps-chart-card-legend-line rps-chart-card-legend-line--dashed" />
                                Range
                            </div>
                        </div>
                    </div>
                    <div className="rps-chart-card-wrap">
                        {getChartData ? (
                            <Line data={getChartData} options={chartOptions} key={selectedYear} />
                        ) : (
                            renderEmptyChart()
                        )}
                    </div>
                    <div className="rps-chart-card-info">
                        💡 Garis putus-putus menunjukkan area prediksi. Area di sekitar garis menunjukkan rentang confidence interval.
                        {dataStats && dataStats.zeroCount > 0 && (
                            <span className="rps-chart-card-info-warning">
                                {' '}⚠️ {dataStats.zeroCount} tahun tidak memiliki data (nilai 0)
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* ===== TAMBAHAN: Chart overlay Aktual vs Prediksi (periode sama, bertumpuk) ===== */}
                <motion.div
                    className="rps-divider"
                    variants={fadeUp}
                    custom={0.7}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                >
                    <span>Perbandingan Aktual vs Prediksi Model (Bulanan)</span>
                    {overlayComparison && overlayComparison.jumlahOverlap > 0 && (
                        <span className="rps-divider-badge">
                            {overlayComparison.jumlahOverlap} bulan overlap · deviasi rata-rata{' '}
                            {formatPercent(overlayComparison.rataRataDeviasi)}
                        </span>
                    )}
                </motion.div>

                <motion.div
                    className="rps-chart-card"
                    variants={fadeUp}
                    custom={0.8}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                >
                    <div className="rps-chart-card-header">
                        <div className="rps-chart-card-header-left">
                            <span className="rps-chart-card-dot" />
                            <span className="rps-chart-card-title">
                                Nilai aktual vs hasil model pada periode yang sama
                            </span>
                        </div>
                        <div className="rps-chart-card-legend">
                            <div className="rps-chart-card-legend-item">
                                <span className="rps-chart-card-legend-line rps-chart-card-legend-line--historic" />
                                Aktual
                            </div>
                            <div className="rps-chart-card-legend-item">
                                <span className="rps-chart-card-legend-line rps-chart-card-legend-line--dashed" />
                                Prediksi model
                            </div>
                        </div>
                    </div>
                    <div className="rps-chart-card-wrap">
                        {loadingActualMonthly ? (
                            <div className="rps-chart-empty">
                                <div className="rps-chart-empty-text">Memuat data perbandingan...</div>
                            </div>
                        ) : actualMonthlyError ? (
                            <div className="rps-chart-empty">
                                <div className="rps-chart-empty-text">
                                    {actualMonthlyError}
                                </div>
                            </div>
                        ) : overlayComparison?.chartData ? (
                            <Line
                                data={overlayComparison.chartData}
                                options={{
                                    ...chartOptions,
                                    interaction: {
                                        mode: 'index',
                                        intersect: false,
                                    },
                                    plugins: {
                                        ...chartOptions.plugins,
                                        tooltip: {
                                            ...chartOptions.plugins.tooltip,
                                            mode: 'index',
                                            intersect: false,
                                            callbacks: {
                                                label: (ctx) => {
                                                    if (ctx.parsed.y === null) return null
                                                    return ` ${ctx.dataset.label}: Rp ${ctx.parsed.y.toFixed(2)}M`
                                                },
                                            },
                                        },
                                    },
                                    scales: {
                                        ...chartOptions.scales,
                                        x: {
                                            ...chartOptions.scales.x,
                                            grid: { color: 'rgba(10,26,15,0.06)' },
                                        },
                                        y: {
                                            ...chartOptions.scales.y,
                                            grid: { color: 'rgba(10,26,15,0.08)' },
                                        },
                                    },
                                }}
                            />
                        ) : (
                            renderEmptyChart()
                        )}
                    </div>
                    <div className="rps-chart-card-info">
                        💡 Kedua garis digambar pada sumbu bulan yang sama. Semakin dekat garis oranye (prediksi)
                        dengan garis biru (aktual), semakin akurat model pada periode tersebut.
                        {overlayComparison && overlayComparison.jumlahOverlap === 0 && (
                            <span className="rps-chart-card-info-warning">
                                {' '}⚠️ Belum ada bulan yang punya data aktual dan prediksi bersamaan untuk dibandingkan.
                            </span>
                        )}
                    </div>
                </motion.div>
            </div>
        </section>
    )
}