const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

const getHeaders = () => {
    const token = localStorage.getItem('token')

    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

const request = async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...getHeaders(),
            ...(options.headers || {}),
        },
    })

    let result = null

    try {
        result = await response.json()
    } catch {
        result = null
    }

    if (!response.ok) {
        const error = new Error(result?.message || 'Terjadi kesalahan pada server')
        error.errors = result?.errors || null
        throw error
    }

    return result
}

export const getUsers = async () => {
    return request('/users')
}

export const createUser = async (payload) => {
    return request('/users', {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export const updateUser = async (id, payload) => {
    return request(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    })
}

export const deleteUser = async (id) => {
    return request(`/users/${id}`, {
        method: 'DELETE',
    })
}