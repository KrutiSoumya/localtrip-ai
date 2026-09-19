import { createContext, useContext, useState, useEffect } from 'react'
import { loginUser, registerUser } from '../services/api'

// ─── Create Context ────────────────────────────────────────────────────────────

const AuthContext = createContext(null)

// ─── Auth Provider ─────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {

  const [token, setToken]   = useState(localStorage.getItem('token'))
  const [user, setUser]     = useState(JSON.parse(localStorage.getItem('user')))
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  // ── Keep localStorage in sync whenever token or user changes ──────────────
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }, [token])

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
  }, [user])

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (credentials) => {
    try {
      setLoading(true)
      setError(null)

      const response = await loginUser(credentials)

      const { token: newToken, user: newUser } = response.data

      setToken(newToken)
      setUser(newUser)

      return { success: true }

    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.'
      setError(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  // ── Register ───────────────────────────────────────────────────────────────
  const register = async (userData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await registerUser(userData)

      const { token: newToken, user: newUser } = response.data

      setToken(newToken)
      setUser(newUser)

      return { success: true }

    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.'
      setError(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = () => {
    setToken(null)
    setUser(null)
    setError(null)
  }

  // ── Clear any auth errors (useful when switching between login/register) ───
  const clearError = () => setError(null)

  // ── Value exposed to the whole app ─────────────────────────────────────────
  const value = {
    user,           // full user object { id, name, email, role... }
    token,          // raw JWT string
    loading,        // true while API call is in progress
    error,          // error message string or null
    login,          // login(credentials) → { success, message }
    register,       // register(userData) → { success, message }
    logout,         // logout() → clears everything
    clearError,     // clearError() → resets error state
    isLoggedIn: !!token   // handy boolean for quick checks
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Custom Hook ───────────────────────────────────────────────────────────────
// Usage in any component: const { user, login, logout } = useAuth()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>')
  }
  return context
}

export default AuthContext