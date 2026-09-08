// components/metodeSection/MetodeSection.jsx
import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import './MetodeSection.css'

const metrikData = [
    {
        nama: 'MAPE',
        panjang: 'Mean Absolute Percentage Error',
        deskripsi: 'Rata-rata persentase error absolut. Semakin kecil (mendekati 0%), semakin akurat model.',
        nilai: '5.4%',
        interpretasi: 'Error prediksi rata-rata 5.4% dari nilai aktual',
        color: '#0d9488',
        bg: '#f0fdf4',
    },
    {
        nama: 'MAE',
        panjang: 'Mean Absolute Error',
        deskripsi: 'Rata-rata selisih absolut antara prediksi dan aktual dalam satuan asli (Miliar Rupiah).',
        nilai: '0.32',
        interpretasi: 'Rata-rata selisih ±Rp 320 juta per bulan',
        color: '#0d9488',
        bg: '#f0fdf4',
    },
    {
        nama: 'RMSE',
        panjang: 'Root Mean Squared Error',
        deskripsi: 'Akar dari rata-rata kuadrat error. Memberi penalti lebih besar pada error yang besar.',
        nilai: '0.48',
        interpretasi: 'Error besar (lonjakan) lebih terdeteksi',
        color: '#0d9488',
        bg: '#f0fdf4',
    },
]

const periodeInfo = [
    {
        periode: 'SMA 3',
        deskripsi: 'Rata-rata 3 bulan terakhir. Sangat responsif terhadap perubahan terbaru, tapi mudah terpengaruh noise (fluktuasi acak).',
        karakter: 'Responsif',
        mape: '8.2%',
    },
    {
        periode: 'SMA 6',
        deskripsi: 'Rata-rata 6 bulan terakhir. Keseimbangan antara responsivitas dan stabilitas — cukup smooth tapi tetap mengikuti tren.',
        karakter: 'Seimbang ★',
        mape: '5.4%',
        isBest: true,
    },
    {
        periode: 'SMA 12',
        deskripsi: 'Rata-rata 12 bulan terakhir. Sangat smooth dan stabil, tapi lambat merespons perubahan tren terbaru.',
        karakter: 'Stabil',
        mape: '7.1%',
    },
]

export default function MetodeSection() {
    const sectionRef = useRef(null)
    const isInView = useInView(sectionRef, { once: true, margin: '-80px', amount: 0.05 })

    const fadeUp = {
        hidden: { opacity: 0, y: 32, filter: 'blur(8px)' },
        visible: (i = 0) => ({
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            transition: { duration: 0.7, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
        }),
    }

    return (
        <section className="mts" id="metode" ref={sectionRef}>
            <div className="mts-inner">

                {/* ── HEADER ── */}
                <motion.div className="mts-header" variants={fadeUp} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                    <span className="mts-overline">Metodologi</span>
                    <h2 className="mts-title">Memahami Teknik<br />di Balik Prediksi</h2>
                    <p className="mts-sub">
                        Penjelasan konsep dan metrik yang digunakan sistem dalam melakukan prediksi penerimaan PBB.
                    </p>
                </motion.div>

                {/* ═══════════════════════════════════════════
                    SIMPLE MOVING AVERAGE
                ═══════════════════════════════════════════ */}
                <motion.div className="mts-block" variants={fadeUp} custom={0.15} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                    <div className="mts-block-head">
                        <span className="mts-block-num">01</span>
                        <h3 className="mts-block-title">Simple Moving Average (SMA)</h3>
                    </div>
                    <p className="mts-block-text">
                        Simple Moving Average adalah metode prediksi yang menghitung{' '}
                        <strong>rata-rata dari sejumlah periode sebelumnya</strong> untuk memperkirakan
                        nilai periode berikutnya. Metode ini sederhana, mudah diinterpretasikan, dan
                        cocok untuk data yang memiliki pola stabil tanpa tren ekstrem — seperti
                        data penerimaan pajak daerah.
                    </p>

                    {/* Rumus */}
                    <div className="mts-rumus">
                        <div className="mts-rumus-label">Rumus</div>
                        <div className="mts-rumus-box">
                            F<sub>t</sub> = (A<sub>t-1</sub> + A<sub>t-2</sub> + ... + A<sub>t-n</sub>) / n
                        </div>
                        <div className="mts-rumus-ket">
                            <span>F<sub>t</sub></span> = Prediksi periode t &nbsp;|&nbsp;
                            <span>A</span> = Nilai aktual &nbsp;|&nbsp;
                            <span>n</span> = Jumlah periode
                        </div>
                    </div>

                    {/* Ilustrasi */}
                    <div className="mts-ilus">
                        <div className="mts-ilus-label">Ilustrasi SMA 6 Bulan</div>
                        <div className="mts-ilus-box">
                            <div className="mts-ilus-months">
                                {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'].map((m, i) => (
                                    <div key={m} className="mts-ilus-month">
                                        <div className="mts-ilus-month-bar" style={{ height: `${[60, 55, 65, 70, 68, 72][i]}%` }} />
                                        <span className="mts-ilus-month-label">{m}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mts-ilus-arrow">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </div>
                            <div className="mts-ilus-result">
                                <div className="mts-ilus-result-bar" style={{ height: '65%' }} />
                                <span className="mts-ilus-result-label">Jul</span>
                                <span className="mts-ilus-result-val">Prediksi</span>
                            </div>
                        </div>
                        <div className="mts-ilus-calc">
                            (A<sub>Jan</sub> + A<sub>Feb</sub> + A<sub>Mar</sub> + A<sub>Apr</sub> + A<sub>Mei</sub> + A<sub>Jun</sub>) / 6 = <strong>Prediksi Juli</strong>
                        </div>
                    </div>
                </motion.div>

                <div className="mts-divider" />

                {/* ═══════════════════════════════════════════
                    METRIK EVALUASI
                ═══════════════════════════════════════════ */}
                <motion.div className="mts-block" variants={fadeUp} custom={0.25} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                    <div className="mts-block-head">
                        <span className="mts-block-num">02</span>
                        <h3 className="mts-block-title">Metrik Evaluasi Model</h3>
                    </div>
                    <p className="mts-block-text">
                        Setiap model dievaluasi menggunakan tiga metrik untuk mengukur seberapa
                        akurat prediksi dibandingkan nilai aktual.
                    </p>

                    <div className="mts-metrik-grid">
                        {metrikData.map(metrik => (
                            <div key={metrik.nama} className="mts-metrik-card" style={{ borderColor: `${metrik.color}20`, background: metrik.bg }}>
                                <div className="mts-metrik-card-header">
                                    <span className="mts-metrik-card-nama">{metrik.nama}</span>
                                    <span className="mts-metrik-card-nilai">{metrik.nilai}</span>
                                </div>
                                <div className="mts-metrik-card-panjang">{metrik.panjang}</div>
                                <p className="mts-metrik-card-desc">{metrik.deskripsi}</p>
                                <div className="mts-metrik-card-interp">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 16v-4M12 8h.01" />
                                    </svg>
                                    {metrik.interpretasi}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <div className="mts-divider" />

                {/* ═══════════════════════════════════════════
                    PEMILIHAN PERIODE SMA
                ═══════════════════════════════════════════ */}
                <motion.div className="mts-block" variants={fadeUp} custom={0.35} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                    <div className="mts-block-head">
                        <span className="mts-block-num">03</span>
                        <h3 className="mts-block-title">Pemilihan Periode SMA</h3>
                    </div>
                    <p className="mts-block-text">
                        Sistem menguji tiga periode berbeda untuk menemukan keseimbangan terbaik
                        antara responsivitas dan stabilitas.
                    </p>

                    <div className="mts-periode-grid">
                        {periodeInfo.map(p => (
                            <div key={p.periode} className={`mts-periode-card ${p.isBest ? 'mts-periode-card--best' : ''}`}>
                                <div className="mts-periode-card-header">
                                    <span className="mts-periode-card-nama">{p.periode}</span>
                                    <span className="mts-periode-card-karakter">{p.karakter}</span>
                                </div>
                                <p className="mts-periode-card-desc">{p.deskripsi}</p>
                                <div className="mts-periode-card-mape">
                                    <span className="mts-periode-card-mape-label">MAPE</span>
                                    <span className="mts-periode-card-mape-val">{p.mape}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mts-info-box">
                        <svg className="mts-info-box-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4M12 8h.01" />
                        </svg>
                        <div className="mts-info-box-content">
                            <strong>SMA 6 dipilih</strong> karena memberikan keseimbangan optimal — cukup
                            responsif terhadap tren terbaru, namun tetap stabil dan tidak mudah terpengaruh
                            fluktuasi acak. MAPE 5.4% adalah yang terendah di antara ketiga model.
                        </div>
                    </div>
                </motion.div>

                <div className="mts-divider" />

                {/* ═══════════════════════════════════════════
                    CONFIDENCE RANGE
                ═══════════════════════════════════════════ */}
                <motion.div className="mts-block" variants={fadeUp} custom={0.45} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                    <div className="mts-block-head">
                        <span className="mts-block-num">04</span>
                        <h3 className="mts-block-title">Confidence Range</h3>
                    </div>
                    <p className="mts-block-text">
                        Confidence range memberikan <strong>rentang estimasi</strong> penerimaan,
                        bukan hanya satu angka pasti. Rentang ini dihitung berdasarkan nilai MAE
                        (Mean Absolute Error) dari model terbaik.
                    </p>

                    <div className="mts-confidence-ilus">
                        <div className="mts-confidence-ilus-labels">
                            <span>Batas Bawah</span>
                            <span>Prediksi</span>
                            <span>Batas Atas</span>
                        </div>
                        <div className="mts-confidence-ilus-bar">
                            <div className="mts-confidence-ilus-track">
                                <div className="mts-confidence-ilus-fill" />
                            </div>
                            <div className="mts-confidence-ilus-dots">
                                <span>Rp 9,3M</span>
                                <span>Rp 9,8M</span>
                                <span>Rp 10,3M</span>
                            </div>
                        </div>
                        <div className="mts-confidence-ilus-formula">
                            Prediksi ± MAE = Rp 9,8M ± 0.32
                        </div>
                    </div>

                    <div className="mts-info-box">
                        <svg className="mts-info-box-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4M12 8h.01" />
                        </svg>
                        <div className="mts-info-box-content">
                            <strong>Cara membaca:</strong> Penerimaan PBB pada periode tersebut diperkirakan
                            berada dalam rentang <strong>Rp 9,3 Miliar hingga Rp 10,3 Miliar</strong>,
                            dengan nilai tengah Rp 9,8 Miliar. Rentang ini memberi gambaran realistis
                            untuk perencanaan anggaran.
                        </div>
                    </div>
                </motion.div>

            </div>
        </section>
    )
}