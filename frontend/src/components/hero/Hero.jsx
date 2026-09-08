import { useEffect, useState } from "react";
import './Hero.css';

const API_BASE_URL = "http://127.0.0.1:8000/api";

const Hero = () => {
  const [proyeksi, setProyeksi] = useState({
    estimasi: 0,
    realisasi: 0,
    akurasi: 0,
    selisih: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/data-pajak`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (!json.success || !Array.isArray(json.data)) {
          throw new Error("Format data tidak sesuai");
        }

        const rows = json.data;

        // Pisahkan berdasarkan sumber_data
        const prediksiRows = rows
          .filter((r) => r.sumber_data === "prediksi")
          .sort((a, b) => new Date(b.tanggal_pajak) - new Date(a.tanggal_pajak));

        const aktualRows = rows
          .filter((r) => r.sumber_data === "aktual")
          .sort((a, b) => new Date(b.tanggal_pajak) - new Date(a.tanggal_pajak));

        // Cocokkan berdasarkan tanggal_pajak + id_jenis_pajak yang sama, ambil paling baru
        let matched = null;
        for (const p of prediksiRows) {
          const a = aktualRows.find(
            (a) =>
              a.tanggal_pajak === p.tanggal_pajak &&
              a.id_jenis_pajak === p.id_jenis_pajak
          );
          if (a) {
            matched = { prediksi: p, aktual: a };
            break;
          }
        }

        let estimasi, realisasi, akurasi, selisih;

        if (matched) {
          estimasi = parseFloat(matched.prediksi.jumlah_pendapatan);
          realisasi = parseFloat(matched.aktual.jumlah_pendapatan);
          selisih = Math.abs(estimasi - realisasi);
          akurasi = realisasi !== 0
            ? Math.max(0, 100 - (selisih / realisasi) * 100)
            : 0;
        } else if (prediksiRows.length > 0) {
          // Fallback: kalau belum ada data aktual yang cocok, tampilkan prediksi saja
          estimasi = parseFloat(prediksiRows[0].jumlah_pendapatan);
          realisasi = 0;
          selisih = 0;
          akurasi = 0;
        } else {
          estimasi = 0;
          realisasi = 0;
          selisih = 0;
          akurasi = 0;
        }

        setProyeksi({
          estimasi,
          realisasi,
          akurasi: Math.round(akurasi),
          selisih,
        });
      } catch (err) {
        console.error("Gagal mengambil data pajak:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatSingkat = (angka) => {
    if (!angka) return "0";

    if (angka >= 1_000_000_000_000) {
      return (angka / 1_000_000_000_000).toFixed(1).replace(".", ",") + " T";
    }
    if (angka >= 1_000_000_000) {
      return (angka / 1_000_000_000).toFixed(1).replace(".", ",") + " M";
    }
    if (angka >= 1_000_000) {
      return (angka / 1_000_000).toFixed(1).replace(".", ",") + " Jt";
    }
    if (angka >= 1_000) {
      return (angka / 1_000).toFixed(1).replace(".", ",") + " Rb";
    }

    return angka.toString();
  };

  return (
    <section className="hero" id="hero">
      <div className="hero-shape" />

      <div className="hero-inner">
        {/* LEFT: CONTENT */}
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            BPKPD Kabupaten Magetan
          </div>

          <h1 className="hero-title">
            Prediksi PBB<br />
            yang Lebih <span className="hero-title-highlight">Presisi</span>
          </h1>

          <p className="hero-desc">
            Simulasi proyeksi penerimaan PBB berbasis data historis untuk
            ilustrasi dashboard.
          </p>

          <div className="hero-actions">
            <a href="#data" className="btn btn-primary">
              Lihat Dashboard
              <svg
                className="btn-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>

            <a href="#tentang" className="btn btn-secondary">
              Metode Analisis
            </a>
          </div>
        </div>

        {/* RIGHT: VISUAL */}
        <div className="hero-visual">
          <div className="hero-panel">
            <div className="hero-panel-head">
              <div className="hero-panel-title">Proyeksi Penerimaan</div>
              <div className="hero-panel-code">PBB · 2026</div>
            </div>

            <div className="hero-chart">
              <svg viewBox="0 0 360 180" fill="none">
                <path
                  d="M5 145 C55 120, 75 132, 110 95 C145 58, 165 78, 205 62 C245 45, 275 62, 330 28"
                  stroke="#0f766e"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <path
                  d="M5 150 C55 128, 75 138, 110 105 C145 70, 165 88, 205 75 C245 58, 275 72, 330 42"
                  stroke="#14b8a6"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="8 10"
                />
                <circle cx="330" cy="28" r="8" fill="#14b8a6" />
                <circle cx="330" cy="28" r="18" fill="rgba(20,184,166,.18)" />
              </svg>
            </div>

            {loading ? (
              <div className="hero-stats">
                <span className="hero-stat-label">Memuat data...</span>
              </div>
            ) : error ? (
              <div className="hero-stats">
                <span className="hero-stat-label">Gagal memuat data: {error}</span>
              </div>
            ) : (
              <div className="hero-stats">
                <div className="hero-stat">
                  <span className="hero-stat-label">Estimasi</span>
                  <span className="hero-stat-value">
                    {formatSingkat(proyeksi.estimasi)}
                  </span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat-label">Realisasi</span>
                  <span className="hero-stat-value">
                    {formatSingkat(proyeksi.realisasi)}
                  </span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat-label">Akurasi</span>
                  <span className="hero-stat-value">{proyeksi.akurasi}%</span>
                </div>
              </div>
            )}
          </div>

          <div className="hero-floating-card">
            <span className="hero-floating-label">Selisih Prediksi</span>
            <span className="hero-floating-value">
              ± {formatSingkat(proyeksi.selisih)}
            </span>
          </div>
        </div>
      </div>

      {/* ===== CURVED DIVIDER - KURVA KE BAWAH ===== */}
      <div className="hero-divider">
        <svg
          data-name="Layer 1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            className="hero-divider-shape"
          />
        </svg>
      </div>
    </section>
  );
};

export default Hero;