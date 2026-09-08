const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

export const importDataPajak = async (file) => {
    const token = localStorage.getItem('token')

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/data-pajak-import`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
        const error = new Error(result?.message || 'Import data pajak gagal')
        error.errors = result?.errors || result?.data?.errors || null
        throw error
    }

    return result
}