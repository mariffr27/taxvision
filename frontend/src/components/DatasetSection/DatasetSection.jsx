// components/datasetSection/DatasetSection.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import './DatasetSection.css'

const datasetInfo = [
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
        ),
        title: 'Periode Data',
        desc: 'Januari 2021 – Desember 2025',
        value: '60 Bulan',
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path d="M12 8v4l2 2" />
            </svg>
        ),
        title: 'Frekuensi',
        desc: 'Pencatatan setiap bulan',
        value: 'Bulanan',
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
        ),
        title: 'Sumber Data',
        desc: 'Badan Pengelolaan Keuangan dan Pendapatan Daerah',
        value: 'BPKPD Magetan',
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
        ),
        title: 'Total Records',
        desc: 'Keseluruhan data historis PBB',
        value: '60 Records',
    },
]

const namaBulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export default function DatasetSection() {
    const sectionRef = useRef(null)
    const inView = useInView(sectionRef, { once: true, amount: 0.05 })
    const [isInView, setIsInView] = useState(false)
    const [selectedYear, setSelectedYear] = useState(null)
    const [codeExpanded, setCodeExpanded] = useState(false)
    const [copied, setCopied] = useState(false)
    const [apiData, setApiData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Fix: Fallback timer
    useEffect(() => {
        if (inView) {
            setIsInView(true)
        } else {
            const timer = setTimeout(() => setIsInView(true), 2500)
            return () => clearTimeout(timer)
        }
    }, [inView])

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                const response = await fetch(
                    'http://127.0.0.1:8000/api/data-pajak'
                )

                console.log("STATUS:", response.status)

                const result = await response.json()

                console.log("DATA API:", result)

                if (result.success) {
                    setApiData(result.data)
                } else {
                    setError('Gagal mengambil data')
                }

            } catch (err) {
                console.error("FETCH ERROR:", err)
                setError('Gagal terhubung ke server')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const processApiData = () => {
        if (!apiData.length) return { yearlySummary: [], monthlyDetail: {}, totalBulan: 0, tahunMin: '', tahunMax: '' }

        const sorted = [...apiData].sort((a, b) => new Date(a.tanggal_pajak) - new Date(b.tanggal_pajak))
        const groupedByYear = {}

        sorted.forEach(item => {
            const date = new Date(item.tanggal_pajak)
            const tahun = date.getFullYear()
            const bulan = date.getMonth()

            if (!groupedByYear[tahun]) groupedByYear[tahun] = []

            const nilaiM = parseFloat(item.jumlah_pendapatan) / 1000000

            groupedByYear[tahun].push({
                bulan: namaBulan[bulan],
                nilai: nilaiM,
            })
        })

        const years = Object.keys(groupedByYear).sort()
        const splitIndex = Math.floor(years.length * 0.8)

        const yearlySummary = years.map((tahun, i) => {
            const dataTahun = groupedByYear[tahun]
            const total = dataTahun.reduce((sum, item) => sum + item.nilai, 0)
            const rata = total / dataTahun.length
            let trenStr = '+0.0%'
            if (i > 0) {
                const prevTotal = groupedByYear[years[i - 1]].reduce((s, item) => s + item.nilai, 0)
                const tren = ((total - prevTotal) / prevTotal) * 100
                trenStr = `${tren >= 0 ? '+' : ''}${tren.toFixed(1)}%`
            }
            return {
                tahun,
                total: `Rp ${total.toFixed(1)} M`,
                rataRata: `Rp ${rata.toFixed(2)} M`,
                tren: trenStr,
                up: !trenStr.startsWith('-'),
                status: i >= splitIndex ? 'Testing' : 'Training',
            }
        })

        const monthlyDetail = {}
        years.forEach(tahun => {
            monthlyDetail[tahun] = groupedByYear[tahun]
        })

        return {
            yearlySummary,
            monthlyDetail,
            totalBulan: apiData.length,
            tahunMin: years[0],
            tahunMax: years[years.length - 1],
        }
    }

    const { yearlySummary, monthlyDetail, totalBulan, tahunMin, tahunMax } = processApiData()

    const updatedDatasetInfo = datasetInfo.map(item => {
        if (item.title === 'Periode Data') return { ...item, value: `${totalBulan} Bulan`, desc: `Januari ${tahunMin} – Desember ${tahunMax}` }
        if (item.title === 'Total Records') return { ...item, value: `${totalBulan} Records` }
        return item
    })

    const splitIndex = Math.floor(totalBulan * 0.9)

    const fadeUp = {
        hidden: { opacity: 0, y: 32, filter: 'blur(8px)' },
        visible: (i = 0) => ({
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            transition: { duration: 0.7, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
        }),
    }

    const handleCopy = useCallback(() => {
        const code = `$response = Http::get('http://127.0.0.1:8000/api/data-pajak');
$data = $response->json();
$splitIndex = (int) floor(count($data) * 0.9);`
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }, [])

    if (loading) {
        return (
            <section className="dss" id="dataset">
                <div className="dss-inner" style={{ textAlign: 'center', padding: '4rem 0' }}>
                    <p style={{ color: '#52645b', fontSize: '1rem' }}>Memuat data...</p>
                </div>
            </section>
        )
    }

    if (error) {
        return (
            <section className="dss" id="dataset">
                <div className="dss-inner" style={{ textAlign: 'center', padding: '4rem 0' }}>
                    <p style={{ color: '#dc2626', fontSize: '1rem' }}>{error}</p>
                </div>
            </section>
        )
    }

    return (
        <section className="dss" id="dataset" ref={sectionRef}>
            <div className="dss-inner">

                <motion.div className="dss-header" variants={fadeUp} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                    <span className="dss-overline">Dataset</span>
                    <h2 className="dss-title">Data Historis<br />Penerimaan PBB</h2>
                    <p className="dss-sub">
                        Dataset pelatihan dan pengujian model prediksi penerimaan Pajak Bumi dan Bangunan.
                    </p>
                </motion.div>

                <motion.div className="dss-cards" variants={fadeUp} custom={0.2} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                    {updatedDatasetInfo.map((item, i) => (
                        <div key={item.title} className={`dss-card ${i < 3 ? 'dss-card--bordered' : ''}`}>
                            <div className="dss-card-top">
                                <div className="dss-card-icon">{item.icon}</div>
                                <span className="dss-card-value">{item.value}</span>
                            </div>
                            <h4 className="dss-card-title">{item.title}</h4>
                            <p className="dss-card-desc">{item.desc}</p>
                        </div>
                    ))}
                </motion.div>

                <motion.div className="dss-split" variants={fadeUp} custom={0.4} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                    <div className="dss-split-header">
                        <span className="dss-split-dot" />
                        <span className="dss-split-label">Pembagian Dataset</span>
                    </div>

                    <div className="dss-split-bars">
                        <div className="dss-split-row">
                            <div className="dss-split-row-header">
                                <span className="dss-split-name">Data Training</span>
                                <span className="dss-split-pct">90%</span>
                            </div>
                            <div className="dss-split-track">
                                <motion.div
                                    className="dss-split-fill dss-split-fill--training"
                                    initial={{ width: '0%' }}
                                    animate={isInView ? { width: '90%' } : { width: '0%' }}
                                    transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                                />
                            </div>
                            <span className="dss-split-detail">{splitIndex} Bulan</span>
                        </div>

                        <div className="dss-split-row">
                            <div className="dss-split-row-header">
                                <span className="dss-split-name">Data Testing</span>
                                <span className="dss-split-pct">10%</span>
                            </div>
                            <div className="dss-split-track">
                                <motion.div
                                    className="dss-split-fill dss-split-fill--testing"
                                    initial={{ width: '0%' }}
                                    animate={isInView ? { width: '10%' } : { width: '0%' }}
                                    transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                                />
                            </div>
                            <span className="dss-split-detail">{totalBulan - splitIndex} Bulan</span>
                        </div>
                    </div>

                    <button className="dss-code-toggle" onClick={() => setCodeExpanded(!codeExpanded)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ transform: codeExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                        <span>{codeExpanded ? 'Sembunyikan Kode' : 'Lihat Kode'}</span>
                    </button>

                    {codeExpanded && (
                        <motion.div className="dss-code-inline" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.35, ease: 'easeOut' }}>
                            <div className="dss-code-inline-header">
                                <svg className="dss-code-inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="16 18 22 12 16 6" />
                                    <polyline points="8 6 2 12 8 18" />
                                </svg>
                                <span className="dss-code-inline-label">PrediksiService.php</span>
                                <button className="dss-code-inline-copy" onClick={handleCopy}>
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <pre className="dss-code-inline-pre">
                                <code>{`$response = Http::get('http://127.0.0.1:8000/api/data-pajak');
$data = $response->json();
$splitIndex = (int) floor(count($data) * 0.9);`}</code>
                            </pre>
                        </motion.div>
                    )}

                    <div className="dss-split-note">
                        <svg className="dss-split-note-icon" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4M12 8h.01" />
                        </svg>
                        <p className="dss-split-note-text">
                            Data training digunakan untuk menghitung rata-rata bergerak (SMA 60 bulan).
                            Data testing digunakan untuk mengevaluasi akurasi prediksi menggunakan metrik MAPE, MAE, dan RMSE.
                        </p>
                    </div>
                </motion.div>

                <motion.div className="dss-divider" variants={fadeUp} custom={0.6} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                    <span>Ringkasan Tahunan</span>
                </motion.div>

                {yearlySummary.length > 0 && (
                    <motion.div className="dss-table-wrap" variants={fadeUp} custom={0.7} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                        <table className="dss-table">
                            <thead>
                                <tr>
                                    <th>Tahun</th>
                                    <th>Total</th>
                                    <th>Rata-rata/Bulan</th>
                                    <th>Tren</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {yearlySummary.map((row, i) => (
                                    <motion.tr
                                        key={row.tahun}
                                        className={`dss-tr-clickable ${selectedYear === row.tahun ? 'dss-tr--expanded' : ''}`}
                                        variants={fadeUp}
                                        custom={0.8 + i * 0.07}
                                        initial="hidden"
                                        animate={isInView ? 'visible' : 'hidden'}
                                    >
                                        <td className="dss-td-year">{row.tahun}</td>
                                        <td className="dss-td-real">{row.total}</td>
                                        <td>{row.rataRata}</td>
                                        <td>
                                            <span className={`dss-badge ${row.up ? 'dss-badge--up' : 'dss-badge--down'}`}>
                                                {row.tren}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`dss-status ${row.status === 'Testing' ? 'dss-status--testing' : 'dss-status--training'}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className={`dss-expand-btn ${selectedYear === row.tahun ? 'dss-expand-btn--active' : ''}`}
                                                onClick={() => setSelectedYear(selectedYear === row.tahun ? null : row.tahun)}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                )}

                {selectedYear && monthlyDetail[selectedYear] && (
                    <motion.div className="dss-detail-wrap" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}>
                        <div className="dss-detail-inner">
                            <div className="dss-detail-header">
                                <span className="dss-detail-dot" />
                                <span className="dss-detail-title">Detail Bulanan — {selectedYear}</span>
                                <span className="dss-detail-badge">
                                    {yearlySummary.find(y => y.tahun === selectedYear)?.status}
                                </span>
                            </div>
                            <div className="dss-detail-grid">
                                {monthlyDetail[selectedYear].map((item, i) => (
                                    <div key={item.bulan} className="dss-detail-item">
                                        <span className="dss-detail-month">{item.bulan}</span>
                                        <div className="dss-detail-bar-wrap">
                                            <motion.div
                                                className="dss-detail-bar"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min((item.nilai / 12) * 100, 100)}%` }}
                                                transition={{ duration: 0.6, delay: i * 0.04, ease: 'easeOut' }}
                                            />
                                        </div>
                                        <span className="dss-detail-val">Rp {item.nilai.toFixed(1)}M</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    )
}