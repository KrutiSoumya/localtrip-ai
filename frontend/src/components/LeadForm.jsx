import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Phone, Mail, MessageSquare,
  MapPin, DollarSign, Calendar, Users,
  Send, ArrowLeft, CheckCircle
} from 'lucide-react'
import { createLead } from '../services/api'

// ── Reusable field wrapper ────────────────────────────────────────────────────

function Field({ label, icon: Icon, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{
        fontSize: '13px', fontWeight: '500', color: '#374151',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <Icon size={13} color="#9ca3af" />
        {label}
      </label>
      {children}
      {error && (
        <p style={{ margin: 0, fontSize: '12px', color: '#dc2626', marginLeft: '2px' }}>
          {error}
        </p>
      )}
    </div>
  )
}

const inputStyle = (hasError) => ({
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: `1px solid ${hasError ? '#fca5a5' : '#e5e7eb'}`,
  backgroundColor: hasError ? '#fff5f5' : '#fff',
  fontSize: '14px',
  color: '#111827',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
})

// ─────────────────────────────────────────────────────────────────────────────

function LeadForm({ onSuccess }) {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    customerName:    '',
    phone:           '',
    email:           '',
    inquiryMessage:  '',
    destination:     '',
    budget:          '',
    travelDate:      '',
    groupSize:       '',
  })

  const [errors, setErrors]     = useState({})
  const [loading, setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState(null)

  // ── Change handler ───────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: null }))
    setServerError(null)
  }

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.customerName.trim())   e.customerName   = 'Customer name is required.'
    if (!form.phone.trim())          e.phone          = 'Phone number is required.'
    if (!form.email.trim())          e.email          = 'Email is required.'
    else if (!/\S+@\S+\.\S+/.test(form.email))
                                     e.email          = 'Please enter a valid email.'
    if (!form.destination.trim())    e.destination    = 'Destination is required.'
    if (!form.budget)                e.budget         = 'Budget is required.'
    else if (Number(form.budget) <= 0)
                                     e.budget         = 'Budget must be greater than 0.'
    if (!form.travelDate)            e.travelDate     = 'Travel date is required.'
    if (!form.groupSize)             e.groupSize      = 'Group size is required.'
    else if (Number(form.groupSize) < 1)
                                     e.groupSize      = 'Group size must be at least 1.'
    return e
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError(null)

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      // Scroll to top of form to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    try {
      setLoading(true)
      await createLead({
        name:           form.customerName,
        phone:          form.phone,
        email:          form.email,
        message:        form.inquiryMessage,
        destination:    form.destination,
        budget:         Number(form.budget),
        travelDate:     form.travelDate,
        groupSize:      Number(form.groupSize),
      })
      setSubmitted(true)
      if (onSuccess) onSuccess()
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Failed to create lead. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ───────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '60px 24px', textAlign: 'center',
        backgroundColor: '#fff', borderRadius: '14px',
        border: '1px solid #f3f4f6',
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          backgroundColor: '#f0fdfa',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '16px',
        }}>
          <CheckCircle size={28} color="#0f766e" />
        </div>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>
          Lead Created!
        </h2>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#6b7280', maxWidth: '320px' }}>
          {form.customerName}'s inquiry for {form.destination} has been added to your pipeline.
        </p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '28px' }}>
          <button
            onClick={() => {
              setSubmitted(false)
              setForm({
                customerName: '', phone: '', email: '',
                inquiryMessage: '', destination: '', budget: '',
                travelDate: '', groupSize: '',
              })
            }}
            style={{
              padding: '10px 20px', borderRadius: '10px',
              border: '1px solid #e5e7eb', backgroundColor: '#fff',
              fontSize: '14px', fontWeight: '500', color: '#374151',
              cursor: 'pointer',
            }}
          >
            Add Another Lead
          </button>
          <button
            onClick={() => navigate('/leads')}
            style={{
              padding: '10px 20px', borderRadius: '10px',
              border: 'none', backgroundColor: '#115e59',
              fontSize: '14px', fontWeight: '600', color: '#fff',
              cursor: 'pointer',
            }}
          >
            View All Leads
          </button>
        </div>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => navigate('/leads')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '34px', height: '34px', borderRadius: '10px',
            border: '1px solid #e5e7eb', backgroundColor: '#fff',
            cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
        >
          <ArrowLeft size={16} color="#6b7280" />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#111827' }}>
            New Lead
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#9ca3af' }}>
            Fill in the customer's inquiry details below
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div style={{
          backgroundColor: '#fff', borderRadius: '14px',
          border: '1px solid #f3f4f6', overflow: 'hidden',
        }}>

          {/* ── Section: Customer Info ────────────────────────────────────── */}
          <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6' }}>
            <p style={{
              margin: '0 0 18px', fontSize: '13px', fontWeight: '600',
              color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Customer Information
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              <Field label="Customer Name" icon={User} error={errors.customerName}>
                <input
                  type="text"
                  name="customerName"
                  placeholder="e.g. Priya Sharma"
                  value={form.customerName}
                  onChange={handleChange}
                  style={inputStyle(errors.customerName)}
                  onFocus={e => { if (!errors.customerName) e.target.style.borderColor = '#0f766e' }}
                  onBlur={e  => { if (!errors.customerName) e.target.style.borderColor = '#e5e7eb' }}
                />
              </Field>

              <Field label="Phone" icon={Phone} error={errors.phone}>
                <input
                  type="text"
                  name="phone"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={handleChange}
                  style={inputStyle(errors.phone)}
                  onFocus={e => { if (!errors.phone) e.target.style.borderColor = '#0f766e' }}
                  onBlur={e  => { if (!errors.phone) e.target.style.borderColor = '#e5e7eb' }}
                />
              </Field>

              <Field label="Email" icon={Mail} error={errors.email}>
                <input
                  type="email"
                  name="email"
                  placeholder="customer@email.com"
                  value={form.email}
                  onChange={handleChange}
                  style={inputStyle(errors.email)}
                  onFocus={e => { if (!errors.email) e.target.style.borderColor = '#0f766e' }}
                  onBlur={e  => { if (!errors.email) e.target.style.borderColor = '#e5e7eb' }}
                />
              </Field>

            </div>
          </div>

          {/* ── Section: Inquiry Message ──────────────────────────────────── */}
          <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6' }}>
            <p style={{
              margin: '0 0 18px', fontSize: '13px', fontWeight: '600',
              color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Inquiry Details
            </p>

            <Field label="Inquiry Message" icon={MessageSquare} error={errors.inquiryMessage}>
              <textarea
                name="inquiryMessage"
                placeholder="Describe the customer's travel requirements, preferences, special requests..."
                value={form.inquiryMessage}
                onChange={handleChange}
                rows={4}
                style={{
                  ...inputStyle(errors.inquiryMessage),
                  resize: 'vertical',
                  lineHeight: '1.5',
                  fontFamily: 'inherit',
                  minHeight: '100px',
                }}
                onFocus={e => { e.target.style.borderColor = '#0f766e' }}
                onBlur={e  => { e.target.style.borderColor = errors.inquiryMessage ? '#fca5a5' : '#e5e7eb' }}
              />
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                {form.inquiryMessage.length} characters
              </p>
            </Field>
          </div>

          {/* ── Section: Trip Details ─────────────────────────────────────── */}
          <div style={{ padding: '24px' }}>
            <p style={{
              margin: '0 0 18px', fontSize: '13px', fontWeight: '600',
              color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Trip Details
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              <Field label="Destination" icon={MapPin} error={errors.destination}>
                <input
                  type="text"
                  name="destination"
                  placeholder="e.g. Bali, Indonesia"
                  value={form.destination}
                  onChange={handleChange}
                  style={inputStyle(errors.destination)}
                  onFocus={e => { if (!errors.destination) e.target.style.borderColor = '#0f766e' }}
                  onBlur={e  => { if (!errors.destination) e.target.style.borderColor = '#e5e7eb' }}
                />
              </Field>

              <Field label="Budget (₹)" icon={DollarSign} error={errors.budget}>
                <input
                  type="number"
                  name="budget"
                  placeholder="e.g. 85000"
                  value={form.budget}
                  onChange={handleChange}
                  min="0"
                  style={inputStyle(errors.budget)}
                  onFocus={e => { if (!errors.budget) e.target.style.borderColor = '#0f766e' }}
                  onBlur={e  => { if (!errors.budget) e.target.style.borderColor = '#e5e7eb' }}
                />
              </Field>

              <Field label="Travel Date" icon={Calendar} error={errors.travelDate}>
                <input
                  type="date"
                  name="travelDate"
                  value={form.travelDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  style={inputStyle(errors.travelDate)}
                  onFocus={e => { if (!errors.travelDate) e.target.style.borderColor = '#0f766e' }}
                  onBlur={e  => { if (!errors.travelDate) e.target.style.borderColor = '#e5e7eb' }}
                />
              </Field>

              <Field label="Group Size" icon={Users} error={errors.groupSize}>
                <input
                  type="number"
                  name="groupSize"
                  placeholder="e.g. 4"
                  value={form.groupSize}
                  onChange={handleChange}
                  min="1"
                  style={inputStyle(errors.groupSize)}
                  onFocus={e => { if (!errors.groupSize) e.target.style.borderColor = '#0f766e' }}
                  onBlur={e  => { if (!errors.groupSize) e.target.style.borderColor = '#e5e7eb' }}
                />
              </Field>

            </div>
          </div>

          {/* ── Server error ──────────────────────────────────────────────── */}
          {serverError && (
            <div style={{
              margin: '0 24px 20px',
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              fontSize: '14px', color: '#dc2626',
            }}>
              {serverError}
            </div>
          )}

          {/* ── Footer: actions ───────────────────────────────────────────── */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #f3f4f6',
            backgroundColor: '#fafafa',
            display: 'flex', justifyContent: 'flex-end', gap: '10px',
          }}>
            <button
              type="button"
              onClick={() => navigate('/leads')}
              style={{
                padding: '10px 20px', borderRadius: '10px',
                border: '1px solid #e5e7eb', backgroundColor: '#fff',
                fontSize: '14px', fontWeight: '500', color: '#374151',
                cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 24px', borderRadius: '10px',
                border: 'none', backgroundColor: loading ? '#9ca3af' : '#115e59',
                fontSize: '14px', fontWeight: '600', color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#0f766e' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#115e59' }}
            >
              {loading
                ? <>
                    <div style={{
                      width: '14px', height: '14px', borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      animation: 'spin 0.6s linear infinite',
                    }} />
                    Saving...
                  </>
                : <>
                    <Send size={14} />
                    Create Lead
                  </>
              }
            </button>
          </div>

        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default LeadForm