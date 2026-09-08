import { useEffect, useState } from 'react';
import './AboutUsPage.css';
import Navbar from '../components/navbar/Navbar';
import Footer from '../components/footer/Footer';

const TECH_STACK = [
    {
        name: 'React.js', role: 'Frontend UI', bg: '#e8f4fd', color: '#38bdf8',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="2.5" /><ellipse cx="12" cy="12" rx="10" ry="4" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" /></svg>
    },
    {
        name: 'Laravel', role: 'Backend API', bg: '#fef2f2', color: '#f87171',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
    },
    {
        name: 'MySQL', role: 'Database', bg: '#fff4e6', color: '#f59e0b',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" /><path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" /></svg>
    },
    {
        name: 'Chart.js', role: 'Visualisasi', bg: '#e6f7f4', color: '#0d9488',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
    },
];

const FEATURES = [
    { name: 'Dashboard', desc: 'Ringkasan data PBB, akurasi model, dan prediksi terbaru dalam satu halaman.' },
    { name: 'Prediksi SMA', desc: 'Prediksi penerimaan menggunakan Simple Moving Average dari 60 bulan historis.' },
    { name: 'Manajemen Data', desc: 'Input, edit, dan kelola data historis PBB per bulan secara terpusat.' },
    { name: 'Evaluasi Akurasi', desc: 'Hitung MAPE, MAE, dan RMSE otomatis untuk validasi performa model.' },
    { name: 'Ekspor Laporan', desc: 'Unduh hasil prediksi dan data historis dalam format PDF dan Excel.' },
    { name: 'Role-Based Access', desc: 'Hak akses berlapis untuk Admin, Analis, dan Pimpinan.' },
];

const FLOW = [
    { num: '01', name: 'Input Data', desc: 'Data PBB per bulan diinput atau diimpor ke sistem.' },
    { num: '02', name: 'Validasi', desc: 'Deteksi anomali & cap lonjakan >20% otomatis.' },
    { num: '03', name: 'Hitung SMA', desc: 'Rata-rata 60 bulan dihitung sebagai nilai prediksi.' },
    { num: '04', name: 'Evaluasi', desc: 'MAPE, MAE, RMSE dihitung otomatis.' },
    { num: '05', name: 'Output', desc: 'Hasil tampil di dashboard & bisa diekspor.' },
];

const SectionDivider = ({ label }) => (
    <div className="au-divider">
        <span>{label}</span>
    </div>
);

const AboutUsPage = () => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setShow(true), 100);
        return () => clearTimeout(t);
    }, []);

    return (
        <>
            <Navbar />
            <main className={`au ${show ? 'show' : ''}`}>

                {/* ── HERO ── */}
                <section className="au-hero">
                    <div className="au-hero-mark">T</div>
                    <span className="au-overline">About TaxVision</span>
                    <h1 className="au-title">
                        Sistem Prediksi Pajak yang Dibangun<br />
                        untuk Membantu Analisis PBB
                    </h1>
                    <p className="au-sub">
                        TaxVision dikembangkan sebagai sistem berbasis web untuk membantu
                        pengolahan data historis, prediksi penerimaan PBB, dan penyajian
                        insight pajak secara lebih rapi, cepat, dan mudah dipahami.
                    </p>
                </section>

                <div className="au-inner">

                    {/* ── PROFIL ── */}
                    <SectionDivider label="Profil" />
                    <div className="au-profile-grid">
                        {[
                            {
                                label: 'Profil Pembuat',
                                title: 'Nama Pembuat',
                                desc: 'Mahasiswa yang mengembangkan TaxVision sebagai sistem prediksi penerimaan Pajak Bumi dan Bangunan berbasis data historis.',
                                meta: [{ label: 'Program Studi', val: 'Informatika / SI' }, { label: 'Fokus', val: 'Time Series' }],
                                delay: 0.05,
                            },
                            {
                                label: 'Tempat Penelitian',
                                title: 'BPKPD Kab. Magetan',
                                desc: 'Badan Pengelolaan Keuangan dan Pendapatan Daerah Kabupaten Magetan, fokus pada data penerimaan PBB.',
                                meta: [{ label: 'Objek', val: 'Prediksi PBB' }, { label: 'Jenis Sistem', val: 'Web Analitik' }],
                                delay: 0.12,
                            },
                        ].map(card => (
                            <article
                                key={card.title}
                                className="au-profile-card"
                                style={{ transitionDelay: `${card.delay}s` }}
                            >
                                <div className="au-profile-img" />
                                <div className="au-profile-body">
                                    <span className="au-card-label">{card.label}</span>
                                    <h2>{card.title}</h2>
                                    <p>{card.desc}</p>
                                    <div className="au-profile-meta">
                                        {card.meta.map(m => (
                                            <div key={m.label} className="au-meta-item">
                                                <span>{m.label}</span>
                                                <strong>{m.val}</strong>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* ── SISTEM ── */}
                    <SectionDivider label="Penjelasan Sistem" />

                    {/* Deskripsi */}
                    <div className="au-sys-desc-wrap">
                        <div>
                            <span className="au-card-label">TaxVision</span>
                            <p className="au-sys-desc">
                                Sistem berbasis web untuk mengolah data historis penerimaan
                                Pajak Bumi dan Bangunan, menampilkan grafik perkembangan data,
                                dan menghasilkan prediksi menggunakan metode
                                Simple Moving Average (SMA) 60 bulan.
                            </p>
                        </div>
                        <div className="au-sys-badge">
                            <span>Fokus Sistem</span>
                            <strong>Analisis · Prediksi · Insight</strong>
                        </div>
                    </div>

                    {/* Tech Stack */}
                    <SectionDivider label="Tech Stack" />
                    <div className="au-tech-grid">
                        {TECH_STACK.map(t => (
                            <div key={t.name} className="au-tech-item">
                                <div className="au-tech-icon" style={{ background: t.bg, color: t.color }}>
                                    {t.icon}
                                </div>
                                <div className="au-tech-name">{t.name}</div>
                                <div className="au-tech-role">{t.role}</div>
                            </div>
                        ))}
                    </div>

                    {/* Fitur */}
                    <SectionDivider label="Fitur Utama" />
                    <div className="au-features-grid">
                        {FEATURES.map((f, i) => (
                            <div key={f.name} className="au-feature">
                                <div className="au-feature-top">
                                    <span className="au-feature-dot" />
                                    <span className="au-feature-name">{f.name}</span>
                                </div>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Alur Sistem */}
                    <SectionDivider label="Alur Sistem" />
                    <div className="au-flow">
                        {FLOW.map((step, i) => (
                            <div key={step.num} className="au-flow-step">
                                <div className="au-flow-num">{step.num}</div>
                                <div className="au-flow-name">{step.name}</div>
                                <p className="au-flow-desc">{step.desc}</p>
                                {i < FLOW.length - 1 && (
                                    <div className="au-flow-arrow">
                                        <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* ── TUJUAN & MANFAAT ── */}
                    <SectionDivider label="Tujuan & Manfaat" />
                    <div className="au-info-grid">
                        {[
                            {
                                num: '01',
                                title: 'Tujuan',
                                desc: 'Membantu proses perencanaan penerimaan pajak daerah agar lebih berbasis data, mudah dianalisis, dan dapat digunakan sebagai bahan pertimbangan dalam pengambilan keputusan.',
                                delay: 0.32,
                            },
                            {
                                num: '02',
                                title: 'Manfaat',
                                desc: 'Memberikan gambaran perkembangan data pajak, estimasi penerimaan, dan insight sederhana sehingga pengguna dapat memahami kondisi penerimaan PBB secara lebih cepat.',
                                delay: 0.4,
                            },
                        ].map(card => (
                            <article
                                key={card.num}
                                className="au-info-card"
                                style={{ transitionDelay: `${card.delay}s` }}
                            >
                                <div className="au-info-num">{card.num}</div>
                                <h3>{card.title}</h3>
                                <p>{card.desc}</p>
                            </article>
                        ))}
                    </div>

                </div>
            </main>
            <Footer />
        </>
    );
};

export default AboutUsPage;