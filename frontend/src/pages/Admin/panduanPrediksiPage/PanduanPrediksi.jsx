import React, { useState } from 'react'
import {
    LineChart,
    Database,
    Brain,
    BarChart3,
    CalendarDays,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
} from 'lucide-react'
import './PanduanPrediksi.css'

export default function PanduanPrediksi() {
    const [activeTab, setActiveTab] = useState('alur')

    return (
        <div className="panduan-page">
            <div className="panduan-header">
                <div>
                    <span className="panduan-badge">Panduan Sistem Prediksi</span>
                    <h2>Cara Kerja Prediksi Pajak</h2>
                    <p>
                        Halaman ini menjelaskan alur kerja sistem prediksi, mulai dari data historis,
                        pembagian training-testing, pemilihan model SMA terbaik, sampai prediksi multi-tahun.
                    </p>
                </div>
            </div>

            <div className="panduan-tabs">
                <button
                    className={`panduan-tab ${activeTab === 'alur' ? 'active' : ''}`}
                    onClick={() => setActiveTab('alur')}
                >
                    Alur Umum
                </button>

                <button
                    className={`panduan-tab ${activeTab === 'training' ? 'active' : ''}`}
                    onClick={() => setActiveTab('training')}
                >
                    Training & Testing
                </button>

                <button
                    className={`panduan-tab ${activeTab === 'bulanan' ? 'active' : ''}`}
                    onClick={() => setActiveTab('bulanan')}
                >
                    Prediksi Bulanan
                </button>

                <button
                    className={`panduan-tab ${activeTab === 'multi' ? 'active' : ''}`}
                    onClick={() => setActiveTab('multi')}
                >
                    Multi Tahun
                </button>
            </div>

            {activeTab === 'alur' && (
                <section className="panduan-section">
                    <div className="panduan-grid">
                        <div className="panduan-card">
                            <div className="panduan-icon">
                                <Database size={20} />
                            </div>
                            <h3>1. Mengambil Data Historis</h3>
                            <p>
                                Sistem mengambil data pendapatan pajak beberapa tahun terakhir berdasarkan
                                jenis pajak yang dipilih. Data ini menjadi dasar utama perhitungan prediksi.
                            </p>
                        </div>

                        <div className="panduan-card">
                            <div className="panduan-icon">
                                <AlertTriangle size={20} />
                            </div>
                            <h3>2. Membersihkan Anomali</h3>
                            <p>
                                Jika terdapat lonjakan data yang terlalu ekstrem, sistem dapat melakukan
                                koreksi agar hasil prediksi tidak terlalu terpengaruh oleh data yang tidak wajar.
                            </p>
                        </div>

                        <div className="panduan-card">
                            <div className="panduan-icon">
                                <Brain size={20} />
                            </div>
                            <h3>3. Menguji Beberapa SMA</h3>
                            <p>
                                Sistem menguji beberapa periode SMA, misalnya SMA 3 bulan, SMA 6 bulan,
                                dan SMA 12 bulan untuk melihat pola mana yang paling akurat.
                            </p>
                        </div>

                        <div className="panduan-card">
                            <div className="panduan-icon">
                                <BarChart3 size={20} />
                            </div>
                            <h3>4. Memilih Model Terbaik</h3>
                            <p>
                                Model terbaik dipilih berdasarkan nilai kesalahan terkecil, terutama MAPE.
                                Semakin kecil nilai error, semakin baik model tersebut.
                            </p>
                        </div>
                    </div>

                    <div className="panduan-flow">
                        <h3>Alur Sederhana Sistem</h3>

                        <div className="flow-list">
                            <div className="flow-item">Data historis pajak</div>
                            <span>→</span>
                            <div className="flow-item">Bersihkan anomali</div>
                            <span>→</span>
                            <div className="flow-item">Training & testing</div>
                            <span>→</span>
                            <div className="flow-item">Pilih SMA terbaik</div>
                            <span>→</span>
                            <div className="flow-item">Prediksi final</div>
                        </div>
                    </div>
                </section>
            )}

            {activeTab === 'training' && (
                <section className="panduan-section">
                    <div className="panduan-explain">
                        <div className="panduan-explain-text">
                            <h3>Apa Fungsi Training dan Testing?</h3>
                            <p>
                                Training dan testing tidak digunakan langsung untuk menghasilkan angka prediksi akhir.
                                Fungsinya adalah untuk menguji model mana yang paling akurat sebelum sistem
                                membuat prediksi final.
                            </p>

                            <p>
                                Data training digunakan sebagai dasar pembelajaran pola, sedangkan data testing
                                digunakan sebagai pembanding untuk melihat apakah hasil prediksi mendekati data asli.
                            </p>
                        </div>

                        <div className="panduan-example-box">
                            <h4>Contoh Pembagian Data</h4>
                            <div className="example-row">
                                <span>Data historis</span>
                                <strong>Jan 2024 – Des 2028</strong>
                            </div>
                            <div className="example-row">
                                <span>Training</span>
                                <strong>80% data awal</strong>
                            </div>
                            <div className="example-row">
                                <span>Testing</span>
                                <strong>20% data akhir</strong>
                            </div>
                        </div>
                    </div>

                    <div className="panduan-card full">
                        <h3>Logika Utamanya</h3>
                        <p>
                            Sistem mencoba beberapa model SMA. Misalnya SMA 3, SMA 6, dan SMA 12.
                            Setiap model diuji menggunakan data testing. Setelah itu, sistem menghitung
                            nilai error seperti MAPE, MAE, dan RMSE.
                        </p>

                        <div className="model-table">
                            <div className="model-row head">
                                <span>Model</span>
                                <span>MAPE</span>
                                <span>Kesimpulan</span>
                            </div>
                            <div className="model-row">
                                <span>SMA 3 Bulan</span>
                                <span>2,50%</span>
                                <span>Cukup baik</span>
                            </div>
                            <div className="model-row best">
                                <span>SMA 6 Bulan</span>
                                <span>0,92%</span>
                                <span>Terbaik</span>
                            </div>
                            <div className="model-row">
                                <span>SMA 12 Bulan</span>
                                <span>1,80%</span>
                                <span>Baik</span>
                            </div>
                        </div>

                        <p className="panduan-note">
                            Setelah model terbaik ditemukan, barulah sistem memakai data terbaru untuk
                            menghitung prediksi final.
                        </p>
                    </div>
                </section>
            )}

            {activeTab === 'bulanan' && (
                <section className="panduan-section">
                    <div className="panduan-card full">
                        <div className="panduan-title-icon">
                            <CalendarDays size={20} />
                            <h3>Cara Kerja Prediksi Bulanan</h3>
                        </div>

                        <p>
                            Prediksi bulanan digunakan untuk memprediksi satu periode tertentu,
                            misalnya Januari 2029. Sistem akan melihat data historis sebelum periode tersebut.
                        </p>

                        <div className="timeline-box">
                            <div className="timeline-item">
                                <span>Target prediksi</span>
                                <strong>Januari 2029</strong>
                            </div>

                            <div className="timeline-item">
                                <span>Data yang digunakan</span>
                                <strong>Januari 2024 – Desember 2028</strong>
                            </div>

                            <div className="timeline-item">
                                <span>Model yang dipakai</span>
                                <strong>SMA terbaik dari hasil evaluasi</strong>
                            </div>
                        </div>

                        <div className="formula-box">
                            <h4>Rumus Sederhana SMA</h4>
                            <p>
                                Prediksi dihitung dari rata-rata beberapa bulan terakhir sesuai periode SMA
                                yang terpilih.
                            </p>
                            <code>
                                F_t = (A_t-1 + A_t-2 + ... + A_t-n) / n
                            </code>
                        </div>
                    </div>

                    <div className="panduan-card full">
                        <h3>Contoh Logika SMA 3 Bulan</h3>

                        <div className="example-list">
                            <div>Oktober 2028 = Rp10.700.000</div>
                            <div>November 2028 = Rp10.800.000</div>
                            <div>Desember 2028 = Rp10.900.000</div>
                        </div>

                        <p>
                            Maka prediksi Januari 2029 dihitung dari rata-rata tiga bulan tersebut.
                        </p>

                        <div className="result-box">
                            Prediksi Januari 2029 = Rp10.800.000
                        </div>
                    </div>
                </section>
            )}

            {activeTab === 'multi' && (
                <section className="panduan-section">
                    <div className="panduan-card full">
                        <div className="panduan-title-icon">
                            <TrendingUp size={20} />
                            <h3>Cara Kerja Prediksi Multi Tahun</h3>
                        </div>

                        <p>
                            Prediksi multi-tahun digunakan ketika sistem ingin memproyeksikan pendapatan
                            pajak dalam jangka panjang, misalnya dari 2026 sampai 2031.
                        </p>

                        <p>
                            Sistem tidak langsung menebak total pendapatan tahun 2031. Sistem membuat
                            prediksi per bulan terlebih dahulu, lalu hasil bulanan tersebut dijumlahkan
                            menjadi ringkasan tahunan.
                        </p>

                        <div className="panduan-flow vertical">
                            <div className="flow-item">Prediksi Jan 2026</div>
                            <div className="flow-item">Prediksi Feb 2026</div>
                            <div className="flow-item">Prediksi Mar 2026</div>
                            <div className="flow-item">...</div>
                            <div className="flow-item">Prediksi Des 2031</div>
                            <div className="flow-item total">Akumulasi per tahun</div>
                        </div>
                    </div>

                    <div className="panduan-warning">
                        <AlertTriangle size={20} />
                        <div>
                            <h3>Catatan Penting</h3>
                            <p>
                                Semakin jauh periode yang diprediksi, semakin besar tingkat ketidakpastiannya.
                                Hal ini terjadi karena prediksi bulan berikutnya dapat menggunakan hasil prediksi
                                bulan sebelumnya sebagai data sementara.
                            </p>
                        </div>
                    </div>

                    <div className="panduan-card full">
                        <h3>Contoh Rolling Forecast</h3>

                        <div className="model-table">
                            <div className="model-row head">
                                <span>Periode</span>
                                <span>Data Dasar</span>
                                <span>Keterangan</span>
                            </div>
                            <div className="model-row">
                                <span>Jan 2029</span>
                                <span>Data aktual sampai Des 2028</span>
                                <span>Prediksi pertama</span>
                            </div>
                            <div className="model-row">
                                <span>Feb 2029</span>
                                <span>Data aktual + prediksi Jan 2029</span>
                                <span>Prediksi bergulir</span>
                            </div>
                            <div className="model-row">
                                <span>Mar 2029</span>
                                <span>Data aktual + prediksi Jan–Feb 2029</span>
                                <span>Prediksi bergulir</span>
                            </div>
                        </div>

                        <p className="panduan-note">
                            Jadi prediksi multi-tahun menghasilkan dua keluaran utama, yaitu detail prediksi
                            per bulan dan ringkasan total per tahun.
                        </p>
                    </div>
                </section>
            )}

            <div className="panduan-footer-card">
                <CheckCircle2 size={20} />
                <div>
                    <h3>Kesimpulan</h3>
                    <p>
                        Training-testing digunakan untuk memilih model SMA paling akurat, sedangkan data
                        terakhir digunakan untuk menghasilkan angka prediksi final. Untuk prediksi jangka panjang,
                        sistem membuat prediksi bulanan secara bertahap lalu mengakumulasikannya menjadi total tahunan.
                    </p>
                </div>
            </div>
        </div>
    )
}