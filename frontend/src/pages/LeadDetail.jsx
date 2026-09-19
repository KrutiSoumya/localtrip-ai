import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, User, Phone, Mail, MapPin, DollarSign,
  Calendar, Users, CheckCircle, Clock, FileText,
  Map, Bell, ThumbsUp, Sparkles, ChevronRight, X
} from 'lucide-react'
import { getLeadById } from '../services/api'
import api from '../services/api'

// ── Mock fallback ─────────────────────────────────────────────────────────────

const mockLead = {
  id: 1,
  name: 'Priya Sharma',
  phone: '+91 98765 43210',
  email: 'priya.sharma@email.com',
  destination: 'Bali, Indonesia',
  budget: '₹85,000',
  travelDate: '2024-12-20',
  groupSize: 2,
  score: 'Hot',
  status: 'Quoted',
  lastContact: '2 hours ago',
  inquiryMessage: 'Looking for a romantic honeymoon package in Bali. Prefer beachside resort, candlelight dinner, and spa. Flexible on dates but prefer late December.',
  scoreExplanation: 'High budget, quick responses, and clear intent make this a high-priority lead. Customer has been actively engaging and is ready to book.',
  statusHistory: [
    { status: 'New',       date: 'Dec 1, 2024',  note: 'Lead created via WhatsApp inquiry'         },
    { status: 'Contacted', date: 'Dec 2, 2024',  note: 'Initial call made, discussed requirements' },
    { status: 'Quoted',    date: 'Dec 4, 2024',  note: 'Sent Bali honeymoon package quotation'     },
  ],
  itinerary: {
    id: 'ITN-001',
    title: 'Bali Honeymoon — 6 Nights 7 Days',
    status: 'Pending Approval',
    days: 7,
    createdAt: 'Dec 4, 2024',
  },
  quotation: {
    id: 'QT-2024-001',
    amount: '₹82,500',
    status: 'Sent',
    validUntil: 'Dec 15, 2024',
    items: ['6N Beachside Resort', 'Airport Transfers', 'Candlelight Dinner', 'Spa Session', 'Sightseeing Tours'],
  },
  followUps: [
    { date: 'Dec 6, 2024',  type: 'Call',  status: 'Done',    note: 'Confirmed interest, asked for minor changes' },
    { date: 'Dec 8, 2024',  type: 'Email', status: 'Done',    note: 'Sent revised itinerary with spa upgrade'     },
    { date: 'Dec 10, 2024', type: 'Call',  status: 'Pending', note: 'Final confirmation call'                     },
    { date: 'Dec 12, 2024', type: 'Email', status: 'Pending', note: 'Send booking confirmation'                   },
  ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const scoreMeta = {
  Hot:  { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
  Warm: { bg: '#fffbeb', color: '#d97706', dot: '#f59e0b' },
  Cold: { bg: '#eff6ff', color: '#2563eb', dot: '#60a5fa' },
}

const statusColors = {
  New:         { bg: '#f3f4f6', color: '#6b7280' },
  Contacted:   { bg: '#eff6ff', color: '#2563eb' },
  Quoted:      { bg: '#fffbeb', color: '#d97706' },
  Negotiating: { bg: '#f5f3ff', color: '#7c3aed' },
  Confirmed:   { bg: '#f0fdfa', color: '#0f766e' },
  Closed:      { bg: '#fef2f2', color: '#dc2626' },
}

const Card = ({ children, style = {} }) => (
  <div style={{
    backgroundColor: '#fff', border: '1px solid #f3f4f6',
    borderRadius: '14px', padding: '20px', ...style,
  }}>
    {children}
  </div>
)

const SectionTitle = ({ icon: Icon, title, color = '#0f766e' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
    <Icon size={16} color={color} />
    <h2 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>{title}</h2>
  </div>
)

// ── Quotation Generator ───────────────────────────────────────────────────────

const mockQuotation = {
  itineraryId: 'ITN-001',
  destination: 'Bali, Indonesia',
  duration: 7,
  groupSize: 2,
  currency: '₹',
  items: [
    { category: 'Accommodation', description: '6N Beachside Resort (Seminyak)',    unitCost: 12000, units: 6, total: 72000 },
    { category: 'Transport',     description: 'Airport transfers + private car',    unitCost: 8000,  units: 1, total: 8000  },
    { category: 'Activities',    description: 'Spa, Nusa Penida tour, Kecak show', unitCost: 6500,  units: 1, total: 6500  },
    { category: 'Meals',         description: 'Daily breakfast + 3 special dinners',unitCost: 2200, units: 7, total: 15400 },
    { category: 'Visa & Misc',   description: 'Travel insurance + misc expenses',  unitCost: 3500,  units: 1, total: 3500  },
  ],
  subtotal:     105400,
  marginPct:    15,
  marginAmount: 15810,
  finalPrice:   121210,
  anomalies: [
    { type: 'warning', field: 'Transport',     message: 'Transport cost (₹8,000) is 2× higher than average for this destination. Please review before sending.' },
    { type: 'info',    field: 'Accommodation', message: 'Accommodation rate is within the expected range for Seminyak in December.' },
  ],
}

const categoryMeta = {
  'Accommodation': { color: '#0f766e', bg: '#f0fdfa' },
  'Transport':     { color: '#2563eb', bg: '#eff6ff' },
  'Activities':    { color: '#7c3aed', bg: '#f5f3ff' },
  'Meals':         { color: '#d97706', bg: '#fffbeb' },
  'Visa & Misc':   { color: '#6b7280', bg: '#f9fafb' },
}

function QuotationGenerator({ leadId, itineraryId }) {
  const [quote, setQuote]         = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [margin, setMargin]       = useState(15)
  const [dismissed, setDismissed] = useState([])
  const [sent, setSent]           = useState(false)
  const [sending, setSending]     = useState(false)

  const recalc = (items, pct) => {
    const sub  = items.reduce((sum, i) => sum + i.total, 0)
    const mAmt = Math.round(sub * pct / 100)
    return { subtotal: sub, marginAmount: mAmt, finalPrice: sub + mAmt }
  }

  const handleGenerate = async () => {
    try {
      setLoading(true); setError(null); setQuote(null); setSent(false)
      const res = await api.post('/quotation/generate', { leadId, itineraryId })
      setQuote(res.data)
      setMargin(res.data.marginPct || 15)
    } catch {
      setQuote(mockQuotation)
      setMargin(mockQuotation.marginPct)
    } finally { setLoading(false) }
  }

  const handleMarginChange = (val) => {
    const pct = Math.max(0, Math.min(50, Number(val)))
    setMargin(pct)
    if (!quote) return
    const updated = recalc(quote.items, pct)
    setQuote(prev => ({ ...prev, marginPct: pct, ...updated }))
  }

  const handleItemChange = (idx, field, val) => {
    const items = [...quote.items]
    items[idx] = { ...items[idx], [field]: Number(val) }
    items[idx].total = items[idx].unitCost * items[idx].units
    const updated = recalc(items, margin)
    setQuote(prev => ({ ...prev, items, ...updated }))
  }

  const handleSend = async () => {
    try {
      setSending(true)
      await api.post('/quotation/send', { leadId, quote })
      setSent(true)
    } catch { setSent(true) }
    finally { setSending(false) }
  }

  const warnings = (quote?.anomalies || []).filter(a => !dismissed.includes(a.field) && a.type === 'warning')
  const infos    = (quote?.anomalies || []).filter(a => !dismissed.includes(a.field) && a.type === 'info')
  const fmt      = (n) => `₹${Number(n).toLocaleString('en-IN')}`

  return (
    <div style={{
      backgroundColor: '#fff', border: '1px solid #f3f4f6',
      borderRadius: '14px', overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        padding: '18px 24px', borderBottom: '1px solid #f3f4f6',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={17} color="#2563eb" />
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>
            Quotation Generator
          </h2>
          {quote && (
            <span style={{
              fontSize: '11px', padding: '2px 10px', borderRadius: '999px',
              backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: '500',
            }}>
              {quote.destination}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {quote && !sent && (
            <button
              onClick={handleSend} disabled={sending}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '10px', border: 'none',
                backgroundColor: sending ? '#9ca3af' : '#2563eb',
                color: '#fff', fontSize: '13px', fontWeight: '600',
                cursor: sending ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!sending) e.currentTarget.style.backgroundColor = '#1d4ed8' }}
              onMouseLeave={e => { if (!sending) e.currentTarget.style.backgroundColor = '#2563eb' }}
            >
              {sending
                ? <><div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.6s linear infinite' }} /> Sending...</>
                : <>📤 Send to Customer</>
              }
            </button>
          )}

          {sent && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '10px',
              backgroundColor: '#f0fdfa', border: '1px solid #99f6e4',
            }}>
              <CheckCircle size={14} color="#0f766e" />
              <span style={{ fontSize: '13px', color: '#0f766e', fontWeight: '500' }}>Quote sent!</span>
            </div>
          )}

          <button
            onClick={handleGenerate} disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 18px', borderRadius: '10px', border: 'none',
              backgroundColor: loading ? '#9ca3af' : '#115e59',
              color: '#fff', fontSize: '13px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#0f766e' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#115e59' }}
          >
            {loading
              ? <><div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.6s linear infinite' }} /> Generating...</>
              : <>{quote ? '🔄 Regenerate' : '✨ Generate Quotation'}</>
            }
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ margin: '16px 24px 0', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#dc2626' }}>{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            border: '3px solid #e5e7eb', borderTopColor: '#2563eb',
            animation: 'spin 0.7s linear infinite', margin: '0 auto 12px',
          }} />
          <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>Generating itemised quotation...</p>
        </div>
      )}

      {/* Empty state */}
      {!quote && !loading && (
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 14px',
          }}>
            <FileText size={24} color="#2563eb" />
          </div>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: '500', color: '#374151' }}>
            No quotation generated yet
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#9ca3af' }}>
            Click "Generate Quotation" to create an itemised quote from the approved itinerary.
          </p>
        </div>
      )}

      {/* Quote content */}
      {quote && !loading && (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Warning anomalies */}
          {warnings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {warnings.map(a => (
                <div key={a.field} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '12px 14px', borderRadius: '10px',
                  backgroundColor: '#fffbeb', border: '1px solid #fde68a',
                }}>
                  <span style={{ fontSize: '16px', flexShrink: 0, lineHeight: 1.4 }}>⚠️</span>
                  <p style={{ margin: 0, fontSize: '13px', color: '#92400e', lineHeight: '1.5', flex: 1 }}>
                    <strong>{a.field}:</strong> {a.message}
                  </p>
                  <button onClick={() => setDismissed(p => [...p, a.field])} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', flexShrink: 0,
                  }}>
                    <X size={14} color="#9ca3af" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Info anomalies */}
          {infos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {infos.map(a => (
                <div key={a.field} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '10px 14px', borderRadius: '10px',
                  backgroundColor: '#f0fdfa', border: '1px solid #99f6e4',
                }}>
                  <span style={{ fontSize: '14px', flexShrink: 0, lineHeight: 1.5 }}>✅</span>
                  <p style={{ margin: 0, fontSize: '13px', color: '#0f766e', lineHeight: '1.5', flex: 1 }}>
                    <strong>{a.field}:</strong> {a.message}
                  </p>
                  <button onClick={() => setDismissed(p => [...p, a.field])} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', marginLeft: 'auto', flexShrink: 0,
                  }}>
                    <X size={13} color="#9ca3af" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Trip meta */}
          <div style={{
            display: 'flex', gap: '24px', padding: '14px 16px',
            backgroundColor: '#f9fafb', borderRadius: '10px',
            border: '1px solid #f3f4f6', flexWrap: 'wrap',
          }}>
            {[
              { label: 'Destination', value: quote.destination        },
              { label: 'Duration',    value: `${quote.duration} days`  },
              { label: 'Group Size',  value: `${quote.groupSize} pax`  },
              { label: 'Itinerary',   value: quote.itineraryId         },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>{label}</p>
                <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: '600', color: '#111827' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Itemised table */}
          <div>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
              Itemised Breakdown
            </p>
            <div style={{ border: '1px solid #f3f4f6', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
                    {['Category', 'Description', 'Unit Cost', 'Units', 'Total'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px',
                        textAlign: h === 'Category' || h === 'Description' ? 'left' : 'right',
                        fontSize: '11px', fontWeight: '600', color: '#6b7280',
                        textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item, idx) => {
                    const meta = categoryMeta[item.category] || categoryMeta['Visa & Misc']
                    return (
                      <tr key={idx}
                        style={{ borderBottom: idx < quote.items.length - 1 ? '1px solid #f9fafb' : 'none' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: '600', padding: '3px 10px',
                            borderRadius: '999px', backgroundColor: meta.bg, color: meta.color,
                          }}>
                            {item.category}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151' }}>
                          {item.description}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>₹</span>
                            <input
                              type="number" value={item.unitCost}
                              onChange={e => handleItemChange(idx, 'unitCost', e.target.value)}
                              style={{
                                width: '80px', padding: '4px 8px', borderRadius: '6px',
                                border: '1px solid #e5e7eb', fontSize: '13px',
                                color: '#111827', textAlign: 'right', outline: 'none',
                              }}
                              onFocus={e => e.target.style.borderColor = '#2563eb'}
                              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            />
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <input
                            type="number" value={item.units}
                            onChange={e => handleItemChange(idx, 'units', e.target.value)}
                            style={{
                              width: '50px', padding: '4px 8px', borderRadius: '6px',
                              border: '1px solid #e5e7eb', fontSize: '13px',
                              color: '#111827', textAlign: 'right', outline: 'none',
                            }}
                            onFocus={e => e.target.style.borderColor = '#2563eb'}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                          />
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap' }}>
                          {fmt(item.total)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Margin + Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* Margin slider */}
            <div style={{ padding: '18px', borderRadius: '12px', border: '1px solid #f3f4f6', backgroundColor: '#fafafa' }}>
              <p style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Margin Adjustment</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <input
                  type="range" min="0" max="50" step="1" value={margin}
                  onChange={e => handleMarginChange(e.target.value)}
                  style={{ flex: 1, accentColor: '#2563eb' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number" min="0" max="50" value={margin}
                    onChange={e => handleMarginChange(e.target.value)}
                    style={{
                      width: '52px', padding: '5px 8px', borderRadius: '8px',
                      border: '1px solid #e5e7eb', fontSize: '14px',
                      fontWeight: '600', color: '#111827', textAlign: 'center', outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = '#2563eb'}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>%</span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>Drag or type to adjust your agency margin (0–50%)</p>
            </div>

            {/* Price summary */}
            <div style={{ padding: '18px', borderRadius: '12px', border: '1px solid #f3f4f6', backgroundColor: '#fff' }}>
              <p style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Price Summary</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Subtotal</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>{fmt(quote.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Margin ({margin}%)</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#d97706' }}>+ {fmt(quote.marginAmount)}</span>
                </div>
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '10px', marginTop: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>Final Price</span>
                    <span style={{ fontSize: '22px', fontWeight: '700', color: '#0f766e' }}>{fmt(quote.finalPrice)}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af', textAlign: 'right' }}>
                    Per group · {quote.groupSize} pax · {quote.duration} days
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main LeadDetail Page ──────────────────────────────────────────────────────

function LeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [approved, setApproved] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getLeadById(id)
        setLead(res.data)
      } catch {
        setLead(mockLead)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        border: '3px solid #e5e7eb', borderTopColor: '#0f766e',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!lead) return (
    <div style={{ textAlign: 'center', padding: '60px' }}>
      <p style={{ color: '#6b7280' }}>Lead not found.</p>
    </div>
  )

  const score       = scoreMeta[lead.score]       || scoreMeta.Cold
  const statusColor = statusColors[lead.status]   || statusColors.New

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/leads')} style={{
            width: '34px', height: '34px', borderRadius: '10px',
            border: '1px solid #e5e7eb', backgroundColor: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <ArrowLeft size={16} color="#6b7280" />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#111827' }}>
              {lead.name}
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#9ca3af' }}>
              Lead #{lead.id} · Last contact {lead.lastContact}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '5px 12px', borderRadius: '999px',
            backgroundColor: score.bg, color: score.color, fontSize: '13px', fontWeight: '600',
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: score.dot }} />
            {lead.score} Lead
          </span>
          <span style={{
            padding: '5px 12px', borderRadius: '999px',
            backgroundColor: statusColor.bg, color: statusColor.color,
            fontSize: '13px', fontWeight: '500',
          }}>
            {lead.status}
          </span>
        </div>
      </div>

      {/* ── Row 1: Customer Info + Score Explanation ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Customer Info */}
        <Card>
          <SectionTitle icon={User} title="Customer Information" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: Phone,      label: 'Phone',       value: lead.phone                                                        },
              { icon: Mail,       label: 'Email',       value: lead.email                                                        },
              { icon: MapPin,     label: 'Destination', value: lead.destination                                                  },
              { icon: DollarSign, label: 'Budget',      value: lead.budget                                                       },
              { icon: Calendar,   label: 'Travel Date', value: lead.travelDate                                                   },
              { icon: Users,      label: 'Group Size',  value: `${lead.groupSize} ${lead.groupSize === 1 ? 'person' : 'people'}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  backgroundColor: '#f0fdfa', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={13} color="#0f766e" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>{label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#111827', fontWeight: '500' }}>{value}</p>
                </div>
              </div>
            ))}
            {lead.inquiryMessage && (
              <div style={{ marginTop: '4px', padding: '12px', borderRadius: '10px', backgroundColor: '#f9fafb', border: '1px solid #f3f4f6' }}>
                <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>Inquiry Message</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>{lead.inquiryMessage}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Score + Approval */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card>
            <SectionTitle icon={Sparkles} title="AI Score Explanation" color="#7c3aed" />
            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: score.bg, marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '22px', fontWeight: '700', color: score.color }}>{lead.score}</span>
                <span style={{ fontSize: '13px', color: score.color, fontWeight: '500' }}>Priority</span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>{lead.scoreExplanation}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Response Speed', value: 85 },
                { label: 'Budget Match',   value: 92 },
                { label: 'Intent Clarity', value: 78 },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{label}</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>{value}%</span>
                  </div>
                  <div style={{ height: '5px', backgroundColor: '#f3f4f6', borderRadius: '999px' }}>
                    <div style={{ height: '100%', borderRadius: '999px', backgroundColor: score.dot, width: `${value}%`, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ backgroundColor: approved ? '#f0fdfa' : '#fff' }}>
            <SectionTitle icon={ThumbsUp} title="Itinerary Approval" color="#0f766e" />
            {approved ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} color="#0f766e" />
                <p style={{ margin: 0, fontSize: '14px', color: '#0f766e', fontWeight: '500' }}>
                  Itinerary approved successfully!
                </p>
              </div>
            ) : (
              <>
                <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#6b7280' }}>
                  Review and approve the linked itinerary to move this lead to Confirmed.
                </p>
                <button
                  onClick={() => setApproved(true)}
                  style={{
                    width: '100%', padding: '11px', borderRadius: '10px', border: 'none',
                    backgroundColor: '#115e59', color: '#fff',
                    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0f766e'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#115e59'}
                >
                  <ThumbsUp size={15} /> Approve Itinerary
                </button>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* ── Row 2: Status History + Follow-up Schedule ───────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Card>
          <SectionTitle icon={Clock} title="Status History" />
          <div style={{ position: 'relative', paddingLeft: '16px' }}>
            <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', backgroundColor: '#f3f4f6' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(lead.statusHistory || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                  <div style={{
                    width: '12px', height: '12px', borderRadius: '50%',
                    backgroundColor: i === lead.statusHistory.length - 1 ? '#0f766e' : '#d1d5db',
                    border: '2px solid #fff',
                    outline: `2px solid ${i === lead.statusHistory.length - 1 ? '#0f766e' : '#e5e7eb'}`,
                    flexShrink: 0, marginTop: '3px', position: 'absolute', left: '-20px',
                  }} />
                  <div style={{ paddingLeft: '4px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '12px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px',
                        backgroundColor: statusColors[item.status]?.bg || '#f3f4f6',
                        color: statusColors[item.status]?.color || '#6b7280',
                      }}>{item.status}</span>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>{item.date}</span>
                    </div>
                    <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#374151' }}>{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Bell} title="Follow-up Schedule" color="#d97706" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(lead.followUps || []).map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '10px 12px', borderRadius: '10px',
                backgroundColor: f.status === 'Done' ? '#f9fafb' : '#fffbeb',
                border: `1px solid ${f.status === 'Done' ? '#f3f4f6' : '#fde68a'}`,
              }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0,
                  backgroundColor: f.status === 'Done' ? '#f3f4f6' : '#fef3c7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {f.status === 'Done'
                    ? <CheckCircle size={13} color="#9ca3af" />
                    : <Clock size={13} color="#d97706" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>{f.type}</span>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>{f.date}</span>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#6b7280' }}>{f.note}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Row 3: Linked Itinerary + Linked Quotation ───────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Card>
          <SectionTitle icon={Map} title="Linked Itinerary" />
          {lead.itinerary ? (
            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#f9fafb', border: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>{lead.itinerary.title}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                    {lead.itinerary.days} days · Created {lead.itinerary.createdAt}
                  </p>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', backgroundColor: '#fffbeb', color: '#d97706', fontWeight: '500' }}>
                  {lead.itinerary.status}
                </span>
              </div>
              <button
                onClick={() => navigate('/itinerary')}
                style={{
                  marginTop: '12px', width: '100%', padding: '8px', borderRadius: '8px',
                  border: '1px solid #e5e7eb', backgroundColor: '#fff', fontSize: '13px',
                  color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                View Itinerary <ChevronRight size={13} />
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
              <Map size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '13px' }}>No itinerary linked yet</p>
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle icon={FileText} title="Linked Quotation" color="#2563eb" />
          {lead.quotation ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#111827' }}>{lead.quotation.amount}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>Valid until {lead.quotation.validUntil}</p>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: '500' }}>
                  {lead.quotation.status}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {lead.quotation.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151' }}>
                    <CheckCircle size={13} color="#0f766e" /> {item}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
              <FileText size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '13px' }}>No quotation generated yet</p>
            </div>
          )}
        </Card>
      </div>

      {/* ── Row 4: Quotation Generator ────────────────────────────────────── */}
      <QuotationGenerator leadId={lead.id} itineraryId={lead.itinerary?.id} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default LeadDetail