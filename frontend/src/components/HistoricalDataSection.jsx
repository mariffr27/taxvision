// components/historicalData/HistoricalDataSection.jsx
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const HistoricalDataSection = () => {
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
                borderColor: 'rgba(34,197,94,0.15)',
                borderWidth: 1,
                titleColor: '#1a2e22',
                bodyColor: '#4a6354',
                padding: 12,
                cornerRadius: 12,
                callbacks: {
                    label: ctx => ` ${ctx.dataset.label}: Rp ${ctx.parsed.y.toFixed(2)}M`,
                },
            },
        },
        scales: {
            x: {
                grid: { color: 'rgba(34,197,94,0.06)', drawBorder: false },
                ticks: { font: { size: 12, family: 'inherit' }, color: '#4a6354', autoSkip: false },
                border: { display: false },
            },
            y: {
                min: 5.5,
                max: 10.5,
                grid: { color: 'rgba(34,197,94,0.06)', drawBorder: false },
                ticks: {
                    font: { size: 12, family: 'inherit' },
                    color: '#4a6354',
                    callback: v => 'Rp ' + v.toFixed(1) + 'M',
                },
                border: { display: false },
            },
        },
    };

    const fadeUp = {
        hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
        visible: (i = 0) => ({
            opacity: 1, y: 0, filter: 'blur(0px)',
            transition: { duration: 0.6, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
        }),
    };

    return (
        <div ref={sectionRef} className="bg-white border border-gray-100 rounded-3xl p-5 md:p-8 shadow-xl shadow-gray-100/50">

            {/* ── HEADER ── */}
            <motion.div
                className="mb-6"
                variants={fadeUp}
                custom={0}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
            >
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                    Tren Penerimaan PBB
                </span>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mt-1">
                    Realisasi & Proyeksi
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                    Penerimaan 2019–2026
                </p>
            </motion.div>

            {/* ── CHART CARD ── */}
            <motion.div
                variants={fadeUp}
                custom={0.1}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
            >
                {/* Chart Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="text-sm font-semibold text-gray-700">Tren Tahunan 2019–2026</span>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-1">
                        {filters.map(f => (
                            <button
                                key={f.key}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${activeFilter === f.key
                                        ? 'bg-white text-green-700 shadow-sm shadow-gray-200'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                onClick={() => setActiveFilter(f.key)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-0.5 bg-green-500 rounded-full" />
                        <span className="text-xs text-gray-500">Realisasi aktual</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-0.5 border-t-2 border-dashed border-teal-600 rounded-full" />
                        <span className="text-xs text-gray-500">Proyeksi SMA</span>
                    </div>
                </div>

                {/* Chart */}
                <div className="h-64 md:h-72 mb-6">
                    <Line data={chartData} options={chartOptions} />
                </div>
            </motion.div>

            {/* ── DIVIDER ── */}
            <motion.div
                className="flex items-center gap-4 my-6"
                variants={fadeUp}
                custom={0.3}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
            >
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Ringkasan Per Tahun
                </span>
                <div className="flex-1 h-px bg-gray-100" />
            </motion.div>

            {/* ── TABLE ── */}
            <motion.div
                className="overflow-x-auto"
                variants={fadeUp}
                custom={0.4}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
            >
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tahun</th>
                            <th className="text-right py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Realisasi</th>
                            <th className="text-right py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Proyeksi SMA</th>
                            <th className="text-right py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Selisih</th>
                            <th className="text-center py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
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
                                    className={`border-b border-gray-50 cursor-pointer transition-colors duration-200 ${activeRow === i
                                            ? 'bg-green-50/50'
                                            : 'hover:bg-gray-50/50'
                                        }`}
                                    onClick={() => setActiveRow(activeRow === i ? null : i)}
                                    variants={fadeUp}
                                    custom={0.5 + i * 0.04}
                                    initial="hidden"
                                    animate={isInView ? 'visible' : 'hidden'}
                                >
                                    <td className="py-3 px-3">
                                        <span className="font-semibold text-gray-900">{row.year}</span>
                                        {row.type === 'prediksi' && (
                                            <span className="inline-block w-1 h-1 rounded-full bg-green-400 ml-1.5 align-middle" />
                                        )}
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                        {row.aktual != null ? (
                                            <span className="text-gray-700 font-medium">Rp {row.aktual.toFixed(2)}M</span>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                        <span className="text-teal-700 font-medium">Rp {row.prediksi.toFixed(2)}M</span>
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                        {selisih !== null ? (
                                            <span className={`inline-flex items-center gap-1 font-medium text-xs ${isPos ? 'text-green-600' : 'text-red-500'
                                                }`}>
                                                {isPos ? (
                                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                        <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                )}
                                                {isPos ? '+' : ''}{selisih}M
                                            </span>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${row.type === 'prediksi'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}>
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
    );
};

export default HistoricalDataSection;