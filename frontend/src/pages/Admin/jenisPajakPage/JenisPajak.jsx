import React, { useEffect, useState } from 'react'
import TableData from '../../../components/admin/TableData'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Modal from '../../../components/common/Modal'
import {
    getJenisPajak,
    createJenisPajak,
    updateJenisPajak,
    deleteJenisPajak,
} from '../../../services/jenisPajakService'
import './JenisPajak.css'

const initialForm = {
    nama_pajak: '',
    keterangan: '',
}

export default function JenisPajak() {
    const [jenisPajak, setJenisPajak] = useState([])
    const [form, setForm] = useState(initialForm)

    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    const [selectedJenisPajak, setSelectedJenisPajak] = useState(null)
    const [mode, setMode] = useState('create')

    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const columns = [
        {
            key: 'nama_pajak',
            label: 'Nama Pajak',
        },
        {
            key: 'keterangan',
            label: 'Keterangan',
            render: (item) => item.keterangan || '-',
        },
        {
            key: 'created_at',
            label: 'Dibuat',
            render: (item) => formatDate(item.created_at),
        },
    ]

    const formatDate = (dateString) => {
        if (!dateString) return '-'

        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
    }

    const loadJenisPajak = async () => {
        try {
            setLoading(true)
            setError('')

            const response = await getJenisPajak()
            setJenisPajak(response.data || [])
        } catch (err) {
            setError(err.message || 'Gagal mengambil data jenis pajak')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadJenisPajak()
    }, [])

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        })
    }

    const openCreateModal = () => {
        setMode('create')
        setSelectedJenisPajak(null)
        setForm(initialForm)
        setMessage('')
        setError('')
        setIsModalOpen(true)
    }

    const openEditModal = (item) => {
        setMode('edit')
        setSelectedJenisPajak(item)

        setForm({
            nama_pajak: item.nama_pajak || '',
            keterangan: item.keterangan || '',
        })

        setMessage('')
        setError('')
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setSelectedJenisPajak(null)
        setForm(initialForm)
        setError('')
    }

    const openDeleteModal = (item) => {
        setSelectedJenisPajak(item)
        setMessage('')
        setError('')
        setIsDeleteModalOpen(true)
    }

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false)
        setSelectedJenisPajak(null)
        setError('')
    }

    const validateForm = () => {
        if (!form.nama_pajak.trim()) {
            setError('Nama pajak wajib diisi')
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
                nama_pajak: form.nama_pajak,
                keterangan: form.keterangan,
            }

            if (mode === 'create') {
                await createJenisPajak(payload)
                setMessage('Jenis pajak berhasil ditambahkan')
            } else {
                await updateJenisPajak(selectedJenisPajak.id, payload)
                setMessage('Jenis pajak berhasil diperbarui')
            }

            closeModal()
            await loadJenisPajak()
        } catch (err) {
            setError(getValidationMessage(err))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedJenisPajak) return

        try {
            setDeleting(true)
            setError('')
            setMessage('')

            await deleteJenisPajak(selectedJenisPajak.id)

            setMessage('Jenis pajak berhasil dihapus')
            closeDeleteModal()
            await loadJenisPajak()
        } catch (err) {
            setError(err.message || 'Gagal menghapus jenis pajak')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="jenis-pajak-page">
            <div className="jenis-pajak-header">
                <div>
                    <h2>Jenis Pajak</h2>
                    <p>Kelola daftar jenis pajak yang digunakan dalam sistem prediksi.</p>
                </div>

                <Button variant="primary" onClick={openCreateModal}>
                    Tambah Jenis Pajak
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
                data={jenisPajak}
                loading={loading}
                emptyMessage="Belum ada data jenis pajak"
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
                title={mode === 'create' ? 'Tambah Jenis Pajak' : 'Edit Jenis Pajak'}
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
                <form onSubmit={handleSubmit} className="jenis-pajak-form">
                    <Input
                        label="Nama Pajak"
                        type="text"
                        name="nama_pajak"
                        value={form.nama_pajak}
                        placeholder="Contoh: Pajak P2B / PBB"
                        onChange={handleChange}
                        required
                    />

                    <div className="form-group">
                        <label htmlFor="keterangan">Keterangan</label>
                        <textarea
                            id="keterangan"
                            name="keterangan"
                            value={form.keterangan}
                            placeholder="Contoh: Pajak bumi dan bangunan"
                            onChange={handleChange}
                            rows="4"
                        ></textarea>
                    </div>
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
                    Apakah kamu yakin ingin menghapus jenis pajak{' '}
                    <strong>{selectedJenisPajak?.nama_pajak}</strong>?
                </p>
            </Modal>
        </div>
    )
}