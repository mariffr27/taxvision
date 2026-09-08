import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import './Features.css';

const Features = () => {
  const [activeCard, setActiveCard] = useState(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-50px", amount: 0.1 });

  const handleToggle = (index) => {
    setActiveCard(activeCard === index ? null : index);
  };

  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      title: 'Prediksi Time Series',
      desc: 'Metode Simple Moving Average (SMA) dengan auto-tuning parameter untuk akurasi maksimal di setiap siklus prediksi.',
      tags: ['SMA', 'Auto-Tuning'],
      gradient: 'from-emerald-400 to-teal-600',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
      ),
      title: 'Dashboard Interaktif',
      desc: 'Visualisasi data real-time dalam grafik dan diagram yang responsif di semua perangkat.',
      tags: ['Real-time', 'Chart.js'],
      gradient: 'from-violet-400 to-purple-600',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
      title: 'Ekspor Laporan',
      desc: 'Unduh hasil prediksi dalam format PDF dan Excel siap pakai untuk keperluan dokumentasi.',
      tags: ['PDF', 'Excel'],
      gradient: 'from-blue-400 to-cyan-600',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      ),
      title: 'Evaluasi Akurasi',
      desc: 'Metrik MAPE, MAE, dan RMSE dihitung otomatis untuk memvalidasi performa model.',
      tags: ['MAPE', 'MAE', 'RMSE'],
      gradient: 'from-orange-400 to-amber-600',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      title: 'Akses Berbasis Peran',
      desc: 'Sistem memiliki hak akses.',
      tags: ['Role-based', 'Multi-User'],
      gradient: 'from-rose-400 to-pink-600',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
        </svg>
      ),
      title: 'Manajemen Data',
      desc: 'Kelola, unggah, dan monitor data historis secara terpusat dalam satu sistem terintegrasi.',
      tags: ['CRUD', 'Upload'],
      gradient: 'from-indigo-400 to-blue-600',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <section className="features" id="features" ref={sectionRef}>
      {/* Animated Background */}
      <div className="features-bg">
        <motion.div 
          className="features-bg-blob features-bg-blob-1"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 45, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div 
          className="features-bg-blob features-bg-blob-2"
          animate={{
            scale: [1.1, 1, 1.1],
            rotate: [45, 0, 45],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <div className="features-bg-grid" />
      </div>

      <div className="features-inner">
        {/* Header */}
        <motion.div 
          className="features-header"
          variants={headerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <div className="features-eyebrow-wrapper">
            <span className="features-eyebrow-dot" />
            <span className="features-eyebrow">Fitur Unggulan</span>
          </div>
          <h2 className="features-title">Mengapa Sistem Ini?</h2>
          <p className="features-sub">
            Dirancang dengan pendekatan berbeda — bukan sekadar tools, tapi
            experience yang powerful.
          </p>
        </motion.div>

        {/* Orb Grid */}
        <motion.div 
          className="features-orb-grid"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className={`features-orb-card ${activeCard === index ? 'active' : ''}`}
              variants={itemVariants}
              onClick={() => handleToggle(index)}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              {/* Orb Visual */}
              <div className="features-orb-visual">
                <motion.div 
                  className="features-orb-ring"
                  animate={activeCard === index ? {
                    rotate: [0, 360],
                  } : {
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: activeCard === index ? 6 : 12,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <motion.div 
                  className={`features-orb-circle bg-gradient-to-br ${feature.gradient}`}
                  animate={activeCard === index ? {
                    scale: [1, 1.05, 1],
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {feature.icon}
                </motion.div>
                <div className="features-orb-particle" />
                <div className="features-orb-particle" />
                <div className="features-orb-particle" />
              </div>

              {/* Title */}
              <span className="features-orb-title">{feature.title}</span>

              {/* Expandable Panel */}
              <motion.div 
                className="features-orb-panel"
                initial={false}
                animate={{
                  maxHeight: activeCard === index ? 200 : 0,
                  opacity: activeCard === index ? 1 : 0,
                  padding: activeCard === index ? '1.3rem 1.2rem' : '0',
                  borderColor: activeCard === index ? 'rgba(13, 148, 136, 0.15)' : 'rgba(10, 26, 15, 0.04)',
                }}
                transition={{
                  duration: 0.5,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <p>{feature.desc}</p>
                <div className="features-orb-tags">
                  {feature.tags.map((tag) => (
                    <span key={tag} className="features-orb-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Divider ke DataSection */}
<div className="features-to-data-divider">
  <svg
    viewBox="0 0 1440 70"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M0,50 L1440,0 L1440,70 L0,70 Z" fill="#ffffff" />
  </svg>
</div>
    </section>
  );
};

export default Features;