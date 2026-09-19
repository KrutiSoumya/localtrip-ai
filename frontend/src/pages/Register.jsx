import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Register() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    fullName: '',
    agencyName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear inline error for this field as user types
    setErrors((prev) => ({ ...prev, [name]: null }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.fullName.trim())     newErrors.fullName     = 'Full name is required.'
    if (!formData.agencyName.trim())   newErrors.agencyName   = 'Agency name is required.'
    if (!formData.email.trim())        newErrors.email        = 'Email is required.'
    if (!formData.phone.trim())        newErrors.phone        = 'Phone number is required.'
    if (!formData.password)            newErrors.password     = 'Password is required.'
    if (formData.password.length < 6)  newErrors.password     = 'Password must be at least 6 characters.'
    if (!formData.confirmPassword)     newErrors.confirmPassword = 'Please confirm your password.'
    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword = 'Passwords do not match.'
    }
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError(null)

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const result = await register({
      name:       formData.fullName,
      agencyName: formData.agencyName,
      email:      formData.email,
      phone:      formData.phone,
      password:   formData.password,
    })

    if (result.success) {
      navigate('/dashboard')
    } else {
      if (result.message?.toLowerCase().includes('exist') ||
          result.message?.toLowerCase().includes('email')) {
        setServerError('An account with this email already exists.')
      } else {
        setServerError(result.message || 'Registration failed. Please try again.')
      }
    }
  }

  // ── Reusable field style ───────────────────────────────────────────────────
  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '12px 16px',
    borderRadius: '999px',
    border: `1px solid ${hasError ? '#fca5a5' : '#d1d5db'}`,
    backgroundColor: hasError ? '#fff5f5' : '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  })

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px',
  }

  const inlineError = (field) =>
    errors[field] ? (
      <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '5px', marginLeft: '14px' }}>
        {errors[field]}
      </p>
    ) : null

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px',
    }}>

      {/* ── Background Image ─────────────────────────────────────────── */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'url("https://raw.githubusercontent.com/krithi575/pp_images/main/login_bg.jpg")',     
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 0,
      }} />

      {/* ── Dark Overlay ─────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.40)',
        zIndex: 1,
      }} />

      {/* ── Register Card ────────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(14px)',
        borderRadius: '20px',
        padding: '44px 40px',
        width: '100%',
        maxWidth: '460px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
      }}>

        {/* Heading */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
            Create Account ✈️
          </h1>
          <p style={{ color: '#6b7280', marginTop: '6px', fontSize: '14px', margin: '6px 0 0 0' }}>
            Register your agency on LocalTrip AI
          </p>
        </div>

        {/* Server Error */}
        {serverError && (
          <div style={{
            marginBottom: '20px',
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: '14px',
            borderRadius: '10px',
          }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Row 1 — Full Name & Agency Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>

            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                name="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                style={inputStyle(errors.fullName)}
              />
              {inlineError('fullName')}
            </div>

            <div>
              <label style={labelStyle}>Agency Name</label>
              <input
                type="text"
                name="agencyName"
                placeholder="Horizon Travels"
                value={formData.agencyName}
                onChange={handleChange}
                style={inputStyle(errors.agencyName)}
              />
              {inlineError('agencyName')}
            </div>

          </div>

          {/* Email */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              name="email"
              placeholder="mail@abc.com"
              value={formData.email}
              onChange={handleChange}
              style={inputStyle(errors.email)}
            />
            {inlineError('email')}
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Phone</label>
            <input
              type="text"
              name="phone"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={handleChange}
              style={inputStyle(errors.phone)}
            />
            {inlineError('phone')}
          </div>

          {/* Row 2 — Password & Confirm Password */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '28px' }}>

            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                style={inputStyle(errors.password)}
              />
              {inlineError('password')}
            </div>

            <div>
              <label style={labelStyle}>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={inputStyle(errors.confirmPassword)}
              />
              {inlineError('confirmPassword')}
            </div>

          </div>

          {/* Submit Button */}
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

        </form>

        {/* Sign In Link */}
        <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', marginTop: '24px', marginBottom: 0 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#0f766e', fontWeight: '600', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Register