import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import './Footer.css';
import taxVisionLogo from '../../assets/taxvision-logo.png';

const Footer = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px', amount: 0.2 });
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Sistem',
      links: [
        { href: '#', label: 'Dashboard' },
        { href: '#', label: 'Prediksi PBB' },
        { href: '#', label: 'Data Historis' },
        { href: '#', label: 'Laporan Analisis' },
      ],
    },
    {
      title: 'Analisis',
      links: [
        { href: '#', label: 'Metode Prediksi' },
        { href: '#', label: 'Time Series' },
        { href: '#', label: 'Visualisasi Data' },
        { href: '#', label: 'Akurasi Model' },
      ],
    },
    {
      title: 'Dukungan',
      links: [
        { href: '#', label: 'Panduan Pengguna' },
        { href: '#', label: 'Dokumentasi' },
        { href: '#', label: 'Kebijakan Privasi' },
        { href: '#', label: 'Kontak' },
      ],
    },
  ];

  const bottomLinks = [
    { href: '#', label: 'Privasi' },
    { href: '#', label: 'Ketentuan' },
    { href: '#', label: 'Kontak' },
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.65, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
  };

  return (
    <footer className="footer" ref={ref}>
      {/* Divider DataSection → Footer */}
      <div className="footer-divider">
        <svg viewBox="0 0 1440 70" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,0 L1440,50 L1440,0 L0,0 Z" fill="#ffffff" />
        </svg>
      </div>

      <div className="footer-inner">
        {/* ── MAIN ROW ── */}
        <div className="footer-main">

          {/* Brand Column */}
          <motion.div
            className="footer-brand-col"
            variants={fadeUp}
            custom={0}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            <a href="#" className="footer-logo" aria-label="TaxVision">
              <div className="footer-logo-icon">
                <img src={taxVisionLogo} alt="TaxVision Logo" className="footer-logo-img" />
              </div>
              <span className="footer-brand-name">TaxVision</span>
            </a>

            <p className="footer-desc">
              Platform analisis dan prediksi penerimaan PBB berbasis data
              historis untuk perencanaan pajak daerah yang lebih akurat
              dan terukur.
            </p>

            <div className="footer-info">
              <div className="footer-info-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <path d="M3 21h18"/>
                  <path d="M5 21V8l7-5 7 5v13"/>
                  <path d="M9 21v-7h6v7"/>
                </svg>
              </div>
              <div>
                <strong>BPKPD Kabupaten Magetan</strong>
                <span>Sistem pendukung analisis penerimaan Pajak Bumi dan Bangunan.</span>
              </div>
            </div>
          </motion.div>

          {/* Link Columns */}
          {footerLinks.map((col, i) => (
            <motion.div
              key={col.title}
              className="footer-col"
              variants={fadeUp}
              custom={(i + 1) * 0.1}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
              <h5>{col.title}</h5>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* ── GARIS ── */}
        <motion.div
          className="footer-line"
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        />

        {/* ── BOTTOM BAR ── */}
        <motion.div
          className="footer-bottom"
          variants={fadeUp}
          custom={0.5}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <p className="footer-copy">
            © {currentYear} TaxVision · BPKPD Kabupaten Magetan. Hak cipta dilindungi.
          </p>
          <ul className="footer-bottom-links">
            {bottomLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;