import React, { useEffect, useRef, useState } from 'react'
import { getPredictionOverview } from '../../services/predictionOverviewService'
import './PredictionHeader.css'

function useInView(threshold = 0.15) {
    const ref = useRef(null)
    const [inView, setInView] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true)
                    observer.unobserve(entry.target)
                }
            },
            { threshold }
        )

        if (ref.current) observer.observe(ref.current)

        return () => observer.disconnect()
    }, [threshold])

    return [ref, inView]
}

const DEFAULT_OVERVIEW = {
    judul: 'Prediksi Penerimaan',
    judul_aksen: 'Pajak Bumi & Bangunan',
    total_bulan_historis: 0,
    metode_proyeksi: 'SMA',
    mape_label: '-',
    pertanyaan_utama: 'Bagaimana memproyeksikan penerimaan PBB bulan depan dari data historis secara akurat dan andal?',
}

export default function PredictionHeader() {
    const [ref, inView] = useInView(0.15)

    const [overview, setOverview] = useState(DEFAULT_OVERVIEW)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        const loadOverview = async () => {
            try {
                setLoading(true)

                const response = await getPredictionOverview()
                const data = response.data || DEFAULT_OVERVIEW

                if (isMounted) {
                    setOverview({
                        ...DEFAULT_OVERVIEW,
                        ...data,
                    })
                }
            } catch (err) {
                console.error('Gagal load prediction overview:', err)

                if (isMounted) {
                    setOverview(DEFAULT_OVERVIEW)
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        loadOverview()

        return () => {
            isMounted = false
        }
    }, [])

    const stats = [
        {
            icon: 'ti-database',
            value: loading ? '...' : String(overview.total_bulan_historis || 0),
            label: 'Bulan data historis',
        },
        {
            icon: 'ti-chart-line',
            value: loading ? '...' : overview.metode_proyeksi || 'SMA',
            label: 'Metode proyeksi',
        },
        {
            icon: 'ti-target',
            value: loading ? '...' : overview.mape_label || '-',
            label: 'MAPE rata-rata',
        },
    ]

    return (
        <header ref={ref} className={`ph-root ${inView ? 'ph-root--visible' : ''}`}>
            {/* Top bar */}
            <nav className="ph-topbar" aria-label="Navigasi atas">

            </nav>

            {/* Main content */}
            <div className="ph-body">
                {/* Eyebrow */}
                <div className="ph-eyebrow">
                    <div className="ph-eyebrow-pip" />
                    Overview
                    <div className="ph-eyebrow-pip" />
                </div>

                {/* Headline */}
                <h1 className="ph-headline">
                    {overview.judul}<br />
                    <span className="ph-headline-accent">
                        {overview.judul_aksen}
                    </span>
                </h1>

                {/* Subhead */}
                <p className="ph-subhead">
                    Proyeksi berbasis data historis menggunakan metode{' '}
                    <em>{overview.metode_proyeksi || 'Simple Moving Average'}</em> — transparan,
                    terukur, dan dapat direplikasi.
                </p>

                {/* Stat cards */}
                <div className="ph-cards">
                    {stats.map(({ icon, value, label }) => (
                        <div className="ph-card" key={label}>
                            <div className="ph-card-icon" aria-hidden="true">
                                <i className={`ti ${icon}`} />
                            </div>
                            <div className="ph-card-value">{value}</div>
                            <div className="ph-card-label">{label}</div>
                        </div>
                    ))}
                </div>

                {/* Info box */}
                <div className="ph-info-row">
                    <div className="ph-info-icon" aria-hidden="true">
                        <i className="ti ti-bulb" />
                    </div>

                    <div>
                        <p className="ph-info-label">Pertanyaan utama</p>
                        <p className="ph-info-text">
                            {overview.pertanyaan_utama}{' '}
                            {overview.total_bulan_historis > 0 && (
                                <>
                                    Sistem saat ini membaca{' '}
                                    <strong>{overview.total_bulan_historis} bulan data historis</strong>.
                                </>
                            )}
                        </p>
                    </div>
                </div>

                {/* Scroll hint */}
                <div className="ph-scroll" aria-label="Scroll ke bawah untuk melihat data">
                    <span className="ph-scroll-label">Jelajahi data</span>
                    <div className="ph-scroll-track" aria-hidden="true">
                        <div className="ph-scroll-fill" />
                    </div>
                </div>
            </div>
        </header>
    )
}