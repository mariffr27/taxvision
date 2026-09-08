import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './BelumPredictionSection.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const BelumPredictionSection = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px', amount: 0.1 });
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeRow, setActiveRow] = useState(null);

  const allData = [
    { year: '2019', aktual: 6.10, prediksi: 6.18, type: 'aktual' },
    { year: '2020', aktual: 6.75, prediksi: 6.80, type: 'aktual' },
    { year: '2021', aktual: 7.20, prediksi: 7.12, type: 'aktual' },
    { year: '2022', aktual: 7.51, prediksi: 7.43, type: 'aktual' },
    { year: '2023', aktual: 7.78, prediksi: 7.85, type: 'aktual' },
    { year: '2024', aktual: 8.38, prediksi: 8.40, type: 'aktual' },
    { year: '2025', aktual: null, prediksi: 9.10, type: 'prediksi' },
    { year: '2026', aktual: null, prediksi: 9.80, type: 'prediksi' },
  ];

  const filters = [
    { key: 'all', label: 'Semua' },
    { key: 'aktual', label: 'Aktual' },
    { key: 'prediksi', label: 'Prediksi' },
  ];

  const filteredData = allData.filter(d => {
    if (activeFilter === 'aktual') return d.type === 'aktual';
    if (activeFilter === 'prediksi') return d.type === 'prediksi';
    return true;
  });

  const chartData = {
    labels: allData.map(d => d.year),
    datasets: [
      {
        label: 'Realisasi aktual',
        data: allData.map(d => d.aktual),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.07)',
        pointBackgroundColor: '#22c55e',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2.5,
        fill: false,
        tension: 0.38,
        spanGaps: false,
        hidden: activeFilter === 'prediksi',
      },
      {
        label: 'Prediksi model',
        data: allData.map(d => d.prediksi),
        borderColor: '#0d9488',
        backgroundColor: 'rgba(13,148,136,0.05)',
        pointBackgroundColor: '#0d9488',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2,
        borderDash: [6, 4],
        fill: false,
        tension: 0.38,
        hidden: activeFilter === 'aktual',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#ffffff',
        borderColor: 'rgba(10,26,15,0.1)',
        borderWidth: 1,
        titleColor: '#071a12',
        bodyColor: '#52645b',
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: Rp ${ctx.parsed.y.toFixed(2)}M`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(10,26,15,0.04)', drawBorder: false },
        ticks: { font: { size: 12, family: 'inherit' }, color: '#52645b', autoSkip: false },
        border: { display: false },
      },
      y: {
        min: 5.5,
        max: 10.5,
        grid: { color: 'rgba(10,26,15,0.04)', drawBorder: false },
        ticks: {
          font: { size: 12, family: 'inherit' },
          color: '#52645b',
          callback: v => 'Rp ' + v.toFixed(1) + 'M',
        },
        border: { display: false },
      },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 28, filter: 'blur(8px)' },
    visible: (i = 0) => ({
      opacity: 1, y: 0, filter: 'blur(0px)',
      transition: { duration: 0.65, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
  };

  return (
    <section className="ps" id="prediksi" ref={sectionRef}>

      <div className="ps-inner">

        {/* ── HEADER ── */}
        <motion.div
          className="ps-header"
          variants={fadeUp}
          custom={0}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <span className="ps-overline">Tren Penerimaan PBB</span>
          <h2 className="ps-title">Realisasi &amp; Proyeksi<br />Penerimaan 2019–2026</h2>
          {/* ✅ FIX: sub header yang benar sesuai metode SMA */}
          <p className="ps-sub">
            Visualisasi data realisasi historis dan hasil proyeksi menggunakan
            metode <strong>Simple Moving Average (SMA)</strong> berdasarkan
            data bulanan 2021–2025.
          </p>
        </motion.div>

        {/* ── CHART CARD ── */}
        {/* ✅ Metric cards dihapus dari sini — sudah ada di ResultBelumPredictionSection */}
        <motion.div
          className="ps-chart-card"
          variants={fadeUp}
          custom={0.1}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <div className="ps-chart-head">
            <div className="ps-chart-head-left">
              <span className="ps-chart-dot" />
              {/* ✅ Label diperjelas: tahunan agar beda dari chart bulanan di bawah */}
              <span className="ps-chart-title">Tren Tahunan 2019–2026</span>
            </div>
            <div className="ps-filters">
              {filters.map(f => (
                <button
                  key={f.key}
                  className={`ps-filter ${activeFilter === f.key ? 'active' : ''}`}
                  onClick={() => setActiveFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ps-legend">
            <div className="ps-legend-item">
              <span className="ps-legend-line solid" />
              <span>Realisasi aktual</span>
            </div>
            <div className="ps-legend-item">
              <span className="ps-legend-line dashed" />
              <span>Proyeksi SMA</span>
            </div>
          </div>

          <div className="ps-chart-wrap">
            <Line data={chartData} options={chartOptions} />
          </div>
        </motion.div>

        {/* ── DIVIDER ── */}
        <motion.div
          className="ps-section-divider"
          variants={fadeUp}
          custom={0.3}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <span>Ringkasan Per Tahun</span>
        </motion.div>

        {/* ── TABLE ── */}
        <motion.div
          className="ps-table-wrap"
          variants={fadeUp}
          custom={0.4}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <table className="ps-table">
            <thead>
              <tr>
                <th>Tahun</th>
                <th>Realisasi</th>
                <th>Proyeksi SMA</th>
                <th>Selisih</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, i) => {
                const selisih = row.aktual != null
                  ? (row.prediksi - row.aktual).toFixed(2)
                  : null;
                const isPos = selisih !== null && parseFloat(selisih) >= 0;

                return (
                  <motion.tr
                    key={row.year}
                    className={activeRow === i ? 'active' : ''}
                    onClick={() => setActiveRow(activeRow === i ? null : i)}
                    variants={fadeUp}
                    custom={0.5 + i * 0.05}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                  >
                    <td className="ps-td-year">{row.year}</td>
                    <td>
                      {row.aktual != null
                        ? `Rp ${row.aktual.toFixed(2)}M`
                        : <span className="ps-td-null">—</span>}
                    </td>
                    <td className="ps-td-pred">Rp {row.prediksi.toFixed(2)}M</td>
                    <td>
                      {selisih !== null ? (
                        <span className={`ps-selisih ${isPos ? 'pos' : 'neg'}`}>
                          {isPos ? '+' : ''}{selisih}M
                        </span>
                      ) : (
                        <span className="ps-td-null">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`ps-badge ${row.type}`}>
                        {row.type === 'prediksi' ? 'Proyeksi' : 'Aktual'}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>

      </div>
    </section>
  );
};

export default BelumPredictionSection;