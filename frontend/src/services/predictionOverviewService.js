const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

export const getPredictionOverview = async () => {
    const token = localStorage.getItem('token')

    const response = await fetch(`${API_BASE_URL}/prediction-overview`, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    })

    const result = await response.json()

    if (!response.ok) {
        throw new Error(result?.message || 'Gagal mengambil overview prediksi')
    }

    return result
}