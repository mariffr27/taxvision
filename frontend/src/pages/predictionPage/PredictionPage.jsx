import React from 'react'
import Navbar from '../../components/navbar/Navbar'
import Footer from '../../components/footer/Footer'
import PredictionHeader from '../../components/predictionHeader/PredictionHeader'
import DatasetSection from '../../components/DatasetSection/DatasetSection'
import PredictionSection from '../../components/prediction/PredictionSection'
import ResultPredictionSection from '../../components/resultPrediction/ResultPredictionSection'
import MetodeSection from '../../components/metode/MetodeSection'
import EpilogSection from '../../components/epilogSection/EpilogSection'

export default function PredictionPage() {
    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-green-100 selection:text-green-800">
            <Navbar />

            <PredictionHeader />


            <DatasetSection />


            <PredictionSection />

            <ResultPredictionSection />


            <MetodeSection />
            <EpilogSection />


            {/* 
                Nanti di sini akan ditambahkan:
                - Chapter 1: Mengenal Data Pajak (HistoricalDataSection)
                - Chapter 2: Saatnya Memprediksi (PredictionSection + ResultPredictionSection)
                - Chapter 3: Memahami Metode (MetodeSection)
                - Epilog: Kesimpulan
            */}

            {/* <Footer /> */}
        </div>
    )
}