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

export const getModelPrediksi = async () => {
    return request('/model-prediksi')
}

export const createModelPrediksi = async (payload) => {
    return request('/model-prediksi', {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export const updateModelPrediksi = async (id, payload) => {
    return request(`/model-prediksi/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    })
}

export const deleteModelPrediksi = async (id) => {
    return request(`/model-prediksi/${id}`, {
        method: 'DELETE',
    })
}