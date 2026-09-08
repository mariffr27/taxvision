import React, { useEffect, useState } from 'react'
import TableData from '../../../components/admin/TableData'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Modal from '../../../components/common/Modal'
import {
    getModelPrediksi,
    createModelPrediksi,
    updateModelPrediksi,
    deleteModelPrediksi,
} from '../../../services/modelPrediksiService'
import './ModelPrediksi.css'

const initialForm = {
    nama_model: '',
    parameter: '',
    akurasi: '',
}

export default function ModelPrediksi() {
    const [modelPrediksi, setModelPrediksi] = useState([])
    const [form, setForm] = useState(initialForm)

    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    const [selectedModel, setSelectedModel] = useState(null)
    const [mode, setMode] = useState('create')

    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const columns = [
        {
            key: 'nama_model',
            label: 'Nama Model',
        },
        {
            key: 'parameter',
            label: 'Parameter',
            render: (item) => item.parameter || '-',
        },
        {
            key: 'akurasi',
            label: 'Akurasi',
            render: (item) => formatAkurasi(item.akurasi),
        },
        {
            key: 'created_at',
            label: 'Dibuat',
            render: (item) => formatDate(item.created_at),
        },
    ]

    const loadModelPrediksi = async () => {
        try {
            setLoading(true)
            setError('')

            const response = await getModelPrediksi()
            setModelPrediksi(response.data || [])
        } catch (err) {
            setError(err.message || 'Gagal mengambil data model prediksi')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadModelPrediksi()
    }, [])

    const formatDate = (dateString) => {
        if (!dateString) return '-'

        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
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
        setSelectedModel(null)
        setForm(initialForm)
        setMessage('')
        setError('')
        setIsModalOpen(true)
    }

    const openEditModal = (item) => {
        setMode('edit')
        setSelectedModel(item)

        setForm({
            nama_model: item.nama_model || '',
            parameter: item.parameter || '',
            akurasi: item.akurasi || '',
        })

        setMessage('')
        setError('')
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setSelectedModel(null)
        setForm(initialForm)
        setError('')
    }

    const openDeleteModal = (item) => {
        setSelectedModel(item)
        setMessage('')
        setError('')
        setIsDeleteModalOpen(true)
    }

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false)
        setSelectedModel(null)
        setError('')
    }

    const validateForm = () => {
        if (!form.nama_model.trim()) {
            setError('Nama model wajib diisi')
            return false
        }

        if (!form.parameter.trim()) {
            setError('Parameter wajib diisi')
            return false
        }

        if (form.akurasi === '') {
            setError('Akurasi wajib diisi')
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
                nama_model: form.nama_model,
                parameter: form.parameter,
                akurasi: Number(form.akurasi),
            }

            if (mode === 'create') {
                await createModelPrediksi(payload)
                setMessage('Model prediksi berhasil ditambahkan')
            } else {
                await updateModelPrediksi(selectedModel.id, payload)
                setMessage('Model prediksi berhasil diperbarui')
            }

            closeModal()
            await loadModelPrediksi()
        } catch (err) {
            setError(getValidationMessage(err))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedModel) return

        try {
            setDeleting(true)
            setError('')
            setMessage('')

            await deleteModelPrediksi(selectedModel.id)

            setMessage('Model prediksi berhasil dihapus')
            closeDeleteModal()
            await loadModelPrediksi()
        } catch (err) {
            setError(err.message || 'Gagal menghapus model prediksi')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="model-prediksi-page">
            <div className="model-prediksi-header">
                <div>
                    <h2>Model Prediksi</h2>
                    <p>Kelola metode prediksi yang digunakan dalam sistem.</p>
                </div>

                <Button variant="primary" onClick={openCreateModal}>
                    Tambah Model
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
                data={modelPrediksi}
                loading={loading}
                emptyMessage="Belum ada data model prediksi"
                actions={(item) => (
                    <>
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
                title={mode === 'create' ? 'Tambah Model Prediksi' : 'Edit Model Prediksi'}
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
                <form onSubmit={handleSubmit} className="model-prediksi-form">
                    <Input
                        label="Nama Model"
                        type="text"
                        name="nama_model"
                        value={form.nama_model}
                        placeholder="Contoh: SMA 5 Tahun Terakhir"
                        onChange={handleChange}
                        required
                    />

                    <Input
                        label="Parameter"
                        type="text"
                        name="parameter"
                        value={form.parameter}
                        placeholder="Contoh: periode=5"
                        onChange={handleChange}
                        required
                    />

                    <Input
                        label="Akurasi"
                        type="number"
                        name="akurasi"
                        value={form.akurasi}
                        placeholder="Contoh: 0.00"
                        onChange={handleChange}
                        required
                    />
                </form>
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
                    Apakah kamu yakin ingin menghapus model prediksi{' '}
                    <strong>{selectedModel?.nama_model}</strong>?
                </p>
            </Modal>
        </div>
    )
}