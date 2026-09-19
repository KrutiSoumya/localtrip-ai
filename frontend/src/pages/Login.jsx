import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }
    const result = await login({ email, password })
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.message)
    }
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

      {/* Full page background image */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
      backgroundImage: 'url("https://raw.githubusercontent.com/krithi575/pp_images/main/loginbg.png")',     
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 0,
      }} />

      {/* Dark overlay */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.35)',
        zIndex: 1,
      }} />

      {/* Login Card — centered */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(14px)',
        borderRadius: '20px',
        padding: '44px 40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
      }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
            Welcome!
          </h1>
          <p style={{ color: '#6b7280', marginTop: '6px', fontSize: '14px', margin: '6px 0 0 0' }}>
            Login to access your LocalTrip AI account
          </p>
        </div>

        {error && (
          <div style={{
            marginBottom: '16px',
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: '14px',
            borderRadius: '10px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              placeholder="mail@abc.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '999px',
                border: '1px solid #d1d5db',
                backgroundColor: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Password
              </label>
              <span style={{ fontSize: '12px', color: '#0d9488', cursor: 'pointer' }}>
                Forgot Password?
              </span>
            </div>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '999px',
                border: '1px solid #d1d5db',
                backgroundColor: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '999px',
              backgroundColor: '#115e59',
              color: '#fff',
              fontWeight: '600',
              fontSize: '15px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>

        </form>

        <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', marginTop: '24px', marginBottom: 0 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#0f766e', fontWeight: '600', textDecoration: 'none' }}>
            Register here
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Login