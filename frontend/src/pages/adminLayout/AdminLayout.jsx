import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Database, TrendingUp, BarChart3,
    Tags, FileText, Users, LogOut, Search,
    ChevronDown, MoreHorizontal, Zap, Sparkles,
    BookOpen, X, AlertTriangle,
} from 'lucide-react';
import taxvisionLogo from '../../assets/taxvision-logo.png';
import './AdminLayout.css';

const AdminLayout = () => {
    const [activeTab, setActiveTab] = useState('Mingguan');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    const isDashboardPage = location.pathname === '/admin';

    const navMain = [
        { label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
        { label: 'Panduan Prediksi', icon: BookOpen, to: '/admin/panduan-prediksi' },
        { label: 'Jenis Pajak', icon: Tags, to: '/admin/jenis-pajak' },
        { label: 'Model Prediksi', icon: TrendingUp, to: '/admin/model-prediksi' },
        { label: 'Data Pajak', icon: Database, to: '/admin/data-pajak' },
        { label: 'Prediksi', icon: TrendingUp, to: '/admin/prediksi' },
        { label: 'Hasil Prediksi', icon: BarChart3, to: '/admin/hasil-prediksi' },
        { label: 'Laporan', icon: FileText, to: '/admin/laporan' },
    ];

    const navSecondary = [
        { label: 'Pengguna', icon: Users, to: '/admin/users' },
    ];

    const barData = [
        { val: 45, label: 'Sen' },
        { val: 68, label: 'Sel' },
        { val: 55, label: 'Rab' },
        { val: 82, label: 'Kam' },
        { val: 60, label: 'Jum' },
        { val: 91, label: 'Sab' },
        { val: 73, label: 'Min' },
    ];

    const maxVal = Math.max(...barData.map(d => d.val));

    // ── Handler logout ──────────────────────────────────────────────────────
    const handleLogout = () => {
        // Bersihkan token / session yang tersimpan
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();

        setShowLogoutModal(false);
        navigate('/login');
    };

    return (
        <main className="al-shell">

            {/* ══ MODAL KONFIRMASI LOGOUT ══════════════════════════════════════ */}
            {showLogoutModal && (
                <div
                    className="al-modal-overlay"
                    onClick={() => setShowLogoutModal(false)}
                >
                    <div
                        className="al-modal"
                        onClick={e => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                    >
                        <div className="al-modal-icon">
                            <AlertTriangle size={22} strokeWidth={1.8} />
                        </div>

                        <h3 id="modal-title">Keluar dari Sistem?</h3>
                        <p>Anda akan keluar dari sesi ini. Pastikan semua pekerjaan sudah tersimpan sebelum melanjutkan.</p>

                        <div className="al-modal-actions">
                            <button
                                className="al-modal-cancel"
                                onClick={() => setShowLogoutModal(false)}
                            >
                                Batal
                            </button>
                            <button
                                className="al-modal-confirm"
                                onClick={handleLogout}
                            >
                                <LogOut size={13} strokeWidth={1.8} />
                                Ya, Keluar
                            </button>
                        </div>

                        <button
                            className="al-modal-close"
                            onClick={() => setShowLogoutModal(false)}
                            aria-label="Tutup"
                        >
                            <X size={14} strokeWidth={2} />
                        </button>
                    </div>
                </div>
            )}

            {/* ══ SIDEBAR ══════════════════════════════════════════════════════ */}
            <aside className="al-sidebar">

                {/* Logo — gambar dari assets */}
                <div className="al-logo">
                    <img
                        src={taxvisionLogo}
                        alt="TaxVision"
                        className="al-logo-img"
                    />
                </div>

                {/* Nav main */}
                <nav className="al-nav-section">
                    <span className="al-nav-label">Menu</span>

                    {navMain.map(item => (
                        <NavLink
                            key={item.label}
                            to={item.to}
                            end={item.to === '/admin'}
                            className={({ isActive }) =>
                                `al-nav-item ${isActive ? 'active' : ''}`
                            }
                        >
                            <item.icon size={15} strokeWidth={1.6} />
                            {item.label}

                            {location.pathname === item.to && (
                                <span className="al-nav-pip" />
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Nav secondary */}
                <nav className="al-nav-section">
                    <span className="al-nav-label">Lainnya</span>

                    {navSecondary.map(item => (
                        <NavLink
                            key={item.label}
                            to={item.to}
                            className={({ isActive }) =>
                                `al-nav-item ${isActive ? 'active' : ''}`
                            }
                        >
                            <item.icon size={15} strokeWidth={1.6} />
                            {item.label}

                            {location.pathname === item.to && (
                                <span className="al-nav-pip" />
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User + tombol logout */}
                <div className="al-user">
                    <div className="al-user-av">AD</div>
                    <div className="al-user-meta">
                        <p>Admin Daerah</p>
                        <span>● online</span>
                    </div>
                    <button
                        className="al-user-logout"
                        aria-label="Logout"
                        title="Keluar"
                        onClick={() => setShowLogoutModal(true)}
                    >
                        <LogOut size={13} strokeWidth={1.6} />
                    </button>
                </div>
            </aside>

            {/* ══ MAIN ════════════════════════════════════════════════════════ */}
            <section className="al-main">

                {/* Topbar — notifikasi dihapus */}
                <header className="al-topbar">
                    <div className="al-search">
                        <Search size={13} strokeWidth={1.8} />
                        <input type="text" placeholder="Cari..." />
                        <kbd>⌘K</kbd>
                    </div>

                    <div className="al-topbar-right">
                        {/* Dropdown profil */}
                        <div className="al-profile-wrap">
                            <button
                                className="al-topbar-btn al-topbar-user"
                                aria-label="Profil"
                                aria-expanded={showProfileMenu}
                                onClick={() => setShowProfileMenu(v => !v)}
                            >
                                <div className="al-tb-av">A</div>
                                <ChevronDown
                                    size={12}
                                    strokeWidth={2}
                                    className={`al-chevron ${showProfileMenu ? 'open' : ''}`}
                                />
                            </button>

                            {showProfileMenu && (
                                <>
                                    {/* Overlay transparan untuk tutup menu klik di luar */}
                                    <div
                                        className="al-profile-backdrop"
                                        onClick={() => setShowProfileMenu(false)}
                                    />
                                    <div className="al-profile-menu">
                                        <div className="al-profile-info">
                                            <div className="al-profile-av">AD</div>
                                            <div>
                                                <p className="al-profile-name">Admin Daerah</p>
                                                <p className="al-profile-role">Administrator</p>
                                            </div>
                                        </div>

                                        <div className="al-profile-divider" />

                                        <button
                                            className="al-profile-item"
                                            onClick={() => {
                                                setShowProfileMenu(false);
                                                navigate('/admin/profil');
                                            }}
                                        >
                                            <Users size={13} strokeWidth={1.6} />
                                            Profil Saya
                                        </button>

                                        <div className="al-profile-divider" />

                                        <button
                                            className="al-profile-item al-profile-item--danger"
                                            onClick={() => {
                                                setShowProfileMenu(false);
                                                setShowLogoutModal(true);
                                            }}
                                        >
                                            <LogOut size={13} strokeWidth={1.6} />
                                            Keluar
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="al-content">
                    {!isDashboardPage ? (
                        <Outlet />
                    ) : (
                        <>
                            {/* Hero */}
                            <div className="al-hero">
                                <div className="al-hero-text">
                                    <div className="al-hero-badge">
                                        <Sparkles size={11} />
                                        Overview
                                    </div>
                                    <h2>Selamat datang kembali</h2>
                                    <p>Berikut ringkasan performa sistem prediksi pajak daerah.</p>
                                </div>

                                <button className="al-hero-btn">
                                    <Zap size={13} />
                                    Generate Report
                                </button>
                            </div>

                            {/* Metric Cards */}
                            <div className="al-metrics">
                                <div className="al-metric">
                                    <div className="al-metric-top">
                                        <div className="al-metric-icon al-icon-teal">
                                            <Database size={16} strokeWidth={1.6} />
                                        </div>
                                        <span className="al-metric-trend">+12%</span>
                                    </div>
                                    <div className="al-metric-val">
                                        60 <sup className="al-metric-unit">records</sup>
                                    </div>
                                    <div className="al-metric-label">Total Data</div>
                                </div>

                                <div className="al-metric al-metric-dark">
                                    <div className="al-metric-top">
                                        <div className="al-metric-icon al-icon-lime">
                                            <TrendingUp size={16} strokeWidth={1.6} />
                                        </div>
                                        <span className="al-metric-trend al-trend-light">+8.2%</span>
                                    </div>
                                    <div className="al-metric-val al-val-light">
                                        10.95 <span className="al-metric-unit al-unit-light">M</span>
                                    </div>
                                    <div className="al-metric-label al-label-light">Prediksi Terbaru</div>
                                </div>

                                <div className="al-metric">
                                    <div className="al-metric-top">
                                        <div className="al-metric-icon al-icon-green">
                                            <BarChart3 size={16} strokeWidth={1.6} />
                                        </div>
                                        <svg viewBox="0 0 36 36" width="36" height="36" aria-label="94% akurasi">
                                            <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
                                            <circle
                                                cx="18" cy="18" r="14" fill="none"
                                                stroke="#0d9488" strokeWidth="2.5"
                                                strokeDasharray="87.96 12.04"
                                                strokeLinecap="round"
                                                transform="rotate(-90 18 18)"
                                            />
                                        </svg>
                                    </div>
                                    <div className="al-metric-val">
                                        94 <span className="al-metric-unit">%</span>
                                    </div>
                                    <div className="al-metric-label">Akurasi Model</div>
                                </div>
                            </div>

                            {/* Panel */}
                            <div className="al-panel">
                                <div className="al-panel-head">
                                    <div>
                                        <h3>Monitoring Prediksi</h3>
                                        <p>Performa akurasi sistem per periode</p>
                                    </div>
                                    <div className="al-panel-actions">
                                        <div className="al-tabs">
                                            {['Mingguan', 'Bulanan', 'Tahunan'].map(t => (
                                                <button
                                                    key={t}
                                                    className={`al-tab ${activeTab === t ? 'active' : ''}`}
                                                    onClick={() => setActiveTab(t)}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                        <button className="al-panel-btn" aria-label="Opsi lainnya">
                                            <MoreHorizontal size={15} strokeWidth={1.8} />
                                        </button>
                                    </div>
                                </div>

                                <div className="al-panel-body">
                                    <div className="al-chart">
                                        <div className="al-chart-y">
                                            <span>100%</span>
                                            <span>75%</span>
                                            <span>50%</span>
                                            <span>25%</span>
                                            <span>0%</span>
                                        </div>
                                        <div className="al-chart-bars">
                                            {barData.map((item, i) => (
                                                <div key={i} className="al-chart-col">
                                                    <div className="al-chart-bar-wrap">
                                                        <div
                                                            className={`al-chart-bar ${item.val === maxVal ? 'peak' : ''}`}
                                                            style={{ height: `${item.val}%` }}
                                                        >
                                                            <span className="al-bar-tip">{item.val}%</span>
                                                        </div>
                                                    </div>
                                                    <span className="al-chart-x">{item.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="al-chart-summary">
                                        <div className="al-summary-item">
                                            <span className="al-summary-dot" />
                                            <span>Akurasi rata-rata</span>
                                            <strong>94.2%</strong>
                                        </div>
                                        <div className="al-summary-item">
                                            <span className="al-summary-dot al-dot-teal" />
                                            <span>Target</span>
                                            <strong>90%</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </section>
        </main>
    );
};

export default AdminLayout;