import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import './DataSection.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const DataSection = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px', amount: 0.1 });

  const [isActive, setIsActive] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const [stats, setStats] = useState({
    avgAccuracy: 0,      // rata-rata akurasi (100 - rata-rata MAPE)
    bestMape: 0,         // MAPE terkecil (model terbaik)
    avgMape: 0,          // rata-rata MAPE
    totalPeriode: 0,
    tahunMin: null,
    tahunMax: null,
    distribusi: {
      tinggi: { count: 0, pct: 0 },   // akurasi >= 90%
      sedang: { count: 0, pct: 0 },   // akurasi 80-90%
      rendah: { count: 0, pct: 0 },   // akurasi < 80%
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const anglesRef = useRef([-Math.PI / 2, -Math.PI / 2, -Math.PI / 2]);
  const progsRef = useRef([0, 0, 0]);
  const prevTsRef = useRef(null);
  const animFrameRef = useRef(null);
  const isActiveRef = useRef(false);
  const isLockedRef = useRef(false);

  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  useEffect(() => { isLockedRef.current = isLocked; }, [isLocked]);

  const CX = 110, CY = 110;
  const RADII = useMemo(() => [100, 80, 118], []);
  const SPEEDS = useMemo(() => [
    (2 * Math.PI) / 14,
    -(2 * Math.PI) / 18,
    (2 * Math.PI) / 22,
  ], []);
  const ANCHORS = useMemo(() => [
    { x: 228, y: 28 },
    { x: 228, y: 110 },
    { x: 228, y: 183 },
  ], []);

  const ease = useCallback((t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t), []);

  // ── Fetch data MAPE dari API hasil-prediksi ──
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/hasil-prediksi`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const rows = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        const mapeRows = rows.filter((r) => r.metode_akurasi === 'MAPE');

        if (mapeRows.length === 0) {
          throw new Error('Tidak ada data dengan metode_akurasi = MAPE');
        }

        const mapeValues = mapeRows.map((r) => parseFloat(r.nilai_akurasi));
        const bestMape = Math.min(...mapeValues);
        const avgMape = mapeValues.reduce((a, b) => a + b, 0) / mapeValues.length;
        const avgAccuracy = 100 - avgMape;

        // Distribusi akurasi per periode
        let tinggi = 0, sedang = 0, rendah = 0;
        mapeValues.forEach((mape) => {
          const akurasi = 100 - mape;
          if (akurasi >= 90) tinggi++;
          else if (akurasi >= 80) sedang++;
          else rendah++;
        });
        const total = mapeValues.length;

        // Rentang tahun dari perioda_prediksi
        const tahunList = mapeRows
          .map((r) => new Date(r.perioda_prediksi).getFullYear())
          .filter((y) => !isNaN(y));
        const tahunMin = tahunList.length ? Math.min(...tahunList) : null;
        const tahunMax = tahunList.length ? Math.max(...tahunList) : null;

        setStats({
          avgAccuracy,
          bestMape,
          avgMape,
          totalPeriode: total,
          tahunMin,
          tahunMax,
          distribusi: {
            tinggi: { count: tinggi, pct: Math.round((tinggi / total) * 100) },
            sedang: { count: sedang, pct: Math.round((sedang / total) * 100) },
            rendah: { count: rendah, pct: Math.round((rendah / total) * 100) },
          },
        });
      } catch (err) {
        console.error('Gagal mengambil data hasil prediksi:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const tick = (ts) => {
      if (prevTsRef.current !== null) {
        const dt = Math.min((ts - prevTsRef.current) / 1000, 0.05);
        if (!isActiveRef.current) {
          for (let i = 0; i < 3; i++) anglesRef.current[i] += SPEEDS[i] * dt;
        }
        for (let i = 0; i < 3; i++) {
          if (isActiveRef.current) {
            progsRef.current[i] = Math.min(1, progsRef.current[i] + 2.5 * dt);
          } else {
            progsRef.current[i] = Math.max(0, progsRef.current[i] - 5.0 * dt);
          }
        }
      }
      prevTsRef.current = ts;

      for (let i = 0; i < 3; i++) {
        const ox = CX + RADII[i] * Math.cos(anglesRef.current[i]);
        const oy = CY + RADII[i] * Math.sin(anglesRef.current[i]);
        const dot = document.getElementById('pd' + i);
        if (dot) { dot.setAttribute('cx', ox); dot.setAttribute('cy', oy); }
        const p = ease(progsRef.current[i]);
        const tx = ox + (ANCHORS[i].x - ox) * p;
        const ty = oy + (ANCHORS[i].y - oy) * p;
        const ln = document.getElementById('pln' + i);
        if (ln) {
          ln.setAttribute('x1', ox); ln.setAttribute('y1', oy);
          ln.setAttribute('x2', tx); ln.setAttribute('y2', ty);
          ln.setAttribute('opacity', Math.min(p * 3, 0.85));
        }
        const td = document.getElementById('ptd' + i);
        if (td) {
          td.setAttribute('cx', tx); td.setAttribute('cy', ty);
          td.setAttribute('opacity', p > 0.05 ? Math.min(p * 2, 1) : 0);
        }
        const lb = document.getElementById('plb' + i);
        if (lb) lb.setAttribute('opacity', Math.max(0, (p - 0.75) / 0.25));
      }
      const core = document.getElementById('pcore');
      if (core) {
        const targetR = isActiveRef.current ? 65 : 60;
        const cur = parseFloat(core.getAttribute('r'));
        core.setAttribute('r', cur + (targetR - cur) * 0.12);
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [CX, CY, RADII, SPEEDS, ANCHORS, ease]);

  const handleMouseEnter = useCallback(() => {
    if (!isLockedRef.current) setIsActive(true);
  }, []);
  const handleMouseLeave = useCallback(() => {
    if (!isLockedRef.current) setIsActive(false);
  }, []);
  const handleClick = useCallback(() => {
    const next = !isLockedRef.current;
    setIsLocked(next);
    setIsActive(next);
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 32, filter: 'blur(8px)' },
    visible: (i = 0) => ({
      opacity: 1, y: 0, filter: 'blur(0px)',
      transition: { duration: 0.7, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
  };

  return (
    <section className="ds" id="data" ref={sectionRef}>
      <div className="ds-inner">

        {/* ── HEADER ── */}
        <motion.div
          className="ds-header"
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <span className="ds-overline">Data Pajak PBB</span>
          <h2 className="ds-title">Akurasi &amp; Performa<br />Model Prediksi</h2>
          <p className="ds-sub">
            Distribusi akurasi model di setiap periode, dihitung otomatis dari nilai MAPE
            hasil prediksi.
          </p>
          {error && (
            <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Gagal memuat data: {error}
            </p>
          )}
        </motion.div>

        {/* ── HERO ROW: Orbit + Stats ── */}
        <motion.div
          className="ds-hero"
          variants={fadeUp}
          custom={0.2}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {/* Orbit Visual */}
          <div className="ds-orbit-wrap">
            <div className="ds-orbit-label">
              <span className="ds-orbit-dot" />
              Akurasi Model · Per Periode
            </div>
            <div
              className="ds-orbit-stage"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
            >
              <svg viewBox="0 0 370 220" width="370" height="220">
                {/* Orbit rings */}
                <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(13,148,136,.1)" strokeWidth="1.5" />
                <circle cx="110" cy="110" r="80" fill="none" stroke="rgba(13,148,136,.12)" strokeWidth="1" strokeDasharray="5 4" />
                <circle cx="110" cy="110" r="118" fill="none" stroke="rgba(13,148,136,.06)" strokeWidth="1" />

                {/* Lines — digambar SEBELUM dot agar tertimpa dot */}
                <line id="pln0" stroke="#0d9488" strokeWidth="1.2" opacity="0" />
                <line id="pln1" stroke="#14b8a6" strokeWidth="1" opacity="0" />
                <line id="pln2" stroke="#9dcec8" strokeWidth="1" opacity="0" />

                {/* Orbit dots — di atas garis */}
                <circle id="pd0" r="6" fill="#0d9488" />
                <circle id="pd1" r="5" fill="#14b8a6" />
                <circle id="pd2" r="4" fill="#9dcec8" />

                {/* Core — digambar setelah garis agar garis tidak menembus core */}
                <circle id="pcore" cx="110" cy="110" r="60" fill="#071a12" />
                <text x="110" y="106" textAnchor="middle" dominantBaseline="central"
                  style={{ fontSize: '24px', fontWeight: 800, fill: '#fff', fontFamily: 'inherit', pointerEvents: 'none' }}>
                  {loading ? '…' : `${Math.round(stats.avgAccuracy)}%`}
                </text>
                <text x="110" y="127" textAnchor="middle"
                  style={{ fontSize: '9px', fontWeight: 600, fill: 'rgba(255,255,255,.5)', letterSpacing: '2px', fontFamily: 'inherit', pointerEvents: 'none' }}>
                  AKURAT
                </text>

                {/* Tip dots — di atas segalanya */}
                <circle id="ptd0" r="3.5" fill="#0d9488" opacity="0" />
                <circle id="ptd1" r="3" fill="#14b8a6" opacity="0" />
                <circle id="ptd2" r="2.5" fill="#9dcec8" opacity="0" />

                {/* Labels — paling atas, tidak ada yang menimpa */}
                <g id="plb0" opacity="0">
                  <rect x="232" y="10" width="124" height="36" rx="6" fill="#fff" stroke="rgba(13,148,136,.25)" strokeWidth="0.7" />
                  <text x="294" y="22" textAnchor="middle" dominantBaseline="central"
                    style={{ fontSize: '13px', fontWeight: 700, fill: '#071a12', fontFamily: 'inherit' }}>
                    {loading ? '…' : `${stats.distribusi.tinggi.pct}%`}
                  </text>
                  <text x="294" y="36" textAnchor="middle" dominantBaseline="central"
                    style={{ fontSize: '10px', fill: '#52645b', fontFamily: 'inherit' }}>
                    {loading ? '…' : `${stats.distribusi.tinggi.count} periode · \u226590%`}
                  </text>
                </g>
                <g id="plb1" opacity="0">
                  <rect x="232" y="92" width="124" height="36" rx="6" fill="#fff" stroke="rgba(20,184,166,.25)" strokeWidth="0.7" />
                  <text x="294" y="104" textAnchor="middle" dominantBaseline="central"
                    style={{ fontSize: '13px', fontWeight: 700, fill: '#071a12', fontFamily: 'inherit' }}>
                    {loading ? '…' : `${stats.distribusi.sedang.pct}%`}
                  </text>
                  <text x="294" y="118" textAnchor="middle" dominantBaseline="central"
                    style={{ fontSize: '10px', fill: '#52645b', fontFamily: 'inherit' }}>
                    {loading ? '…' : `${stats.distribusi.sedang.count} periode · 80\u201390%`}
                  </text>
                </g>
                <g id="plb2" opacity="0">
                  <rect x="232" y="165" width="124" height="36" rx="6" fill="#fff" stroke="rgba(157,206,200,.35)" strokeWidth="0.7" />
                  <text x="294" y="177" textAnchor="middle" dominantBaseline="central"
                    style={{ fontSize: '13px', fontWeight: 700, fill: '#071a12', fontFamily: 'inherit' }}>
                    {loading ? '…' : `${stats.distribusi.rendah.pct}%`}
                  </text>
                  <text x="294" y="191" textAnchor="middle" dominantBaseline="central"
                    style={{ fontSize: '10px', fill: '#52645b', fontFamily: 'inherit' }}>
                    {loading ? '…' : `${stats.distribusi.rendah.count} periode · \u003c80%`}
                  </text>
                </g>
              </svg>
            </div>
            <p className="ds-orbit-hint">Hover atau klik untuk detail tiap orbit</p>
          </div>

          {/* Right: legend + mini stats */}
          <div className="ds-orbit-right">
            <div className="ds-legend">
              {[
                { color: '#0d9488', label: 'Di atas 90% akurat', val: loading ? '…' : `${stats.distribusi.tinggi.pct}%` },
                { color: '#14b8a6', label: 'Antara 80–90%', val: loading ? '…' : `${stats.distribusi.sedang.pct}%` },
                { color: '#9dcec8', label: 'Di bawah 80%', val: loading ? '…' : `${stats.distribusi.rendah.pct}%` },
              ].map((l) => (
                <div className="ds-legend-row" key={l.label}>
                  <span className="ds-legend-pip" style={{ background: l.color }} />
                  <span className="ds-legend-label">{l.label}</span>
                  <span className="ds-legend-val">{l.val}</span>
                </div>
              ))}
            </div>

            <div className="ds-mini-stats">
              {[
                { num: loading ? '…' : `${Math.round(stats.avgAccuracy)}%`, sub: 'Akurasi rata-rata' },
                { num: loading ? '…' : `${stats.bestMape.toFixed(2)}%`, sub: 'MAPE Terendah' },
                {
                  num: loading || !stats.tahunMin ? '…' : (stats.tahunMin === stats.tahunMax ? `${stats.tahunMin}` : `${stats.tahunMin}\u2013${stats.tahunMax}`),
                  sub: 'Rentang Periode',
                },
              ].map((s, i) => (
                <motion.div
                  key={s.sub}
                  className="ds-mini-stat"
                  variants={fadeUp}
                  custom={0.4 + i * 0.1}
                  initial="hidden"
                  animate={isInView ? 'visible' : 'hidden'}
                >
                  <span className="ds-mini-num">{s.num}</span>
                  <span className="ds-mini-sub">{s.sub}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DataSection;