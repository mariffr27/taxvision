// components/predictionSection/PredictionSection.jsx
import React, { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import './PredictionSection.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const namaBulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const CHART_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: '#fff',
            borderColor: 'rgba(10,26,15,0.1)',
            borderWidth: 1,
            titleColor: '#071a12',
            bodyColor: '#52645b',
            padding: 12,
            cornerRadius: 10,
            callbacks: {
                label: ctx => ` ${ctx.dataset.label}: Rp ${(ctx.parsed.y / 1000000).toFixed(2)}M`,
            },
        },
    },
    scales: {
        x: {
            grid: { color: 'rgba(10,26,15,0.04)', drawBorder: false },
            ticks: { font: { size: 12 }, color: '#52645b' },
            border: { display: false },
        },
        y: {
            grid: { color: 'rgba(10,26,15,0.04)', drawBorder: false },
            ticks: {
                font: { size: 12 },
                color: '#52645b',
                callback: v => 'Rp ' + (v / 1000000).toFixed(1) + 'M',
            },
            border: { display: false },
        },
    },
}

export default function PredictionSection() {
    const sectionRef = useRef(null)
    // const isInView = useInView(sectionRef, { once: true, margin: '-80px', amount: 0.05 })
    const isInView = true
    const [apiData, setApiData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                // Ambil list hasil prediksi
                const listRes = await fetch('http://127.0.0.1:8000/api/hasil-prediksi')
                const listResult = await listRes.json()

                if (listResult.success && listResult.data.length > 0) {
                    // Ambil ID terbaru (paling atas karena order desc)
                    const latestId = listResult.data[0].id

                    // Ambil detailnya
                    const detailRes = await fetch(`http://127.0.0.1:8000/api/prediksi/detail/${latestId}`)
                    const detailResult = await detailRes.json()

                    if (detailResult.success) {
                        setApiData(detailResult.data)
                    } else {
                        setError('Detail prediksi tidak ditemukan untuk ID ' + latestId)
                    }
                } else {
                    setError('Belum ada data prediksi')
                }
            } catch (err) {
                console.error('Error:', err)
                setError('Gagal terhubung ke server')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <section className="prs" id="proses-prediksi">
                <div className="prs-inner" style={{ textAlign: 'center', padding: '4rem 0' }}>
                    <p style={{ color: '#52645b' }}>Memuat data prediksi...</p>
                </div>
            </section>
        )
    }

    if (error) {
        return (
            <section className="prs" id="proses-prediksi">
                <div className="prs-inner" style={{ textAlign: 'center', padding: '4rem 0' }}>
                    <p style={{ color: '#dc2626' }}>{error}</p>
                </div>
            </section>
        )
    }

    // Process API data
    const modelDiuji = apiData?.model_diuji || []
    const modelTerbaik = apiData?.model_terbaik || {}
    const anomaliInfo = apiData?.anomali || {}
    const pembagianData = apiData?.pembagian_data || {}
    const jumlahData = apiData?.jumlah_data_bulanan || 0
    const confidenceRange = apiData?.confidence_range || {}
    const nilaiPrediksi = apiData?.nilai_prediksi || 0

    const mape = (modelTerbaik?.mape || 0) / 100

    // hitung batas bawah & atas
    const batasBawah = nilaiPrediksi * (1 - mape)
    const batasAtas = nilaiPrediksi * (1 + mape)

    // optional info
    const basisRange = `MAPE ${modelTerbaik?.mape || 0}%`

    // Process anomali data
    const anomaliData = []
    if (apiData?.model_diuji) {
        // Cari data anomali dari model terbaik
        const bestModel = modelDiuji.find(m => m.model === modelTerbaik.model)
        // Anomali info dari API
        if (anomaliInfo.jumlah_terdeteksi > 0) {
            // Placeholder — data anomali detail tidak disimpan di response ini
            // Bisa ditambahkan nanti
        }
    }

    // Process evaluation chart data
    const getEvalChartData = () => {
        if (!modelTerbaik.model) return null

        const bestModel = modelDiuji.find(m => m.model === modelTerbaik.model)
        if (!bestModel?.evaluasi) return null

        // Data historis (testing)
        const labels = bestModel.evaluasi.map(e => namaBulan[e.bulan - 1])
        const aktualData = bestModel.evaluasi.map(e => e.aktual)

        // 👉 Ambil bulan terakhir
        const lastIndex = bestModel.evaluasi.length - 1
        const lastBulan = bestModel.evaluasi[lastIndex].bulan

        // 👉 Hitung bulan berikutnya
        const nextBulan = lastBulan === 12 ? 1 : lastBulan + 1
        const nextLabel = namaBulan[nextBulan - 1]

        // 👉 Tambahkan label baru
        const newLabels = [...labels, nextLabel]

        // 👉 Data aktual berhenti di terakhir
        const newAktual = [...aktualData, null]

        // 👉 Prediksi hanya muncul di titik terakhir (future)
        const newPrediksi = [
            ...Array(labels.length).fill(null),
            nilaiPrediksi
        ]

        return {
            labels: newLabels,
            datasets: [
                {
                    label: 'Aktual',
                    data: newAktual,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34,197,94,0.05)',
                    pointBackgroundColor: '#22c55e',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    borderWidth: 2.5,
                    tension: 0.35,
                    fill: false,
                },
                {
                    label: `Prediksi ${modelTerbaik.model}`,
                    data: newPrediksi,
                    borderColor: '#0d9488',
                    backgroundColor: 'rgba(13,148,136,0.05)',
                    pointBackgroundColor: '#0d9488',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    borderWidth: 2,
                    borderDash: [6, 4],
                    tension: 0.35,
                    fill: false,
                },
            ],
        }
    }

    const chartData = getEvalChartData()

    // Format currency
    const formatRp = (value) => {
        const m = value / 1000000
        return `Rp ${m.toFixed(1)} M`
    }

    const formatRpFull = (value) => {
        return 'Rp ' + value.toLocaleString('id-ID')
    }

    const fadeUp = {
        hidden: { opacity: 0, y: 32, filter: 'blur(8px)' },
        visible: (i = 0) => ({
            opacity: 1, y: 0, filter: 'blur(0px)',
            transition: { duration: 0.7, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] },
        }),
    }

    return (
        <section className="prs" id="proses-prediksi" ref={sectionRef}>
            <div className="prs-inner">

                {/* ── HEADER ── */}
                <motion.div className="prs-header" variants={fadeUp} custom={0} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                    <span className="prs-overline">Proses Prediksi</span>
                    <h2 className="prs-title">Bagaimana Sistem<br />Memprediksi</h2>
                    <p className="prs-sub">
                        5 tahapan berurutan — dari pengumpulan data mentah hingga nilai prediksi
                        final beserta confidence range-nya.
                    </p>
                </motion.div>

                {/* ═══ STEP 1 — KUMPULKAN DATA HISTORIS ═══ */}
                <motion.div className="prs-step" variants={fadeUp} custom={0.1} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                    <div className="prs-step-left">
                        <div className="prs-step-num">01</div>
                        <div className="prs-step-line" />
                    </div>
                    <div className="prs-step-right">
                        <h3 className="prs-step-title">Kumpulkan Data Historis</h3>
                        <p className="prs-step-body">
                            Sistem mengambil data penerimaan PBB per bulan selama{' '}
                            <strong>5 tahun terakhir ({jumlahData} bulan)</strong> dari database BPKPD
                            Kabupaten Magetan. Data dikelompokkan per tahun dan bulan, diurutkan dari yang terlama ke terbaru.
                        </p>
                        <div className="prs-stats">
                            <div className="prs-stat">
                                <span className="prs-stat-val">{jumlahData}</span>
                                <span className="prs-stat-label">Bulan data</span>
                            </div>
                            <div className="prs-stat">
                                <span className="prs-stat-val">{apiData?.periode_data || '-'}</span>
                                <span className="prs-stat-label">Rentang waktu</span>
                            </div>
                            <div className="prs-stat">
                                <span className="prs-stat-val">BPKPD</span>
                                <span className="prs-stat-label">Sumber data</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="prs-divider"><span>Langkah 2</span></div>

                {/* ═══ STEP 2 — DETEKSI & KOREKSI ANOMALI ═══ */}
                <motion.div className="prs-step" variants={fadeUp} custom={0.2} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                    <div className="prs-step-left">
                        <div className="prs-step-num prs-step-num--warning">02</div>
                        <div className="prs-step-line" />
                    </div>
                    <div className="prs-step-right">
                        <h3 className="prs-step-title">Deteksi & Koreksi Anomali</h3>
                        <p className="prs-step-body">
                            Setiap bulan diperiksa terhadap bulan sebelumnya. Jika perubahan melebihi{' '}
                            <strong>±{anomaliInfo.threshold || '20%'}</strong>, nilai di-cap ke batas wajar.
                            Langkah ini mencegah satu bulan ekstrem mendistorsi seluruh model prediksi.
                        </p>
                        <div className="prs-info-box prs-info-box--warning">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                            </svg>
                            <div>{anomaliInfo.keterangan || 'Tidak ada anomali terdeteksi'}</div>
                        </div>
                    </div>
                </motion.div>

                <div className="prs-divider"><span>Langkah 3</span></div>

                {/* ═══ STEP 3 — BAGI TRAINING & TESTING ═══ */}
                <motion.div className="prs-step" variants={fadeUp} custom={0.3} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                    <div className="prs-step-left">
                        <div className="prs-step-num">03</div>
                        <div className="prs-step-line" />
                    </div>
                    <div className="prs-step-right">
                        <h3 className="prs-step-title">Bagi Data Training & Testing</h3>
                        <p className="prs-step-body">
                            Data bersih dibagi menjadi dua kelompok dengan rasio{' '}
                            <strong>{pembagianData.rasio || '80:20'}</strong>. Data training digunakan untuk menghitung
                            Simple Moving Average, sedangkan data testing digunakan untuk mengukur akurasi.
                        </p>
                        <div className="prs-split">
                            <div className="prs-split-row">
                                <div className="prs-split-row-head">
                                    <span className="prs-split-label">Training 80%</span>
                                    <span className="prs-split-detail">{pembagianData.training || 0} bulan</span>
                                </div>
                                <div className="prs-split-track">
                                    <motion.div className="prs-split-fill" style={{ background: '#0d9488', width: '80%' }}
                                        initial={{ width: 0 }} animate={isInView ? { width: '80%' } : { width: 0 }}
                                        transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }} />
                                </div>
                            </div>
                            <div className="prs-split-row">
                                <div className="prs-split-row-head">
                                    <span className="prs-split-label">Testing 20%</span>
                                    <span className="prs-split-detail">{pembagianData.testing || 0} bulan</span>
                                </div>
                                <div className="prs-split-track">
                                    <motion.div className="prs-split-fill" style={{ background: '#9dcec8', width: '20%' }}
                                        initial={{ width: 0 }} animate={isInView ? { width: '20%' } : { width: 0 }}
                                        transition={{ duration: 0.8, delay: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="prs-divider"><span>Langkah 4</span></div>

                {/* ═══ STEP 4 — UJI 3 MODEL SMA ═══ */}
                <motion.div className="prs-step" variants={fadeUp} custom={0.4} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                    <div className="prs-step-left">
                        <div className="prs-step-num">04</div>
                        <div className="prs-step-line" />
                    </div>
                    <div className="prs-step-right">
                        <h3 className="prs-step-title">Uji Model SMA & Pilih Terbaik</h3>
                        <p className="prs-step-body">
                            Sistem menguji <strong>SMA-1</strong>, sampai dengan {' '}
                            <strong>SMA-12</strong>. Model dengan{' '}
                            <strong>MAPE terkecil</strong> dipilih otomatis.
                        </p>
                        <div className="prs-models">
                            {modelDiuji.map(m => (
                                <div key={m.model} className={`prs-model ${m.model === modelTerbaik.model ? 'prs-model--best' : ''}`}>
                                    <div className="prs-model-top">
                                        <span className="prs-model-name">{m.model}</span>
                                        {m.model === modelTerbaik.model && <span className="prs-model-badge">★ Terbaik</span>}
                                    </div>
                                    <div className={`prs-model-mape ${m.model === modelTerbaik.model ? 'accent' : ''}`}>
                                        {m.mape}%
                                    </div>
                                    <div className="prs-model-period">{m.periode_sma} bulan terakhir</div>
                                </div>
                            ))}
                        </div>
                        <div className="prs-info-box prs-info-box--success">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" />
                            </svg>
                            <div>
                                <strong>{modelTerbaik.model} dipilih</strong> — MAPE {modelTerbaik.mape}%
                                termasuk kategori sangat akurat.
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="prs-divider"><span>Langkah 5</span></div>

                {/* ═══ STEP 5 — EVALUASI & PREDIKSI FINAL ═══ */}
                <motion.div className="prs-step" variants={fadeUp} custom={0.5} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                    <div className="prs-step-left">
                        <div className="prs-step-num prs-step-num--success">05</div>
                    </div>
                    <div className="prs-step-right">
                        <h3 className="prs-step-title">Evaluasi Model & Prediksi Final</h3>
                        <p className="prs-step-body">
                            Model {modelTerbaik.model} dievaluasi pada data testing. Setelah terbukti akurat,
                            model dijalankan ulang menggunakan seluruh data untuk menghasilkan prediksi final.
                        </p>

                        {/* Chart */}
                        {chartData && (
                            <div className="prs-chart-card">
                                <div className="prs-chart-head">
                                    <div className="prs-chart-head-left">
                                        <span className="prs-chart-dot" />
                                        <span className="prs-chart-title">
                                            Aktual vs Prediksi {modelTerbaik.model} — Data Testing
                                        </span>
                                    </div>
                                    <div className="prs-chart-legend">
                                        <div className="prs-chart-legend-item">
                                            <span className="prs-chart-legend-sq" style={{ background: '#22c55e' }} />Aktual
                                        </div>
                                        <div className="prs-chart-legend-item">
                                            <span className="prs-chart-legend-dash" />Prediksi {modelTerbaik.model}
                                        </div>
                                    </div>
                                </div>
                                <div className="prs-chart-wrap">
                                    <Line data={chartData} options={CHART_OPTIONS} />
                                </div>
                            </div>
                        )}

                        {/* Result metrics */}
                        <div className="prs-result-metrics">
                            <div className="prs-result-metric">
                                <span className="prs-result-metric-label">Nilai prediksi</span>
                                <span className="prs-result-metric-val accent">{formatRp(nilaiPrediksi)}</span>
                            </div>
                            <div className="prs-result-metric">
                                <span className="prs-result-metric-label">Batas bawah</span>
                                <span className="prs-result-metric-val">{formatRp(batasBawah)}</span>
                            </div>
                            <div className="prs-result-metric">
                                <span className="prs-result-metric-label">Batas atas</span>
                                <span className="prs-result-metric-val">{formatRp(batasAtas)}</span>
                            </div>
                            <div className="prs-result-metric">
                                <span className="prs-result-metric-label">Basis range</span>
                                <span className="prs-result-metric-val">{basisRange || '-'}</span>
                            </div>
                        </div>

                        <div className="prs-info-box prs-info-box--success">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" />
                            </svg>
                            <div>
                                Hasil prediksi dan seluruh metrik akurasi disimpan ke database untuk kebutuhan perencanaan fiskal daerah.
                            </div>
                        </div>
                    </div>
                </motion.div>

            </div>
        </section>
    )
}