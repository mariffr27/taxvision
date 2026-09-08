import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'

import 'apexcharts/dist/apexcharts.css'

import ProtectedRoute from './routes/ProtectedRoute'

import LoginPage from './pages/LoginPage'
import AdminLayout from './pages/adminLayout/AdminLayout'
import PredictionPage from './pages/predictionPage/PredictionPage'
import HomePage from './pages/homePage/HomePage'
import AboutUsPage from './pages/AboutUsPage'


// Admin Pages
import Users from './pages/Admin/usersPage/Users'
import JenisPajak from './pages/admin/jenisPajakPage/JenisPajak';
import DataPajak from './pages/admin/dataPajakPage/DataPajak';
import ModelPrediksi from './pages/admin/modelPrediksiPage/ModelPrediksi';
import HasilPrediksi from './pages/admin/hasilPrediksiPage/HasilPrediksi';
import Prediksi from './pages/admin/prediksiPage/Prediksi';
import PanduanPrediksi from './pages/admin/panduanPrediksiPage/PanduanPrediksi';
import Laporan from './pages/admin/laporanPage/Laporan';

function App() {
  return (
    <Routes>
      {/* Public Page */}
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutUsPage />} />
      <Route path="/prediction" element={<PredictionPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Admin Page */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="users" element={<Users />} />
        <Route path="jenis-pajak" element={<JenisPajak />} />
        <Route path="data-pajak" element={<DataPajak />} />
        <Route path="model-prediksi" element={<ModelPrediksi />} />
        <Route path="hasil-prediksi" element={<HasilPrediksi />} />
        <Route path="prediksi" element={<Prediksi />} />
        <Route path="panduan-prediksi" element={<PanduanPrediksi />} />
        <Route path="laporan" element={<Laporan />} />
      </Route>
    </Routes>
  )
}

export default App