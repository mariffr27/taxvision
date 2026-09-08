import React, { useEffect, useMemo, useRef, useState, useContext } from 'react'
import TableData from '../../../components/admin/TableData'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Modal from '../../../components/common/Modal'
import {
    getDataPajak,
    createDataPajak,
    updateDataPajak,
    deleteDataPajak,
} from '../../../services/dataPajakService'
import { getJenisPajak } from '../../../services/jenisPajakService'
import { importDataPajak } from '../../../services/dataPajakImportService'
import { AuthContext } from '../../../context/AuthContext'
import './DataPajak.css'

const initialForm = {
    id_jenis_pajak: '',
    tanggal_pajak: '',
    jumlah_pendapatan: '',
}

const initialFilter = {
    id_jenis_pajak: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
}

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv']

export default function DataPajak() {
    // ====== Auth Context ======
    const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext)

    // ====== State ======
    const [dataPajak, setDataPajak] = useState([])
    const [jenisPajak, setJenisPajak] = useState([])
    const [form, setForm] = useState(initialForm)
    const [filter, setFilter] = useState(initialFilter)

    const [fieldErrors, setFieldErrors] = useState({})
    const [importFieldError, setImportFieldError] = useState('')

    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)

    const [selectedData, setSelectedData] = useState(null)
    const [mode, setMode] = useState('create')

    const [toast, setToast] = useState(null)

    const [importFile, setImportFile] = useState(null)
    const [isDragActive, setIsDragActive] = useState(false)
    const [importing, setImporting] = useState(false)
    const [importResult, setImportResult] = useState(null)
    const fileInputRef = useRef(null)

    // ====== Columns ======
    const columns = [
        {
            key: 'tanggal_pajak',
            label: 'Tanggal Pajak',
            render: (item) => formatDate(item.tanggal_pajak),
            sortValue: (item) => item.tanggal_pajak,
        },
        {
            key: 'id_jenis_pajak',
            label: 'Jenis Pajak',
            render: (item) => getNamaJenisPajak(item.id_jenis_pajak),
            sortValue: (item) => getNamaJenisPajak(item.id_jenis_pajak),
        },
        {
            key: 'jumlah_pendapatan',
            label: 'Jumlah Pendapatan',
            render: (item) => formatRupiah(item.jumlah_pendapatan),
            sortValue: (item) => Number(item.jumlah_pendapatan) || 0,
        },
        {
            key: 'sumber_data',
            label: 'Sumber Data',
            render: (item) => {
                if (!item.sumber_data) return '-'
                const source = item.sumber_data.toLowerCase()
                const badges = {
                    'prediksi': { label: 'Prediksi', className: 'badge-prediksi' },
                    'manual': { label: 'Manual', className: 'badge-manual' },
                    'import': { label: 'Import', className: 'badge-import' },
                }
                const badge = badges[source] || { label: item.sumber_data, className: '' }
                return (
                    <span className={`badge ${badge.className}`}>
                        {badge.label}
                    </span>
                )
            },
            sortValue: (item) => item.sumber_data || '',
        },
        {
            key: 'hasil_prediksi_id',
            label: 'Hasil Prediksi ID',
            render: (item) => item.hasil_prediksi_id || '-',
            sortValue: (item) => item.hasil_prediksi_id || 0,
        },
        {
            key: 'created_at',
            label: 'Dibuat',
            render: (item) => formatDate(item.created_at),
            sortValue: (item) => item.created_at,
        },
    ]

    // ====== Data Loading ======
    const loadDataPajak = async () => {
        try {
            setLoading(true)
            const response = await getDataPajak()
            setDataPajak(response.data || [])
        } catch (err) {
            showToast('error', err.message || 'Gagal mengambil data pajak')
        } finally {
            setLoading(false)
        }
    }

    const loadJenisPajak = async () => {
        try {
            const response = await getJenisPajak()
            setJenisPajak(response.data || [])
        } catch (err) {
            console.error('Gagal load jenis pajak:', err)
        }
    }

    useEffect(() => {
        if (isAuthenticated && user) {
            loadDataPajak()
            loadJenisPajak()
        }
    }, [isAuthenticated, user])

    // ====== Toast ======
    useEffect(() => {
        if (!toast) return
        const timer = setTimeout(() => setToast(null), 5000)
        return () => clearTimeout(timer)
    }, [toast])

    const showToast = (type, text) => setToast({ type, text })

    // ====== Helper Functions ======
    const getNamaJenisPajak = (id) => {
        const item = jenisPajak.find((jenis) => Number(jenis.id) === Number(id))
        return item ? item.nama_pajak : `ID ${id}`
    }

    const formatDate = (dateString) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
    }

    const formatDateInput = (dateString) => {
        if (!dateString) return ''
        return String(dateString).slice(0, 10)
    }

    const formatRupiah = (value) => {
        if (!value) return 'Rp 0'
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(value))
    }

    // ====== Filter ======
    const handleFilterChange = (e) => {
        const { name, value } = e.target
        setFilter((prev) => ({ ...prev, [name]: value }))
    }

    const resetFilter = () => setFilter(initialFilter)

    const filteredData = useMemo(() => {
        return dataPajak.filter((item) => {
            if (filter.id_jenis_pajak && Number(item.id_jenis_pajak) !== Number(filter.id_jenis_pajak)) {
                return false
            }

            const itemDate = item.tanggal_pajak ? formatDateInput(item.tanggal_pajak) : ''

            if (filter.tanggal_mulai && itemDate && itemDate < filter.tanggal_mulai) {
                return false
            }

            if (filter.tanggal_selesai && itemDate && itemDate > filter.tanggal_selesai) {
                return false
            }

            return true
        })
    }, [dataPajak, filter])

    const isFilterActive = Boolean(filter.id_jenis_pajak || filter.tanggal_mulai || filter.tanggal_selesai)

    // ====== Modal Handlers ======
    const openCreateModal = () => {
        setMode('create')
        setSelectedData(null)
        setForm(initialForm)
        setFieldErrors({})
        setIsModalOpen(true)
    }

    const openEditModal = (item) => {
        setMode('edit')
        setSelectedData(item)

        setForm({
            id_jenis_pajak: item.id_jenis_pajak || '',
            tanggal_pajak: formatDateInput(item.tanggal_pajak),
            jumlah_pendapatan: item.jumlah_pendapatan || '',
        })

        setFieldErrors({})
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setSelectedData(null)
        setForm(initialForm)
        setFieldErrors({})
    }

    const openDeleteModal = (item) => {
        setSelectedData(item)
        setIsDeleteModalOpen(true)
    }

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false)
        setSelectedData(null)
    }

    const openImportModal = () => {
        setImportFile(null)
        setImportResult(null)
        setImportFieldError('')
        setIsImportModalOpen(true)
    }

    const closeImportModal = () => {
        setIsImportModalOpen(false)
        setImportFile(null)
        setImportResult(null)
        setImportFieldError('')
        setIsDragActive(false)
    }

    // ====== Form Validation ======
    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
        setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    const handleNumberChange = (e) => {
        const { name, value } = e.target
        const cleaned = value.replace(/[^0-9]/g, '')
        const finalValue = cleaned === '' ? '' : cleaned
        setForm((prev) => ({ ...prev, [name]: finalValue }))
        setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    const handleNumberBlur = (e) => {
        const { name, value } = e.target
        if (value && Number(value) <= 0) {
            setFieldErrors((prev) => ({
                ...prev,
                [name]: 'Jumlah pendapatan harus lebih besar dari 0'
            }))
        }
    }

    const validateForm = () => {
        const errors = {}
        if (!form.id_jenis_pajak) errors.id_jenis_pajak = 'Jenis pajak wajib dipilih'
        if (!form.tanggal_pajak) errors.tanggal_pajak = 'Tanggal pajak wajib diisi'
        if (!form.jumlah_pendapatan) errors.jumlah_pendapatan = 'Jumlah pendapatan wajib diisi'
        else if (Number(form.jumlah_pendapatan) <= 0) errors.jumlah_pendapatan = 'Jumlah pendapatan harus lebih besar dari 0'
        return errors
    }

    const getValidationErrors = (err) => {
        if (!err.errors) {
            return { general: err.message || 'Terjadi kesalahan' }
        }

        const mapped = {}
        Object.entries(err.errors).forEach(([field, messages]) => {
            mapped[field] = Array.isArray(messages) ? messages[0] : messages
        })
        return mapped
    }

    // ====== Submit ======
    const handleSubmit = async (e) => {
        e?.preventDefault()

        const errors = validateForm()
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            return
        }

        if (!user?.id) {
            showToast('error', 'User tidak ditemukan, silakan login ulang')
            return
        }

        try {
            setSaving(true)
            setFieldErrors({})

            const payload = {
                id_jenis_pajak: Number(form.id_jenis_pajak),
                id_user: Number(user.id),
                tanggal_pajak: form.tanggal_pajak,
                jumlah_pendapatan: Number(form.jumlah_pendapatan),
            }

            if (mode === 'create') {
                await createDataPajak(payload)
                showToast('success', 'Data pajak berhasil ditambahkan')
            } else {
                await updateDataPajak(selectedData.id, payload)
                showToast('success', 'Data pajak berhasil diperbarui')
            }

            closeModal()
            await loadDataPajak()
        } catch (err) {
            const errors = getValidationErrors(err)
            setFieldErrors(errors)
            showToast('error', errors.general || 'Gagal menyimpan data pajak')
        } finally {
            setSaving(false)
        }
    }

    // ====== Delete ======
    const handleDelete = async () => {
        if (!selectedData) return

        try {
            setDeleting(true)
            await deleteDataPajak(selectedData.id)
            showToast('success', 'Data pajak berhasil dihapus')
            closeDeleteModal()
            await loadDataPajak()
        } catch (err) {
            showToast('error', err.message || 'Gagal menghapus data pajak')
        } finally {
            setDeleting(false)
        }
    }

    // ====== Import ======
    const isAcceptedFile = (file) => {
        if (!file) return false
        const name = file.name.toLowerCase()
        return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))
    }

    const selectFile = (file) => {
        if (!file) return

        if (!isAcceptedFile(file)) {
            setImportFieldError('Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv')
            return
        }

        setImportFieldError('')
        setImportFile(file)
        setImportResult(null)
    }

    const handleFileInputChange = (e) => {
        selectFile(e.target.files?.[0] || null)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragActive(false)
        selectFile(e.dataTransfer.files?.[0] || null)
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragActive(true)
    }

    const handleDragLeave = () => setIsDragActive(false)

    const removeSelectedFile = () => {
        setImportFile(null)
        setImportResult(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const formatFileSize = (bytes) => {
        if (!bytes) return ''
        const kb = bytes / 1024
        if (kb < 1024) return `${kb.toFixed(0)} KB`
        return `${(kb / 1024).toFixed(1)} MB`
    }

    const handleImport = async (e) => {
        e?.preventDefault()

        if (!importFile) {
            setImportFieldError('File Excel wajib dipilih')
            return
        }

        try {
            setImporting(true)
            setImportFieldError('')
            setImportResult(null)

            const response = await importDataPajak(importFile)

            setImportResult(response.data)
            showToast('success', response.message || 'Import data pajak berhasil')

            await loadDataPajak()
        } catch (err) {
            showToast('error', err.message || 'Import data pajak gagal')
        } finally {
            setImporting(false)
        }
    }

    // ====== Loading State ======
    if (authLoading) {
        return (
            <div className="data-pajak-page">
                <div className="data-pajak-loading">
                    <div className="loading-spinner" />
                    <p>Memuat data...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated || !user) {
        return (
            <div className="data-pajak-page">
                <div className="data-pajak-error">
                    <p>Silakan login terlebih dahulu untuk mengakses halaman ini.</p>
                </div>
            </div>
        )
    }

    // ====== Render ======
    return (
        <div className="data-pajak-page">
            {/* ====== Header ====== */}
            <div className="data-pajak-header">
                <div>
                    <h2>Data Pajak</h2>
                    <p>Kelola data historis pendapatan pajak untuk kebutuhan prediksi.</p>
                    {user && (
                        <div className="data-pajak-user-info">
                            <span className="user-info-label">Login sebagai:</span>
                            <strong>{user.name || user.email || user.username || user.id}</strong>
                        </div>
                    )}
                </div>

                <div className="data-pajak-actions">
                    <Button variant="secondary" onClick={openImportModal}>
                        Import Excel
                    </Button>

                    <Button variant="primary" onClick={openCreateModal}>
                        Tambah Data Pajak
                    </Button>
                </div>
            </div>

            {/* ====== Filter ====== */}
            <div className="data-pajak-filter">
                <div className="filter-field">
                    <label htmlFor="filter_jenis">Jenis Pajak</label>
                    <select
                        id="filter_jenis"
                        name="id_jenis_pajak"
                        value={filter.id_jenis_pajak}
                        onChange={handleFilterChange}
                    >
                        <option value="">Semua jenis pajak</option>
                        {jenisPajak.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.nama_pajak}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-field">
                    <label htmlFor="filter_mulai">Dari Tanggal</label>
                    <input
                        id="filter_mulai"
                        type="date"
                        name="tanggal_mulai"
                        value={filter.tanggal_mulai}
                        onChange={handleFilterChange}
                    />
                </div>

                <div className="filter-field">
                    <label htmlFor="filter_selesai">Sampai Tanggal</label>
                    <input
                        id="filter_selesai"
                        type="date"
                        name="tanggal_selesai"
                        value={filter.tanggal_selesai}
                        onChange={handleFilterChange}
                    />
                </div>

                {isFilterActive && (
                    <button type="button" className="filter-reset" onClick={resetFilter}>
                        Reset filter
                    </button>
                )}
            </div>

            {isFilterActive && !loading && (
                <p className="data-pajak-filter-info">
                    Menampilkan <strong>{filteredData.length}</strong> dari {dataPajak.length} data
                </p>
            )}

            {/* ====== Table ====== */}
            <TableData
                columns={columns}
                data={filteredData}
                loading={loading}
                emptyMessage={isFilterActive ? 'Tidak ada data yang cocok dengan filter' : 'Belum ada data pajak'}
                mobileCardTitleKey="tanggal_pajak"
                actions={(item) => (
                    <>
                        <Button variant="warning" size="small" onClick={() => openEditModal(item)}>
                            Edit
                        </Button>

                        <Button variant="danger" size="small" onClick={() => openDeleteModal(item)}>
                            Hapus
                        </Button>
                    </>
                )}
            />

            {/* ====== Toast ====== */}
            {toast && (
                <div className={`data-pajak-toast data-pajak-toast-${toast.type}`} role="status">
                    <span>{toast.text}</span>
                    <button type="button" onClick={() => setToast(null)} aria-label="Tutup notifikasi">
                        ×
                    </button>
                </div>
            )}

            {/* ====== Modal Create/Edit ====== */}
            <Modal
                isOpen={isModalOpen}
                title={mode === 'create' ? 'Tambah Data Pajak' : 'Edit Data Pajak'}
                onClose={closeModal}
                size="medium"
                footer={
                    <>
                        <Button variant="secondary" onClick={closeModal}>
                            Batal
                        </Button>

                        <Button variant="primary" onClick={handleSubmit} loading={saving}>
                            Simpan
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="data-pajak-form">
                    {user && (
                        <div className="form-user-info">
                            <span className="user-info-label">User:</span>
                            <span className="user-info-value">
                                {user.name || user.email || user.username || user.id}
                            </span>
                            <span className="user-info-id">(ID: {user.id})</span>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="id_jenis_pajak">
                            Jenis Pajak <span>*</span>
                        </label>

                        <select
                            id="id_jenis_pajak"
                            name="id_jenis_pajak"
                            value={form.id_jenis_pajak}
                            onChange={handleChange}
                            className={fieldErrors.id_jenis_pajak ? 'has-error' : ''}
                        >
                            <option value="">Pilih jenis pajak</option>
                            {jenisPajak.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.nama_pajak}
                                </option>
                            ))}
                        </select>
                        {fieldErrors.id_jenis_pajak && (
                            <span className="field-error">{fieldErrors.id_jenis_pajak}</span>
                        )}
                    </div>

                    <Input
                        label="Tanggal Pajak"
                        type="date"
                        name="tanggal_pajak"
                        value={form.tanggal_pajak}
                        onChange={handleChange}
                        error={fieldErrors.tanggal_pajak}
                        required
                    />

                    <div className="form-group">
                        <label htmlFor="jumlah_pendapatan">
                            Jumlah Pendapatan <span>*</span>
                        </label>
                        <div className="input-number-wrapper">
                            <span className="input-number-prefix">Rp</span>
                            <input
                                id="jumlah_pendapatan"
                                name="jumlah_pendapatan"
                                type="text"
                                inputMode="numeric"
                                value={form.jumlah_pendapatan}
                                onChange={handleNumberChange}
                                onBlur={handleNumberBlur}
                                placeholder="Contoh: 8000000"
                                className={`input-number-field ${fieldErrors.jumlah_pendapatan ? 'has-error' : ''}`}
                                required
                            />
                        </div>
                        {fieldErrors.jumlah_pendapatan && (
                            <span className="field-error">{fieldErrors.jumlah_pendapatan}</span>
                        )}
                    </div>
                </form>
            </Modal>

            {/* ====== Modal Import ====== */}
            <Modal
                isOpen={isImportModalOpen}
                title="Import Data Pajak"
                onClose={closeImportModal}
                size="medium"
                footer={
                    <>
                        <Button variant="secondary" onClick={closeImportModal}>
                            Tutup
                        </Button>

                        <Button variant="primary" onClick={handleImport} loading={importing}>
                            Import
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleImport} className="data-pajak-import-form">
                    {user && (
                        <div className="form-user-info">
                            <span className="user-info-label">Data akan diimport untuk:</span>
                            <span className="user-info-value">
                                {user.name || user.email || user.username || user.id}
                            </span>
                            <span className="user-info-id">(ID: {user.id})</span>
                        </div>
                    )}

                    <div className="form-group">
                        <label>
                            File Excel <span>*</span>
                        </label>

                        {!importFile ? (
                            <div
                                className={`import-dropzone ${isDragActive ? 'drag-active' : ''} ${importFieldError ? 'has-error' : ''}`}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => fileInputRef.current?.click()}
                                role="button"
                                tabIndex={0}
                            >
                                <span className="import-dropzone-icon" aria-hidden="true">⇪</span>
                                <p className="import-dropzone-title">Seret file ke sini, atau klik untuk pilih</p>
                                <p className="import-dropzone-hint">Mendukung .xlsx, .xls, .csv</p>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileInputChange}
                                    className="import-dropzone-input"
                                />
                            </div>
                        ) : (
                            <div className="import-file-preview">
                                <span className="import-file-icon" aria-hidden="true">📄</span>
                                <div className="import-file-info">
                                    <span className="import-file-name">{importFile.name}</span>
                                    <span className="import-file-size">{formatFileSize(importFile.size)}</span>
                                </div>
                                <button
                                    type="button"
                                    className="import-file-remove"
                                    onClick={removeSelectedFile}
                                    aria-label="Hapus file"
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        {importFieldError && <span className="field-error">{importFieldError}</span>}
                    </div>

                    <div className="import-info">
                        <p>Format kolom Excel yang digunakan:</p>
                        <code>id_jenis_pajak, tanggal_pajak, jumlah_pendapatan</code>
                        <p className="import-info-note">
                            <strong>Note:</strong> id_user akan diambil otomatis dari user yang login.
                            Contoh tanggal: 2021-01-01. Jumlah pendapatan ditulis angka saja, contoh: 8000000.
                        </p>
                    </div>

                    {importResult && (
                        <div className="import-result">
                            <div className="import-result-summary">
                                <div className="import-result-stat import-result-stat-success">
                                    <span>{importResult.jumlah_berhasil || 0}</span>
                                    <small>Berhasil</small>
                                </div>
                                <div className="import-result-stat import-result-stat-failed">
                                    <span>{importResult.jumlah_gagal || 0}</span>
                                    <small>Gagal</small>
                                </div>
                            </div>

                            {importResult.errors?.length > 0 && (
                                <div className="import-errors">
                                    <h4>Detail data gagal:</h4>

                                    {importResult.errors.map((item, index) => (
                                        <div key={index} className="import-error-item">
                                            <strong>Baris {item.baris}</strong>

                                            <ul>
                                                {item.errors.map((errorText, i) => (
                                                    <li key={i}>{errorText}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </form>
            </Modal>

            {/* ====== Modal Delete ====== */}
            <Modal
                isOpen={isDeleteModalOpen}
                title="Konfirmasi Hapus"
                onClose={closeDeleteModal}
                size="small"
                footer={
                    <>
                        <Button variant="secondary" onClick={closeDeleteModal}>
                            Batal
                        </Button>

                        <Button variant="danger" onClick={handleDelete} loading={deleting}>
                            Hapus
                        </Button>
                    </>
                }
            >
                <p>
                    Apakah kamu yakin ingin menghapus data pajak tanggal{' '}
                    <strong>{formatDate(selectedData?.tanggal_pajak)}</strong>?
                </p>
            </Modal>
        </div>
    )
}