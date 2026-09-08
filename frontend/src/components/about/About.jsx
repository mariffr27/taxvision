import './About.css';
import { 
  TrendingUp, 
  Brain, 
  Shield, 
  Smartphone, 
  BarChart3, 
  Calendar, 
  Target, 
  Activity,
  Sparkles,
  Zap,
  LineChart,
  ArrowUpRight
} from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState, useMemo } from 'react';

const About = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { 
    once: true, 
    margin: "-100px",
    amount: 0.1
  });
  
  const [counters, setCounters] = useState({
    accuracy: 0,
    years: 0,
    params: 0,
    mape: 0
  });

  // Generate random positions for particles only once
  const particles = useMemo(() => {
    const items = [];
    for (let i = 0; i < 6; i++) {
      items.push({
        id: i,
        left: `${(i * 15 + 10) % 100}%`,
        top: `${(i * 20 + 5) % 100}%`,
        duration: 3 + (i % 3),
        delay: i * 0.3,
        size: 3 + (i % 3),
      });
    }
    return items;
  }, []);

  // Counter animation effect
  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const interval = duration / steps;
      
      let step = 0;
      const timer = setInterval(() => {
        step++;
        setCounters({
          accuracy: Math.min(94, Math.floor((94 / steps) * step)),
          years: Math.min(5, Math.floor((5 / steps) * step)),
          params: Math.min(3, Math.floor((3 / steps) * step)),
          mape: Math.min(6, Math.floor((6 / steps) * step))
        });
        
        if (step >= steps) clearInterval(timer);
      }, interval);
      
      return () => clearInterval(timer);
    }
  }, [isInView]);

  const highlights = [
    {
      icon: <BarChart3 size={22} strokeWidth={1.5} />,
      title: 'Data-Driven',
      desc: 'Keputusan berdasarkan data historis 5+ tahun.',
      gradient: 'from-emerald-400 to-teal-600',
      delay: 0.1,
    },
    {
      icon: <Brain size={22} strokeWidth={1.5} />,
      title: 'AI-Powered',
      desc: 'Algoritma machine learning untuk akurasi tinggi.',
      gradient: 'from-violet-400 to-purple-600',
      delay: 0.2,
    },
    {
      icon: <Shield size={22} strokeWidth={1.5} />,
      title: 'Terproteksi',
      desc: 'Enkripsi end-to-end sesuai standar keamanan.',
      gradient: 'from-blue-400 to-cyan-600',
      delay: 0.3,
    },
    {
      icon: <Smartphone size={22} strokeWidth={1.5} />,
      title: 'Aksesibel',
      desc: 'Dapat diakses dari desktop, tablet, maupun ponsel.',
      gradient: 'from-orange-400 to-amber-600',
      delay: 0.4,
    },
  ];

  const stats = [
    { 
      value: counters.accuracy,
      suffix: '%',
      label: 'Akurasi Model', 
      icon: <Target size={18} strokeWidth={1.5} />,
      accent: true,
    },
    { 
      value: counters.years,
      suffix: '+',
      label: 'Tahun Data Historis', 
      icon: <Calendar size={18} strokeWidth={1.5} />,
      accent: false,
    },
    { 
      value: counters.params,
      suffix: '',
      label: 'Parameter (α, β, γ)', 
      icon: <Activity size={18} strokeWidth={1.5} />,
      accent: false,
    },
    { 
      value: counters.mape,
      suffix: '%',
      prefix: '<',
      label: 'Nilai MAPE', 
      icon: <TrendingUp size={18} strokeWidth={1.5} />,
      accent: true,
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.3,
      },
    },
  };

  const fadeInUpVariants = {
    hidden: { 
      opacity: 0, 
      y: 40,
      filter: 'blur(10px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const highlightVariants = {
    hidden: { 
      opacity: 0, 
      x: -30,
      scale: 0.95,
    },
    visible: (delay) => ({
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        delay: delay,
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    }),
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      x: 60,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 1,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: 0.5,
      },
    },
  };

  const statVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.3,
      y: 30,
    },
    visible: (index) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        delay: 0.8 + index * 0.1,
        duration: 0.6,
        type: "spring",
        stiffness: 200,
        damping: 15,
      },
    }),
  };

  return (
    <section className="about" id="about" ref={sectionRef}>
      {/* Animated Background */}
      <div className="about-bg">
        <motion.div 
          className="about-bg-blob about-bg-blob-1"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div 
          className="about-bg-blob about-bg-blob-2"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div 
          className="about-bg-blob about-bg-blob-3"
          animate={{
            scale: [0.8, 1.1, 0.8],
            rotate: [-45, 45, -45],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <div className="about-bg-grid" />
      </div>

      {/* Floating particles */}
      <div className="about-particles">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="about-particle"
            style={{
              left: particle.left,
              top: particle.top,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
            animate={{
              y: [-20, 20],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              repeatType: "reverse",
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      <div className="about-inner">
        {/* Header Section */}
        <motion.div 
          className="about-header"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <motion.div variants={fadeInUpVariants} className="about-eyebrow-wrapper">
            <motion.span 
              className="about-eyebrow-icon"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles size={14} />
            </motion.span>
            <span className="about-eyebrow">Tentang Sistem</span>
            <motion.span 
              className="about-eyebrow-icon"
              animate={{ rotate: [360, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles size={14} />
            </motion.span>
          </motion.div>
          
          <motion.h2 variants={fadeInUpVariants} className="about-title">
            Mengenal Sistem{' '}
            <motion.span 
              className="about-title-highlight"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              Prediksi PBB
            </motion.span>
          </motion.h2>
          
          <motion.p variants={fadeInUpVariants} className="about-sub">
            Platform berbasis web yang dibangun untuk membantu BPKPD Kabupaten
            Magetan dalam memproyeksikan penerimaan pajak daerah secara akurat
            dan efisien.
          </motion.p>
        </motion.div>

        {/* Main Content */}
        <div className="about-layout">
          {/* Left Content */}
          <motion.div 
            className="about-text"
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <motion.div variants={fadeInUpVariants} className="about-text-badge">
              <Zap size={12} className="about-badge-icon" />
              Metode Analisis
            </motion.div>
            
            <motion.h3 variants={fadeInUpVariants}>
              Dari Data Historis ke Keputusan Fiskal
            </motion.h3>
            
            <motion.p variants={fadeInUpVariants}>
              Sistem ini menggunakan metode{' '}
              <strong className="about-text-accent">
                Single Moving Avarege (SMA)
              </strong>{' '}
              untuk menganalisis data historis penerimaan PBB dari tahun 2020
              hingga 2025 dengan tingkat presisi tinggi.
            </motion.p>
            
            <motion.p variants={fadeInUpVariants}>
              Seluruh data diolah secara otomatis, ditampilkan dalam dashboard
              interaktif yang intuitif, dan dapat diekspor dalam format PDF
              maupun Excel untuk kebutuhan pelaporan.
            </motion.p>

            {/* Highlights Grid */}
            <div className="about-highlights">
              {highlights.map((item) => (
                <motion.div 
                  key={item.title} 
                  className="about-highlight"
                  custom={item.delay}
                  variants={highlightVariants}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -5,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div 
                    className={`about-highlight-icon bg-gradient-to-br ${item.gradient}`}
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    {item.icon}
                  </motion.div>
                  <div className="about-highlight-text">
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                  <motion.div 
                    className="about-highlight-arrow"
                    initial={{ opacity: 0, x: -10 }}
                    whileHover={{ opacity: 1, x: 0 }}
                  >
                    <ArrowUpRight size={14} />
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Visual Card */}
          <motion.div 
            className="about-visual"
            variants={cardVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <motion.div 
              className="about-card"
              animate={{
                y: [-8, 8],
                transition: {
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                },
              }}
              whileHover={{ 
                y: -10,
                boxShadow: '0 30px 60px rgba(0,0,0,0.1)',
              }}
            >
              {/* Card Header */}
              <div className="about-card-header">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <LineChart size={20} className="about-card-header-icon" />
                </motion.div>
                <span>Performa Model</span>
                <motion.div 
                  className="about-card-badge"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Live
                </motion.div>
              </div>
              
              {/* Stats Grid */}
              <div className="about-card-stats">
                {stats.map((stat, index) => (
                  <motion.div 
                    key={stat.label} 
                    className={`about-stat ${stat.accent ? 'accent' : ''}`}
                    custom={index}
                    variants={statVariants}
                    whileHover={{ 
                      scale: 1.05,
                      backgroundColor: stat.accent ? '#f0fdfa' : '#ffffff',
                      borderColor: stat.accent ? '#0d9488' : '#e2e8f0',
                    }}
                  >
                    <motion.div 
                      className={`about-stat-icon ${stat.accent ? 'accent' : ''}`}
                      animate={stat.accent ? {
                        scale: [1, 1.2, 1],
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {stat.icon}
                    </motion.div>
                    <div className={`about-stat-value ${stat.accent ? 'accent' : ''}`}>
                      {stat.prefix && <span className="about-stat-prefix">{stat.prefix}</span>}
                      <motion.span
                        key={stat.value}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {stat.value}
                      </motion.span>
                      {stat.suffix && <span className="about-stat-suffix">{stat.suffix}</span>}
                    </div>
                    <div className="about-stat-label">{stat.label}</div>
                    
                    {stat.accent && (
                      <motion.div 
                        className="about-stat-indicator"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ delay: 1.5, duration: 0.8 }}
                      />
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Progress Bar */}
              <motion.div 
                className="about-card-progress"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1, duration: 0.6 }}
              >
                <div className="about-progress-header">
                  <span className="about-progress-label">Tingkat Optimasi Model</span>
                  <motion.span 
                    className="about-progress-value"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: 1.5 }}
                  >
                    92%
                  </motion.span>
                </div>
                <div className="about-progress-bar">
                  <motion.div 
                    className="about-progress-fill"
                    initial={{ width: 0 }}
                    animate={isInView ? { width: "92%" } : {}}
                    transition={{ 
                      delay: 1.2, 
                      duration: 1.5, 
                      ease: [0.25, 0.46, 0.45, 0.94] 
                    }}
                  />
                  <motion.div 
                    className="about-progress-glow"
                    animate={{ x: [0, 100, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              </motion.div>

              {/* Card Footer */}
              <motion.p 
                className="about-card-desc"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 1.5, duration: 0.6 }}
              >
                Model dioptimasi secara otomatis untuk meminimalkan tingkat
                kesalahan (MAPE) dan menghasilkan proyeksi paling presisi
                untuk perencanaan fiskal daerah.
              </motion.p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ===== CURVED DIVIDER - About ke Features ===== */}
{/* Divider ke Features */}
<div className="about-to-features-divider">
  <svg
    viewBox="0 0 1440 70"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M0,50 L1440,0 L1440,70 L0,70 Z" fill="#fafbf9" />
  </svg>
</div>
    </section>
  );
};

export default About;