import React, { useEffect, useState } from 'react'
import TableData from '../../../components/admin/TableData'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Modal from '../../../components/common/Modal'
import { getJenisPajak } from '../../../services/jenisPajakService'
import { getModelPrediksi } from '../../../services/modelPrediksiService'
import {
    getHasilPrediksi,
    getDetailHasilPrediksi,
    createHasilPrediksi,
    updateHasilPrediksi,
    deleteHasilPrediksi,
} from '../../../services/hasilPrediksiService'
import './HasilPrediksi.css'

const initialForm = {
    id_jenis_pajak: '',
    id_model: '',
    perioda_prediksi: '',
    nilai_prediksi: '',
    metode_akurasi: 'MAPE',
    nilai_akurasi: '',
}

export default function HasilPrediksi() {
    const [hasilPrediksi, setHasilPrediksi] = useState([])
    const [jenisPajak, setJenisPajak] = useState([])
    const [modelPrediksi, setModelPrediksi] = useState([])

    const [form, setForm] = useState(initialForm)

    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

    const [selectedData, setSelectedData] = useState(null)
    const [detailData, setDetailData] = useState(null)
    const [mode, setMode] = useState('create')

    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const columns = [
        {
            key: 'perioda_prediksi',
            label: 'Periode',
            render: (item) => formatDate(item.perioda_prediksi),
        },
        {
            key: 'id_jenis_pajak',
            label: 'Jenis Pajak',
            render: (item) =>
                item.jenis_pajak?.nama_pajak || getNamaJenisPajak(item.id_jenis_pajak),
        },
        {
            key: 'id_model',
            label: 'Model',
            render: (item) =>
                item.model_prediksi?.nama_model || getNamaModel(item.id_model),
        },
        {
            key: 'nilai_prediksi',
            label: 'Nilai Prediksi',
            render: (item) => formatRupiah(item.nilai_prediksi),
        },
        {
            key: 'metode_akurasi',
            label: 'Metode',
            render: (item) => item.metode_akurasi || '-',
        },
        {
            key: 'nilai_akurasi',
            label: 'Akurasi',
            render: (item) => formatAkurasi(item.nilai_akurasi),
        },
    ]

    const normalizeData = (data) => {
        if (Array.isArray(data)) return data
        if (data && typeof data === 'object') return [data]
        return []
    }

    const loadHasilPrediksi = async () => {
        try {
            setLoading(true)
            setError('')

            const response = await getHasilPrediksi()
            setHasilPrediksi(normalizeData(response.data))
        } catch (err) {
            setError(err.message || 'Gagal mengambil data hasil prediksi')
        } finally {
            setLoading(false)
        }
    }

    const loadJenisPajak = async () => {
        try {
            const response = await getJenisPajak()
            setJenisPajak(response.data || [])
        } catch (err) {
            console.error(err)
        }
    }

    const loadModelPrediksi = async () => {
        try {
            const response = await getModelPrediksi()
            setModelPrediksi(response.data || [])
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        loadHasilPrediksi()
        loadJenisPajak()
        loadModelPrediksi()
    }, [])

    const getNamaJenisPajak = (id) => {
        const item = jenisPajak.find((jenis) => Number(jenis.id) === Number(id))
        return item ? item.nama_pajak : `ID ${id}`
    }

    const getNamaModel = (id) => {
        const item = modelPrediksi.find((model) => Number(model.id) === Number(id))
        return item ? item.nama_model : `ID ${id}`
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

    const formatAkurasi = (value) => {
        if (value === null || value === undefined || value === '') return '-'

        return `${Number(value).toLocaleString('id-ID', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}%`
    }

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        })
    }

    const openCreateModal = () => {
        setMode('create')
        setSelectedData(null)
        setForm(initialForm)
        setMessage('')
        setError('')
        setIsModalOpen(true)
    }

    const openEditModal = (item) => {
        setMode('edit')
        setSelectedData(item)

        setForm({
            id_jenis_pajak: item.id_jenis_pajak || '',
            id_model: item.id_model || '',
            perioda_prediksi: formatDateInput(item.perioda_prediksi),
            nilai_prediksi: item.nilai_prediksi || '',
            metode_akurasi: item.metode_akurasi || 'MAPE',
            nilai_akurasi: item.nilai_akurasi || '',
        })

        setMessage('')
        setError('')
        setIsModalOpen(true)
    }

    const openDetailModal = async (item) => {
        try {
            setError('')
            setDetailData(item)
            setIsDetailModalOpen(true)

            const response = await getDetailHasilPrediksi(item.id)
            setDetailData(response.data || item)
        } catch (err) {
            setError(err.message || 'Gagal mengambil detail hasil prediksi')
        }
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setSelectedData(null)
        setForm(initialForm)
        setError('')
    }

    const closeDetailModal = () => {
        setIsDetailModalOpen(false)
        setDetailData(null)
    }

    const openDeleteModal = (item) => {
        setSelectedData(item)
        setMessage('')
        setError('')
        setIsDeleteModalOpen(true)
    }

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false)
        setSelectedData(null)
        setError('')
    }

    const validateForm = () => {
        if (!form.id_jenis_pajak) {
            setError('Jenis pajak wajib dipilih')
            return false
        }

        if (!form.id_model) {
            setError('Model prediksi wajib dipilih')
            return false
        }

        if (!form.perioda_prediksi) {
            setError('Periode prediksi wajib diisi')
            return false
        }

        if (!form.nilai_prediksi) {
            setError('Nilai prediksi wajib diisi')
            return false
        }

        if (!form.metode_akurasi.trim()) {
            setError('Metode akurasi wajib diisi')
            return false
        }

        if (form.nilai_akurasi === '') {
            setError('Nilai akurasi wajib diisi')
            return false
        }

        return true
    }

    const getValidationMessage = (err) => {
        if (!err.errors) {
            return err.message || 'Terjadi kesalahan'
        }

        const firstField = Object.keys(err.errors)[0]
        return err.errors[firstField]?.[0] || err.message
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) return

        try {
            setSaving(true)
            setError('')
            setMessage('')

            const payload = {
                id_jenis_pajak: Number(form.id_jenis_pajak),
                id_model: Number(form.id_model),
                perioda_prediksi: form.perioda_prediksi,
                nilai_prediksi: Number(form.nilai_prediksi),
                metode_akurasi: form.metode_akurasi,
                nilai_akurasi: Number(form.nilai_akurasi),
            }

            if (mode === 'create') {
                await createHasilPrediksi(payload)
                setMessage('Hasil prediksi berhasil ditambahkan')
            } else {
                await updateHasilPrediksi(selectedData.id, payload)
                setMessage('Hasil prediksi berhasil diperbarui')
            }

            closeModal()
            await loadHasilPrediksi()
        } catch (err) {
            setError(getValidationMessage(err))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedData) return

        try {
            setDeleting(true)
            setError('')
            setMessage('')

            await deleteHasilPrediksi(selectedData.id)

            setMessage('Hasil prediksi berhasil dihapus')
            closeDeleteModal()
            await loadHasilPrediksi()
        } catch (err) {
            setError(err.message || 'Gagal menghapus hasil prediksi')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="hasil-prediksi-page">
            <div className="hasil-prediksi-header">
                <div>
                    <h2>Hasil Prediksi</h2>
                    <p>Kelola hasil prediksi penerimaan pajak daerah berdasarkan model yang digunakan.</p>
                </div>

                <Button variant="primary" onClick={openCreateModal}>
                    Tambah Hasil
                </Button>
            </div>

            {message && (
                <div className="alert alert-success">
                    {message}
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            <TableData
                columns={columns}
                data={hasilPrediksi}
                loading={loading}
                emptyMessage="Belum ada data hasil prediksi"
                actions={(item) => (
                    <>
                        <Button
                            variant="secondary"
                            size="small"
                            onClick={() => openDetailModal(item)}
                        >
                            Detail
                        </Button>

                        <Button
                            variant="warning"
                            size="small"
                            onClick={() => openEditModal(item)}
                        >
                            Edit
                        </Button>

                        <Button
                            variant="danger"
                            size="small"
                            onClick={() => openDeleteModal(item)}
                        >
                            Hapus
                        </Button>
                    </>
                )}
            />

            <Modal
                isOpen={isModalOpen}
                title={mode === 'create' ? 'Tambah Hasil Prediksi' : 'Edit Hasil Prediksi'}
                onClose={closeModal}
                size="medium"
                footer={
                    <>
                        <Button variant="secondary" onClick={closeModal}>
                            Batal
                        </Button>

                        <Button
                            type="submit"
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={saving}
                        >
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="hasil-prediksi-form">
                    <div className="form-group">
                        <label htmlFor="id_jenis_pajak">
                            Jenis Pajak <span>*</span>
                        </label>

                        <select
                            id="id_jenis_pajak"
                            name="id_jenis_pajak"
                            value={form.id_jenis_pajak}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Pilih jenis pajak</option>
                            {jenisPajak.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.nama_pajak}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="id_model">
                            Model Prediksi <span>*</span>
                        </label>

                        <select
                            id="id_model"
                            name="id_model"
                            value={form.id_model}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Pilih model prediksi</option>
                            {modelPrediksi.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.nama_model}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Periode Prediksi"
                        type="date"
                        name="perioda_prediksi"
                        value={form.perioda_prediksi}
                        onChange={handleChange}
                        required
                    />

                    <Input
                        label="Nilai Prediksi"
                        type="number"
                        name="nilai_prediksi"
                        value={form.nilai_prediksi}
                        placeholder="Contoh: 10900000"
                        onChange={handleChange}
                        required
                    />

                    <Input
                        label="Metode Akurasi"
                        type="text"
                        name="metode_akurasi"
                        value={form.metode_akurasi}
                        placeholder="Contoh: MAPE"
                        onChange={handleChange}
                        required
                    />

                    <Input
                        label="Nilai Akurasi"
                        type="number"
                        name="nilai_akurasi"
                        value={form.nilai_akurasi}
                        placeholder="Contoh: 0.92"
                        onChange={handleChange}
                        required
                    />
                </form>
            </Modal>

            <Modal
                isOpen={isDetailModalOpen}
                title="Detail Hasil Prediksi"
                onClose={closeDetailModal}
                size="medium"
                footer={
                    <Button variant="secondary" onClick={closeDetailModal}>
                        Tutup
                    </Button>
                }
            >
                <div className="detail-grid">
                    <div className="detail-item">
                        <span>Jenis Pajak</span>
                        <strong>{detailData?.jenis_pajak?.nama_pajak || getNamaJenisPajak(detailData?.id_jenis_pajak)}</strong>
                    </div>

                    <div className="detail-item">
                        <span>Model Prediksi</span>
                        <strong>{detailData?.model_prediksi?.nama_model || getNamaModel(detailData?.id_model)}</strong>
                    </div>

                    <div className="detail-item">
                        <span>Parameter Model</span>
                        <strong>{detailData?.model_prediksi?.parameter || '-'}</strong>
                    </div>

                    <div className="detail-item">
                        <span>Periode Prediksi</span>
                        <strong>{formatDate(detailData?.perioda_prediksi)}</strong>
                    </div>

                    <div className="detail-item">
                        <span>Nilai Prediksi</span>
                        <strong>{formatRupiah(detailData?.nilai_prediksi)}</strong>
                    </div>

                    <div className="detail-item">
                        <span>Metode Akurasi</span>
                        <strong>{detailData?.metode_akurasi || '-'}</strong>
                    </div>

                    <div className="detail-item">
                        <span>Nilai Akurasi</span>
                        <strong>{formatAkurasi(detailData?.nilai_akurasi)}</strong>
                    </div>

                    <div className="detail-item">
                        <span>Dibuat</span>
                        <strong>{formatDate(detailData?.created_at)}</strong>
                    </div>
                </div>
            </Modal>

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

                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? 'Menghapus...' : 'Hapus'}
                        </Button>
                    </>
                }
            >
                <p>
                    Apakah kamu yakin ingin menghapus hasil prediksi periode{' '}
                    <strong>{formatDate(selectedData?.perioda_prediksi)}</strong>?
                </p>
            </Modal>
        </div>
    )
}