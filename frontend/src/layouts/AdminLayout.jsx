import React, { useState } from 'react'
import Sidebar from '../components/admin/Sidebar'
import NavbarAdmin from '../components/admin/NavbarAdmin'
import './AdminLayout.css'

export default function AdminLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen)
    }

    const closeSidebar = () => {
        setSidebarOpen(false)
    }

    return (
        <div className="admin-layout">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={closeSidebar}
            />

            <div
                className={`admin-overlay ${sidebarOpen ? 'show' : ''}`}
                onClick={closeSidebar}
            ></div>

            <div className="admin-main">
                <NavbarAdmin onToggleSidebar={toggleSidebar} />

                <main className="admin-content">
                    {children}
                </main>
            </div>
        </div>
    )
}   