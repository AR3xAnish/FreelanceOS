import { createContext, useState, useEffect, useContext } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const API_URL = 'http://localhost:5000/api/auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Configure axios authorization header on authentication state change
  const setAuthHeader = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }

  // Restore user session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        setAuthHeader(token)
        try {
          const res = await axios.get(`${API_URL}/me`)
          setUser(res.data.user)
        } catch (err) {
          console.error('Session restoration failed:', err.message)
          localStorage.removeItem('token')
          setAuthHeader(null)
          setUser(null)
        }
      }
      setLoading(false)
    }

    initializeAuth()
  }, [])

  // Login handler
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password })
      const { user, token } = res.data
      localStorage.setItem('token', token)
      setAuthHeader(token)
      setUser(user)
      return { success: true }
    } catch (err) {
      console.error('Login error:', err)
      const errorMsg = err.response?.data?.error || 'Failed to login. Please try again.'
      return { success: false, error: errorMsg }
    }
  }

  // Registration handler
  const register = async (name, email, password) => {
    try {
      const res = await axios.post(`${API_URL}/register`, { name, email, password })
      const { user, token } = res.data
      localStorage.setItem('token', token)
      setAuthHeader(token)
      setUser(user)
      return { success: true }
    } catch (err) {
      console.error('Registration error:', err)
      const errorMsg = err.response?.data?.error || 'Failed to register. Please try again.'
      return { success: false, error: errorMsg }
    }
  }

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token')
    setAuthHeader(null)
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
