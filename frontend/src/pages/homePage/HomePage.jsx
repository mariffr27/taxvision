import React from 'react'
import Navbar from '../../components/navbar/Navbar'
import Footer from '../../components/footer/Footer'
import Hero from '../../components/hero/Hero'
import Features from '../../components/features/Features'
import About from '../../components/about/About'
import DataSection from '../../components/dataSection/DataSection'

export default function HomePage() {
    return (
        <>
            <Navbar />
            <Hero />
            <About />
            <Features />
            <DataSection/>
            <Footer />
        </>
    )
}
