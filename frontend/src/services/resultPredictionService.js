const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

const buildQuery = (params = {}) => {
    const query = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.append(key, value)
        }
    })

    return query.toString()
}

export async function getDataPajakList({ id_jenis_pajak }) {
    const response = await fetch(`/api/data-pajak?id_jenis_pajak=${id_jenis_pajak}`)
    if (!response.ok) throw new Error('Gagal mengambil data pajak aktual')
    const json = await response.json()
    return json?.data || json || []
}

export const getResultPredictionMultiTahun = async ({
    id_jenis_pajak = 1,
    id_model = 1,
    tahun_mulai = 2020,
    tahun_selesai = 2026,
} = {}) => {
    const token = localStorage.getItem('token')

    const query = buildQuery({
        id_jenis_pajak,
        id_model,
        tahun_mulai,
        tahun_selesai,
    })

    const response = await fetch(`${API_BASE_URL}/prediksi/multi-tahun?${query}`, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    })

    const result = await response.json()

    if (!response.ok) {
        throw new Error(result?.message || 'Gagal mengambil hasil prediksi multi-tahun')
    }

    return result
}