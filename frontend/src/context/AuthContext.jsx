import React, { createContext, useContext, useState } from 'react'
import { logout as logoutService } from '../services/authService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user')

        try {
            return savedUser ? JSON.parse(savedUser) : null
        } catch {
            localStorage.removeItem('user')
            return null
        }
    })

    const [token, setToken] = useState(() => localStorage.getItem('token'))

    const [loading, setLoading] = useState(false)

    const isAuthenticated = Boolean(token)

    const saveAuth = (authData) => {
        localStorage.setItem('token', authData.token)
        localStorage.setItem('user', JSON.stringify(authData.user))

        setToken(authData.token)
        setUser(authData.user)
    }

    const clearAuth = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')

        setToken(null)
        setUser(null)
    }

    const logout = async () => {
        try {
            if (token) {
                await logoutService()
            }
        } catch (err) {
            console.error(err)
        } finally {
            clearAuth()
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                isAuthenticated,
                saveAuth,
                clearAuth,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}