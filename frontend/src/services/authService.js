const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

export const login = async (payload) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (!response.ok) {
        const error = new Error(result?.message || 'Login gagal')
        error.errors = result?.errors || null
        throw error
    }

    return result
}

export const logout = async () => {
    const token = localStorage.getItem('token')

    const response = await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
    })

    const result = await response.json()

    if (!response.ok) {
        throw new Error(result?.message || 'Logout gagal')
    }

    return result
}

export const getMe = async () => {
    const token = localStorage.getItem('token')

    const response = await fetch(`${API_BASE_URL}/me`, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
    })

    const result = await response.json()

    if (!response.ok) {
        throw new Error(result?.message || 'Gagal mengambil data user')
    }

    return result
}