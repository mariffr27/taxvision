const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

const getHeaders = () => {
    const token = localStorage.getItem('token')

    return {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

const buildQuery = (params = {}) => {
    const query = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.append(key, value)
        }
    })

    const queryString = query.toString()
    return queryString ? `?${queryString}` : ''
}

export const getLaporan = async (params = {}) => {
    const response = await fetch(`${API_BASE_URL}/laporan${buildQuery(params)}`, {
        method: 'GET',
        headers: getHeaders(),
    })

    const result = await response.json()

    if (!response.ok) {
        const error = new Error(result?.message || 'Gagal mengambil laporan')
        error.errors = result?.errors || null
        throw error
    }

    return result
}