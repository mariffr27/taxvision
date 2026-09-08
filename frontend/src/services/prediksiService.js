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

    const result = await response.json()

    if (!response.ok) {
        const error = new Error(result?.message || 'Terjadi kesalahan pada server')
        error.errors = result?.errors || null
        throw error
    }

    return result
}

export const getDetailPrediksi = async (id) => {
    return request(`/prediksi/detail/${id}`)
}

export const getPrediksiMultiTahun = async (params = {}) => {
    const query = new URLSearchParams(params).toString()

    return request(`/prediksi/multi-tahun${query ? `?${query}` : ''}`)
}

export const postPrediksiMultiTahun = async (payload) => {
    return request('/prediksi/multi-tahun', {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export const postPrediksiSma = async (payload) => {
    return request('/prediksi-sma', {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}