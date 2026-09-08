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

export const getHasilPrediksi = async () => {
    return request('/hasil-prediksi')
}

export const getDetailHasilPrediksi = async (id) => {
    return request(`/hasil-prediksi/${id}`)
}

export const createHasilPrediksi = async (payload) => {
    return request('/hasil-prediksi', {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export const updateHasilPrediksi = async (id, payload) => {
    return request(`/hasil-prediksi/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    })
}

export const deleteHasilPrediksi = async (id) => {
    return request(`/hasil-prediksi/${id}`, {
        method: 'DELETE',
    })
}