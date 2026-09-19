import { useState, useEffect } from 'react'
import {
  Calendar, MapPin, CreditCard, CheckCircle,
  Clock, Search, ChevronDown,
  Plane, RefreshCw
} from 'lucide-react'
import { getBookings, updateBooking } from '../services/api'

// ── Mock fallback data ────────────────────────────────────────────────────────

const mockBookings = [
  {
    id: 1, customer: 'Rohit Kumar', destination: 'Goa, India',
    travelDate: '2025-07-14', totalCost: 48500, paymentStatus: 'Paid',
    status: 'Confirmed', pax: 2, bookingRef: 'BK-20250601-001',
  },
  {
    id: 2, customer: 'Priya Sharma', destination: 'Manali, Himachal',
    travelDate: '2025-07-20', totalCost: 32000, paymentStatus: 'Pending',
    status: 'Confirmed', pax: 3, bookingRef: 'BK-20250602-002',
  },
  {
    id: 3, customer: 'Anil Mehta', destination: 'Kerala Backwaters',
    travelDate: '2025-06-30', totalCost: 61000, paymentStatus: 'Paid',
    status: 'Completed', pax: 4, bookingRef: 'BK-20250520-003',
  },
  {
    id: 4, customer: 'Sunita Rao', destination: 'Rajasthan Circuit',
    travelDate: '2025-08-05', totalCost: 75000, paymentStatus: 'Pending',
    status: 'Confirmed', pax: 5, bookingRef: 'BK-20250603-004',
  },
  {
    id: 5, customer: 'Deepak Nair', destination: 'Bali, Indonesia',
    travelDate: '2025-07-01', totalCost: 95000, paymentStatus: 'Paid',
    status: 'Completed', pax: 2, bookingRef: 'BK-20250515-005',
  },
  {
    id: 6, customer: 'Meena Iyer', destination: 'Dubai, UAE',
    travelDate: '2025-09-10', totalCost: 120000, paymentStatus: 'Pending',
    status: 'Confirmed', pax: 4, bookingRef: 'BK-20250604-006',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (amount) =>
  `₹${Number(amount).toLocaleString('en-IN')}`

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const daysUntil = (dateStr) => {
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      position: 'fixed', bottom: '28px', right: '28px', zIndex: 999,
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '13px 18px', borderRadius: '12px',
      backgroundColor: type === 'success' ? '#f0fdfa' : '#fef2f2',
      border: `1px solid ${type === 'success' ? '#99f6e4' : '#fecaca'}`,
      boxShadow: '0 8px 24px rgba(0,0,0,0.10)', minWidth: '260px',
    }}>
      {type === 'success'
        ? <CheckCircle size={16} color="#0f766e" />
        : <AlertCircle size={16} color="#dc2626" />
      }
      <p style={{
        margin: 0, fontSize: '13px', fontWeight: '500', flex: 1,
        color: type === 'success' ? '#0f766e' : '#dc2626',
      }}>
        {message}
      </p>
    </div>
  )
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    Confirmed: { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4', dot: '#0f766e' },
    Completed: { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd', dot: '#0369a1' },
  }
  const s = map[status] || { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb', dot: '#9ca3af' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontSize: '11px', padding: '3px 10px', borderRadius: '999px', fontWeight: '500',
      backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  )
}

// ── Payment Badge ─────────────────────────────────────────────────────────────

function PaymentBadge({ status }) {
  const paid = status === 'Paid'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontSize: '11px', padding: '3px 10px', borderRadius: '999px', fontWeight: '500',
      backgroundColor: paid ? '#fefce8' : '#fef2f2',
      color: paid ? '#a16207' : '#dc2626',
      border: `1px solid ${paid ? '#fde68a' : '#fecaca'}`,
    }}>
      <CreditCard size={10} />
      {status}
    </span>
  )
}

// ── Payment Dropdown ──────────────────────────────────────────────────────────

function PaymentDropdown({ bookingId, current, onUpdate }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSelect = async (value) => {
    if (value === current) { setOpen(false); return }
    setLoading(true)
    setOpen(false)
    await onUpdate(bookingId, value)
    setLoading(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(p => !p)}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '5px 10px', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer',
          border: '1px solid #e5e7eb', fontSize: '12px', fontWeight: '500',
          backgroundColor: '#fff', color: '#374151',
        }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#f9fafb' }}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
      >
        {loading
          ? <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #e5e7eb', borderTopColor: '#0f766e', animation: 'spin 0.6s linear infinite' }} />
          : <><ChevronDown size={11} /> Change</>
        }
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 20,
            backgroundColor: '#fff', border: '1px solid #e5e7eb',
            borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            overflow: 'hidden', minWidth: '110px',
          }}>
            {['Paid', 'Pending'].map(opt => (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '9px 14px', border: 'none',
                  backgroundColor: current === opt ? '#f0fdfa' : '#fff',
                  color: current === opt ? '#0f766e' : '#374151',
                  fontSize: '13px', fontWeight: current === opt ? '600' : '400',
                  cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => { if (current !== opt) e.currentTarget.style.backgroundColor = '#f9fafb' }}
                onMouseLeave={e => { if (current !== opt) e.currentTarget.style.backgroundColor = '#fff' }}
              >
                {current === opt && <CheckCircle size={12} color="#0f766e" />}
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Booking Row ───────────────────────────────────────────────────────────────

function BookingRow({ booking, onPaymentUpdate }) {
  const days = daysUntil(booking.travelDate)
  const isPast = days < 0
  const isSoon = days >= 0 && days <= 7

  return (
    <tr style={{ borderBottom: '1px solid #f3f4f6' }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      {/* Ref */}
      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', fontFamily: 'monospace' }}>
          {booking.bookingRef}
        </span>
      </td>

      {/* Customer */}
      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
            backgroundColor: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: '700', color: '#0f766e',
          }}>
            {booking.customer.charAt(0)}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#111827' }}>
              {booking.customer}
            </p>
            <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#9ca3af' }}>
              {booking.pax} {booking.pax === 1 ? 'person' : 'people'}
            </p>
          </div>
        </div>
      </td>

      {/* Destination */}
      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={13} color="#9ca3af" />
          <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
            {booking.destination}
          </span>
        </div>
      </td>

      {/* Travel Date */}
      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
        <div>
          <p style={{ margin: 0, fontSize: '13px', color: '#374151', fontWeight: '500' }}>
            {formatDate(booking.travelDate)}
          </p>
          <p style={{
            margin: '1px 0 0', fontSize: '11px', fontWeight: '500',
            color: isPast ? '#9ca3af' : isSoon ? '#dc2626' : '#9ca3af',
          }}>
            {isPast ? 'Completed' : isSoon ? `In ${days} day${days === 1 ? '' : 's'} ⚠️` : `In ${days} days`}
          </p>
        </div>
      </td>

      {/* Cost */}
      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
          {formatCurrency(booking.totalCost)}
        </span>
      </td>

      {/* Payment */}
      <td style={{ padding: '14px 16px' }}>
        <PaymentBadge status={booking.paymentStatus} />
      </td>

      {/* Status */}
      <td style={{ padding: '14px 16px' }}>
        <StatusBadge status={booking.status} />
      </td>

      {/* Actions */}
      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <PaymentDropdown
            bookingId={booking.id}
            current={booking.paymentStatus}
            onUpdate={onPaymentUpdate}
          />
        </div>
      </td>
    </tr>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

function Bookings() {
  const [bookings, setBookings]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [paymentFilter, setPaymentFilter] = useState('All')
  const [search, setSearch]         = useState('')
  const [toast, setToast]           = useState(null)

  const showToast = (message, type = 'success') => setToast({ message, type })

  // ── Fetch ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await getBookings()
        setBookings(res.data || mockBookings)
      } catch {
        setBookings(mockBookings)
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  // ── Payment update ──────────────────────────────────────────────────────────
  const handlePaymentUpdate = async (bookingId, newStatus) => {
    const prev = bookings
    // Optimistic update
    setBookings(bs => bs.map(b =>
      b.id === bookingId ? { ...b, paymentStatus: newStatus } : b
    ))
    try {
      await updateBooking(bookingId, { paymentStatus: newStatus })
      showToast(`Payment status updated to ${newStatus}`)
    } catch {
      setBookings(prev) // rollback
      showToast('Failed to update payment status', 'error')
    }
  }

  // ── Filter + Search ─────────────────────────────────────────────────────────
  const filtered = bookings.filter(b => {
    const matchStatus  = statusFilter === 'All'  || b.status === statusFilter
    const matchPayment = paymentFilter === 'All' || b.paymentStatus === paymentFilter
    const q = search.toLowerCase()
    const matchSearch  = !q
      || b.customer.toLowerCase().includes(q)
      || b.destination.toLowerCase().includes(q)
      || b.bookingRef.toLowerCase().includes(q)
    return matchStatus && matchPayment && matchSearch
  })

  // ── Summary stats ───────────────────────────────────────────────────────────
  const totalRevenue   = bookings.reduce((s, b) => s + Number(b.totalCost), 0)
  const paidRevenue    = bookings.filter(b => b.paymentStatus === 'Paid').reduce((s, b) => s + Number(b.totalCost), 0)
  const pendingCount   = bookings.filter(b => b.paymentStatus === 'Pending').length
  const confirmedCount = bookings.filter(b => b.status === 'Confirmed').length

  const STATUS_TABS  = ['All', 'Confirmed', 'Completed']
  const PAYMENT_TABS = ['All', 'Paid', 'Pending']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#111827' }}>Bookings</h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#9ca3af' }}>
          Manage confirmed bookings and track payment status.
        </p>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          {
            label: 'Total Bookings',
            value: bookings.length,
            icon: Calendar, iconBg: '#f0fdfa', iconColor: '#0f766e',
            sub: `${confirmedCount} confirmed`,
          },
          {
            label: 'Total Revenue',
            value: formatCurrency(totalRevenue),
            icon: CreditCard, iconBg: '#f0f9ff', iconColor: '#0369a1',
            sub: 'all bookings',
          },
          {
            label: 'Collected',
            value: formatCurrency(paidRevenue),
            icon: CheckCircle, iconBg: '#f0fdfa', iconColor: '#0f766e',
            sub: 'payments received',
          },
          {
            label: 'Pending Payments',
            value: pendingCount,
            icon: Clock, iconBg: '#fefce8', iconColor: '#a16207',
            sub: `${formatCurrency(totalRevenue - paidRevenue)} outstanding`,
          },
        ].map(card => (
          <div key={card.label} style={{
            backgroundColor: '#fff', border: '1px solid #f3f4f6',
            borderRadius: '14px', padding: '18px 20px',
            display: 'flex', alignItems: 'flex-start', gap: '14px',
          }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
              backgroundColor: card.iconBg, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <card.icon size={17} color={card.iconColor} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>{card.label}</p>
              <p style={{ margin: '3px 0 0', fontSize: '20px', fontWeight: '700', color: '#111827', lineHeight: 1 }}>
                {card.value}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#9ca3af' }}>{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Card ────────────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: '#fff', border: '1px solid #f3f4f6',
        borderRadius: '14px', overflow: 'hidden',
      }}>

        {/* Toolbar */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid #f3f4f6',
          backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', gap: '14px',
        }}>

          {/* Top row: title + search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '9px',
              backgroundColor: '#f0fdfa', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Plane size={15} color="#0f766e" />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>All Bookings</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                {filtered.length} of {bookings.length} bookings
              </p>
            </div>

            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#fff', border: '1px solid #e5e7eb',
              borderRadius: '10px', padding: '0 12px', height: '36px', width: '240px',
            }}>
              <Search size={13} color="#9ca3af" />
              <input
                type="text"
                placeholder="Search customer, destination..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: '13px', background: 'transparent', color: '#111827',
                }}
              />
            </div>
          </div>

          {/* Filter tabs row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

            {/* Status filter — grey pill bar with counts, matches Leads */}
            <div style={{
              display: 'flex', backgroundColor: '#f3f4f6',
              borderRadius: '10px', padding: '3px', gap: '2px',
            }}>
              {STATUS_TABS.map(tab => {
                const isActive = statusFilter === tab
                const count = tab === 'All'
                  ? bookings.length
                  : bookings.filter(b => b.status === tab).length
                return (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    style={{
                      padding: '6px 14px', borderRadius: '8px', border: 'none',
                      cursor: 'pointer', fontSize: '13px',
                      fontWeight: isActive ? '600' : '400',
                      backgroundColor: isActive ? '#fff' : 'transparent',
                      color: isActive ? '#111827' : '#6b7280',
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s ease',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tab}
                    <span style={{
                      fontSize: '11px', fontWeight: '500',
                      padding: '1px 6px', borderRadius: '999px',
                      backgroundColor: isActive ? '#f0fdfa' : '#e5e7eb',
                      color: isActive ? '#0f766e' : '#9ca3af',
                    }}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            <div style={{ width: '1px', height: '20px', backgroundColor: '#e5e7eb' }} />

            {/* Payment filter — same grey pill bar style */}
            <div style={{
              display: 'flex', backgroundColor: '#f3f4f6',
              borderRadius: '10px', padding: '3px', gap: '2px',
            }}>
              {PAYMENT_TABS.map(tab => {
                const isActive = paymentFilter === tab
                const count = tab === 'All'
                  ? bookings.length
                  : bookings.filter(b => b.paymentStatus === tab).length
                return (
                  <button
                    key={tab}
                    onClick={() => setPaymentFilter(tab)}
                    style={{
                      padding: '6px 14px', borderRadius: '8px', border: 'none',
                      cursor: 'pointer', fontSize: '13px',
                      fontWeight: isActive ? '600' : '400',
                      backgroundColor: isActive ? '#fff' : 'transparent',
                      color: isActive ? '#111827' : '#6b7280',
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s ease',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tab}
                    <span style={{
                      fontSize: '11px', fontWeight: '500',
                      padding: '1px 6px', borderRadius: '999px',
                      backgroundColor: isActive ? '#f0fdfa' : '#e5e7eb',
                      color: isActive ? '#0f766e' : '#9ca3af',
                    }}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              border: '3px solid #e5e7eb', borderTopColor: '#0f766e',
              animation: 'spin 0.7s linear infinite',
              margin: '0 auto 12px',
            }} />
            <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>Loading bookings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center', color: '#9ca3af' }}>
            <Plane size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>No bookings found</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px' }}>Try adjusting your filters or search</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {['Ref #', 'Customer', 'Destination', 'Travel Date', 'Total Cost', 'Payment', 'Status', 'Actions'].map(col => (
                    <th key={col} style={{
                      padding: '12px 16px', textAlign: 'left',
                      fontSize: '12px', fontWeight: '600', color: '#6b7280',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      backgroundColor: '#fafafa', whiteSpace: 'nowrap',
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(booking => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    onPaymentUpdate={handlePaymentUpdate}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div style={{
            padding: '14px 24px', borderTop: '1px solid #f3f4f6',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
              Showing {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
              Collected: <strong style={{ color: '#0f766e' }}>{formatCurrency(paidRevenue)}</strong>
              {' '}&nbsp;·&nbsp;{' '}
              Outstanding: <strong style={{ color: '#dc2626' }}>{formatCurrency(totalRevenue - paidRevenue)}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default Bookings