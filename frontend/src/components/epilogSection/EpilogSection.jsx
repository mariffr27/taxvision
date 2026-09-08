// components/epilogSection/EpilogSection.jsx
import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import './EpilogSection.css'

export default function EpilogSection() {
    const sectionRef = useRef(null)
    const isInView = useInView(sectionRef, { once: true, margin: '-80px', amount: 0.1 })

    const fadeUp = {
        hidden: { opacity: 0, y: 32, filter: 'blur(8px)' },
        visible: (i = 0) => ({
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            transition: { duration: 0.7, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] },
        }),
    }

    return (
        <section className="eps" id="epilog" ref={sectionRef}>
            <div className="eps-inner">

                {/* ── FLOW SUMMARY ── */}
                <motion.div className="eps-flow" variants={fadeUp} custom={0} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                    <div className="eps-flow-item">
                        <div className="eps-flow-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <path d="M16 2v4M8 2v4M3 10h18" />
                            </svg>
                        </div>
                        <span className="eps-flow-label">Data</span>
                    </div>
                    <div className="eps-flow-arrow">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </div>
                    <div className="eps-flow-item">
                        <div className="eps-flow-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                            </svg>
                        </div>
                        <span className="eps-flow-label">Proses</span>
                    </div>
                    <div className="eps-flow-arrow">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </div>
                    <div className="eps-flow-item">
                        <div className="eps-flow-icon eps-flow-icon--active">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <span className="eps-flow-label">Prediksi</span>
                    </div>
                </motion.div>

                {/* ── DESCRIPTION ── */}
                <motion.p className="eps-desc" variants={fadeUp} custom={0.2} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                    TaxVision mengolah <strong>60 bulan data historis</strong> PBB dari BPKPD Kabupaten Magetan,
                    mendeteksi dan mengoreksi anomali, menguji <strong>3 model SMA</strong>,
                    serta memilih model terbaik untuk memproyeksikan penerimaan hingga tahun 2029.
                </motion.p>

                {/* ── DIVIDER ── */}
                <motion.div className="eps-divider" variants={fadeUp} custom={0.35} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                    <span></span>
                </motion.div>

                {/* ── QUOTE ── */}
                <motion.blockquote className="eps-quote" variants={fadeUp} custom={0.5} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                    <svg className="eps-quote-mark" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                    <p className="eps-quote-text">
                        Prediksi tidak menjamin masa depan,<br />
                        tapi memberi arah untuk keputusan yang lebih baik.
                    </p>
                </motion.blockquote>

                {/* ── INFO NOTE ── */}
                <motion.p className="eps-note" variants={fadeUp} custom={0.6} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                    Hasil prediksi ini merupakan estimasi berbasis data historis.
                    Faktor eksternal seperti perubahan kebijakan atau kondisi ekonomi
                    dapat memengaruhi realisasi penerimaan aktual.
                </motion.p>

            </div>
        </section>
    )
}