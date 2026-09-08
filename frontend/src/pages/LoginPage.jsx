import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
    const navigate = useNavigate();
    const { saveAuth } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        email: '',
        password: '',
    });

    const [fieldErrors, setFieldErrors] = useState({
        email: '',
        password: '',
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });

        if (fieldErrors[e.target.name]) {
            setFieldErrors({
                ...fieldErrors,
                [e.target.name]: '',
            });
        }

        if (error) {
            setError('');
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!form.email.trim()) {
            errors.email = 'Email harus diisi';
        } else if (!/\S+@\S+\.\S+/.test(form.email)) {
            errors.email = 'Format email tidak valid';
        }

        if (!form.password.trim()) {
            errors.password = 'Password harus diisi';
        } else if (form.password.length < 6) {
            errors.password = 'Password minimal 6 karakter';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            setError('');

            const response = await login({
                email: form.email,
                password: form.password,
            });

            saveAuth({
                token: response.data.token,
                user: response.data.user,
            });

            navigate('/admin');
        } catch (err) {
            if (err.response) {
                const status = err.response.status;
                const message = err.response.data?.message || err.message;

                if (status === 401) {
                    setError('Email atau password salah. Silakan coba lagi.');
                    setFieldErrors({
                        email: 'Email atau password tidak sesuai',
                        password: 'Email atau password tidak sesuai',
                    });
                } else if (status === 404) {
                    setError('Akun tidak ditemukan. Silakan periksa email Anda.');
                    setFieldErrors({
                        email: 'Email tidak terdaftar',
                        password: '',
                    });
                } else if (status === 429) {
                    setError('Terlalu banyak percobaan login. Silakan coba lagi nanti.');
                } else {
                    setError(message || 'Login gagal. Silakan coba lagi.');
                }
            } else if (err.request) {
                setError('Gagal terhubung ke server. Periksa koneksi internet Anda.');
            } else {
                setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="lp lp-login-only">
            <div className="lp-login-card">
                <div className="lp-head">
                    <span className="lp-overline">Admin Access</span>
                    <h1 className="lp-title">Masuk ke Dashboard</h1>
                    <p className="lp-sub">
                        Kelola data pajak, prediksi, dan laporan analitik dalam satu
                        sistem terpadu.
                    </p>
                </div>

                {error && (
                    <div className="lp-error">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {error}
                    </div>
                )}

                <form className="lp-form" onSubmit={handleSubmit}>
                    <div className="lp-field">
                        <label htmlFor="email" className="lp-label">
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            name="email"
                            className={`lp-input ${fieldErrors.email ? 'lp-input-error' : ''}`}
                            placeholder="Masukkan email"
                            autoComplete="email"
                            value={form.email}
                            onChange={handleChange}
                            disabled={loading}
                        />

                        {fieldErrors.email && (
                            <div className="lp-field-error">
                                {fieldErrors.email}
                            </div>
                        )}
                    </div>

                    <div className="lp-field">
                        <label htmlFor="password" className="lp-label">
                            Password
                        </label>

                        <div className={`lp-pw-wrap ${fieldErrors.password ? 'lp-pw-error' : ''}`}>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                className={`lp-input lp-input-pw ${fieldErrors.password ? 'lp-input-error' : ''}`}
                                placeholder="Masukkan password"
                                autoComplete="current-password"
                                value={form.password}
                                onChange={handleChange}
                                disabled={loading}
                            />

                            <button
                                type="button"
                                className="lp-pw-toggle"
                                onClick={() => setShowPassword((value) => !value)}
                                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                disabled={loading}
                            >
                                {showPassword ? (
                                    <EyeOff size={15} strokeWidth={1.8} />
                                ) : (
                                    <Eye size={15} strokeWidth={1.8} />
                                )}
                            </button>
                        </div>

                        {fieldErrors.password && (
                            <div className="lp-field-error">
                                {fieldErrors.password}
                            </div>
                        )}
                    </div>

                    <div className="lp-opts">
                        <label className="lp-check">
                            <input type="checkbox" />
                            <span className="lp-checkmark" />
                            <span>Ingat saya</span>
                        </label>

                        <a href="#" className="lp-forgot">
                            Lupa password?
                        </a>
                    </div>

                    <button type="submit" className="lp-btn" disabled={loading}>
                        {loading ? 'Memproses...' : 'Masuk'}
                        {!loading && <ArrowRight size={15} strokeWidth={2.2} />}
                    </button>
                </form>

                <p className="lp-footer">
                    © {new Date().getFullYear()} TaxVision · BPKPD Kabupaten Magetan
                </p>
            </div>
        </main>
    );
};

export default LoginPage; 