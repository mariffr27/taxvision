import React, { useEffect, useState } from 'react'
import TableData from '../../../components/admin/TableData'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Modal from '../../../components/common/Modal'

import {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
} from '../../../services/usersService'
import './Users.css'

const initialForm = {
    name: '',
    email: '',
    role: 'admin',
    password: '',
    password_confirmation: '',
}

export default function Users() {
    const [users, setUsers] = useState([])
    const [form, setForm] = useState(initialForm)

    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    const [selectedUser, setSelectedUser] = useState(null)
    const [mode, setMode] = useState('create')

    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const columns = [
        {
            key: 'name',
            label: 'Nama',
        },
        {
            key: 'email',
            label: 'Email',
        },
        {
            key: 'role',
            label: 'Role',
            render: (item) => (
                <span className={`role-badge role-${item.role}`}>
                    {item.role}
                </span>
            ),
        },
        {
            key: 'created_at',
            label: 'Dibuat',
            render: (item) => formatDate(item.created_at),
        },
    ]

    const loadUsers = async () => {
        try {
            setLoading(true)
            setError('')

            const response = await getUsers()
            setUsers(response.data || [])
        } catch (err) {
            setError(err.message || 'Gagal mengambil data users')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadUsers()
    }, [])

    const formatDate = (dateString) => {
        if (!dateString) return '-'

        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
    }

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        })
    }

    const openCreateModal = () => {
        setMode('create')
        setSelectedUser(null)
        setForm(initialForm)
        setMessage('')
        setError('')
        setIsModalOpen(true)
    }

    const openEditModal = (user) => {
        setMode('edit')
        setSelectedUser(user)

        setForm({
            name: user.name || '',
            email: user.email || '',
            role: user.role || 'admin',
            password: '',
            password_confirmation: '',
        })

        setMessage('')
        setError('')
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setSelectedUser(null)
        setForm(initialForm)
        setError('')
    }

    const openDeleteModal = (user) => {
        setSelectedUser(user)
        setError('')
        setMessage('')
        setIsDeleteModalOpen(true)
    }

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false)
        setSelectedUser(null)
        setError('')
    }

    const validateForm = () => {
        if (!form.name.trim()) {
            setError('Nama wajib diisi')
            return false
        }

        if (!form.email.trim()) {
            setError('Email wajib diisi')
            return false
        }

        if (mode === 'create' && !form.password.trim()) {
            setError('Password wajib diisi')
            return false
        }

        if (form.password && form.password.length < 8) {
            setError('Password minimal 8 karakter')
            return false
        }

        if (form.password !== form.password_confirmation) {
            setError('Konfirmasi password tidak sesuai')
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
                name: form.name,
                email: form.email,
                role: form.role,
            }

            if (mode === 'create' || form.password) {
                payload.password = form.password
                payload.password_confirmation = form.password_confirmation
            }

            if (mode === 'create') {
                await createUser(payload)
                setMessage('User berhasil ditambahkan')
            } else {
                await updateUser(selectedUser.id, payload)
                setMessage('User berhasil diperbarui')
            }

            closeModal()
            await loadUsers()
        } catch (err) {
            setError(getValidationMessage(err))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedUser) return

        try {
            setDeleting(true)
            setError('')
            setMessage('')

            await deleteUser(selectedUser.id)

            setMessage('User berhasil dihapus')
            closeDeleteModal()
            await loadUsers()
        } catch (err) {
            setError(err.message || 'Gagal menghapus user')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="users-page">
            <div className="users-header">
                <div>
                    <h2>Manajemen Users</h2>
                    <p>Kelola akun admin dan pengguna sistem SiPrediksi PBB.</p>
                </div>

                <Button variant="primary" onClick={openCreateModal}>
                    Tambah User
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
                data={users}
                loading={loading}
                emptyMessage="Belum ada data user"
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
                title={mode === 'create' ? 'Tambah User' : 'Edit User'}
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
                <form onSubmit={handleSubmit} className="user-form">
                    <Input
                        label="Nama"
                        type="text"
                        name="name"
                        value={form.name}
                        placeholder="Masukkan nama user"
                        onChange={handleChange}
                        required
                    />

                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={form.email}
                        placeholder="Masukkan email user"
                        onChange={handleChange}
                        required
                    />

                    <div className="form-group">
                        <label htmlFor="role">
                            Role <span>*</span>
                        </label>

                        <select
                            id="role"
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            required
                        >
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                        </select>
                    </div>

                    <Input
                        label={mode === 'create' ? 'Password' : 'Password Baru'}
                        type="password"
                        name="password"
                        value={form.password}
                        placeholder={
                            mode === 'create'
                                ? 'Masukkan password'
                                : 'Kosongkan jika tidak ingin mengubah password'
                        }
                        onChange={handleChange}
                        required={mode === 'create'}
                    />

                    <Input
                        label="Konfirmasi Password"
                        type="password"
                        name="password_confirmation"
                        value={form.password_confirmation}
                        placeholder="Ulangi password"
                        onChange={handleChange}
                        required={mode === 'create'}
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
                    Apakah kamu yakin ingin menghapus user{' '}
                    <strong>{selectedUser?.name}</strong>?
                </p>
            </Modal>
        </div>
    )
}