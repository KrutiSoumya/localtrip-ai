import { useState, useEffect, useRef } from 'react'
import {
  Calendar,
  MapPin,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  ChevronDown,
  Plane,
  RotateCcw,
} from 'lucide-react'

import {
  getAllBookings,
  markInvoicePaid,
  updateBookingStatus
} from '../services/api'

// ── Helpers (unchanged) ───────────────────────────────────────────────────────

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN')}`

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const daysUntil = (dateStr) => {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ── UI-only: animated number ──────────────────────────────────────────────────

function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0)
  const from = useRef(0)

  useEffect(() => {
    const end = Number(target) || 0
    const start = from.current
    if (start === end) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      from.current = end
      setVal(end)
      return
    }
    let raf
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(start + (end - start) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
      else from.current = end
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return val
}

function Stat({ label, value, money, sub }) {
  const n = useCountUp(value)
  return (
    <div className="bk-stat">
      <span className="bk-stat-num">{money ? formatCurrency(n) : n}</span>
      <span className="bk-stat-label">{label}</span>
      <span className="bk-stat-sub">{sub || '\u00a0'}</span>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`bk-toast ${type === 'success' ? 'ok' : 'err'}`}>
      {type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
      <p>{message}</p>
    </div>
  )
}

// ── Status Badge ──────────────────────────────────────────────────────────────
// Confirmed → calm; Completed → quiet; anything else (e.g. Pending) → warm highlight

function StatusBadge({ status }) {
  const cls =
    status === 'Confirmed' ? 'calm' : status === 'Completed' ? 'quiet' : status === 'Cancelled' ? 'err' : 'warm'
  return (
    <span className={`bk-badge ${cls}`}>
      <span className="bk-dot" />
      {status}
    </span>
  )
}

// ── Payment Badge ─────────────────────────────────────────────────────────────

function PaymentBadge({ status }) {
  const paid = status === 'Paid'
  return (
    <span className={`bk-badge ${paid ? 'calm' : 'warm'}`}>
      <CreditCard size={10} />
      {status}
    </span>
  )
}

// ── Payment Dropdown (logic unchanged) ────────────────────────────────────────

function PaymentDropdown({ invoice, onUpdate }) {
  const [open,setOpen]=useState(false); const [method,setMethod]=useState('UPI'); const [reference,setReference]=useState(''); const [loading,setLoading]=useState(false);
  if (!invoice || !['Sent','Overdue'].includes(invoice.status)) return <span>?</span>
  const submit=async e=>{e.preventDefault();setLoading(true);try{await onUpdate(invoice.id,{method,reference});setOpen(false)}finally{setLoading(false)}}
  return <div><button className="bk-change" onClick={()=>setOpen(v=>!v)}>Mark as Paid</button>{open&&<form onSubmit={submit} style={{position:'absolute',zIndex:20,background:'#fffdf9',padding:12,border:'1px solid #ddd',boxShadow:'0 4px 16px #0002',display:'grid',gap:8}}><select value={method} onChange={e=>setMethod(e.target.value)}><option>UPI</option><option>Cash</option><option>Bank transfer</option><option>Card</option><option>Other</option></select><input required placeholder="Payment reference" value={reference} onChange={e=>setReference(e.target.value)}/><button disabled={loading}>{loading?'Saving?':'Confirm payment'}</button></form>}</div>
}

function BookingRow({ booking, onPaymentUpdate, onCancel, index }) {
  const days = daysUntil(booking.travelDate)
  const isPast = days !== null && days < 0
  const isSoon = days !== null && days >= 0 && days <= 7

  const customer =
    booking.lead?.customer_name ||
    booking.customer ||
    booking.customer_name ||
    'Unknown customer'

  const destination =
    booking.lead?.destination ||
    booking.destination ||
    booking.itinerary?.lead?.destination ||
    '—'

  const pax =
    booking.lead?.group_size ?? booking.pax ?? booking.group_size ?? 1

  const bookingRef = booking.bookingRef || `BK-${booking.id}`

  const totalCost =
    booking.totalCost ??
    booking.quotation?.total_price ??
    booking.total_price ??
    0

  const paymentStatus = booking.paymentStatus || 'Not Due'
  const status = booking.status || 'Pending'

  return (
    <tr className="bk-row" style={{ '--i': Math.min(index, 12) }}>
      <td className="nowrap">
        <span className="bk-ref">{bookingRef}</span>
      </td>

      <td>
        <div className="bk-cust">
          <div className="bk-avatar">{customer.charAt(0)}</div>
          <div>
            <p className="bk-name">{customer}</p>
            <p className="bk-meta">
              {pax} {pax === 1 ? 'person' : 'people'}
            </p>
          </div>
        </div>
      </td>

      <td>
        <div className="bk-dest">
          <MapPin size={12} />
          <span>{destination}</span>
        </div>
      </td>

      <td className="nowrap">
        <p className="bk-name">{formatDate(booking.travelDate)}</p>
        <p className={`bk-meta ${isSoon ? 'soon' : ''}`}>
          {days === null
            ? 'Date not set'
            : isPast
              ? 'Past travel date'
              : isSoon
                ? `In ${days} day${days === 1 ? '' : 's'} ⚠️`
                : `In ${days} days`}
        </p>
      </td>

      <td className="nowrap">
        <span className="bk-cost">{formatCurrency(totalCost)}</span>
      </td>

      <td>
        <PaymentBadge status={paymentStatus} />
      </td>

      <td>
        <StatusBadge status={status} />
      </td>

      <td>
        <div style={{display:"grid",gap:6}}><PaymentDropdown invoice={booking.invoice} onUpdate={onPaymentUpdate} />{booking.status === "Confirmed" && <button className="bk-change" onClick={() => onCancel(booking)}>Cancel booking</button>}</div>
      </td>
    </tr>
  )
}

// ── Hero background images (UI only) ──────────────────────────────────────────
// Hosted on GitHub (krithi575/pp_images): image1.jpg ... image5.jpg
const BASE = 'https://raw.githubusercontent.com/krithi575/pp_images/main/'
const EXT = '.jpg'
const IMAGES = [4,2,3,5,1].map((n) => `${BASE}image${n}${EXT}`)
const SLIDE_MS = 6500

// ── Main Component ────────────────────────────────────────────────────────────

function Bookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [paymentFilter, setPaymentFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [slide, setSlide] = useState(0)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  // Background slideshow: preload, then advance automatically (UI only)
  useEffect(() => {
    IMAGES.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [])

  useEffect(() => {
    const id = setInterval(
      () => setSlide((s) => (s + 1) % IMAGES.length),
      SLIDE_MS
    )
    return () => clearInterval(id)
  }, [])

  // ── Fetch Bookings (unchanged) ──────────────────────────────────────────────

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await getAllBookings()
        const data = Array.isArray(res.data) ? res.data : []
        setBookings(data)
      } catch (error) {
        console.error(
          'Failed to fetch bookings:',
          error.response?.data || error.message
        )
        setBookings([])
        showToast(
          'Could not load bookings. Please check the backend and try again.',
          'error'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [])

  // ── Payment Update (unchanged) ──────────────────────────────────────────────

  const handlePaymentUpdate = async (invoiceId, payment) => {
    try {
      await markInvoicePaid(invoiceId, payment)
      setBookings(current => current.map(b => b.invoice?.id === invoiceId ? { ...b, paymentStatus: 'Paid', status: 'Completed', invoice: { ...b.invoice, status: 'Paid' } } : b))
      showToast('Invoice marked paid')
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to mark invoice paid', 'error')
      throw error
    }
  }

  const handleCancel = async booking => {
    if (!window.confirm(`Cancel the trip for ${booking.lead?.customer_name || 'this customer'}?`)) return
    try { await updateBookingStatus(booking.id, 'Cancelled'); setBookings(current => current.map(b => b.id === booking.id ? { ...b, status: 'Cancelled' } : b)); showToast('Booking cancelled') }
    catch (error) { showToast(error.response?.data?.message || 'Could not cancel booking', 'error') }
  }

  const filtered = bookings.filter((booking) => {
    const customer =
      booking.lead?.customer_name ||
      booking.customer ||
      booking.customer_name ||
      ''

    const destination =
      booking.lead?.destination ||
      booking.destination ||
      booking.itinerary?.lead?.destination ||
      ''

    const bookingRef = booking.bookingRef || `BK-${booking.id}`

    const matchStatus =
      statusFilter === 'All' || booking.status === statusFilter

    const matchPayment =
      paymentFilter === 'All' || booking.paymentStatus === paymentFilter

    const q = search.trim().toLowerCase()

    const matchSearch =
      !q ||
      customer.toLowerCase().includes(q) ||
      destination.toLowerCase().includes(q) ||
      bookingRef.toLowerCase().includes(q)

    return matchStatus && matchPayment && matchSearch
  })

  // ── Summary Stats (unchanged) ───────────────────────────────────────────────

  const quotedValue = bookings.reduce((sum, b) => sum + Number(b.quotation?.total_price || b.total_price || 0), 0)

  const paidRevenue = bookings
    .filter((b) => b.invoice?.status === 'Paid')
    .reduce((sum, b) => sum + Number(b.invoice.final_amount || 0), 0)

  const outstandingRevenue = bookings
    .filter((b) => ['Sent', 'Overdue'].includes(b.invoice?.status))
    .reduce((sum, b) => sum + Number(b.invoice.final_amount || 0), 0)

  const pendingCount = bookings.filter(
    (b) => ['Invoice Sent', 'Overdue'].includes(b.paymentStatus)
  ).length

  const confirmedCount = bookings.filter((b) => b.status === 'Confirmed').length

  const STATUS_TABS = ['All', 'Confirmed', 'Completed', 'Cancelled']
  const PAYMENT_TABS = ['All', 'Not Due', 'Invoice Sent', 'Paid', 'Overdue']

  // UI-only: reset the existing filter/search state
  const hasActiveFilters =
    statusFilter !== 'All' || paymentFilter !== 'All' || search.trim() !== ''

  const clearFilters = () => {
    setStatusFilter('All')
    setPaymentFilter('All')
    setSearch('')
  }

  const renderTabs = (label, tabs, active, setActive, key) => (
    <div className="bk-fgroup" role="group" aria-label={label}>
      <span className="bk-flabel">{label}</span>
      <div className="bk-tabs">
        {tabs.map((tab) => {
          const count =
            tab === 'All'
              ? bookings.length
              : bookings.filter((b) => b[key] === tab).length
          return (
            <button
              key={tab}
              className={active === tab ? 'on' : ''}
              onClick={() => setActive(tab)}
            >
              {tab}
              <span>{count}</span>
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="bk-page">
      {/* Background slideshow */}
      <div className="bk-bg" aria-hidden="true">
        {IMAGES.map((src, i) => (
          <div
            key={src}
            className={`bk-bg-layer ${i === slide ? 'on' : ''}`}
            style={{ backgroundImage: `url("${src}")` }}
          />
        ))}
        <div className="bk-bg-shade" />
      </div>

      {/* Hero */}
      <section className="bk-hero">
        <div className="bk-hero-text">
          <h1 className="bk-title">Bookings</h1>
          <p className="bk-sub">
            Manage confirmed bookings and track payment status.
          </p>
        </div>

        <div className="bk-stats">
          <Stat label="Total bookings" value={bookings.length} sub={`${confirmedCount} confirmed`} />
          <Stat label="Quoted value" value={quotedValue} money sub="confirmed and upcoming trips" />
          <Stat label="Collected" value={paidRevenue} money sub="payments received" />
          <Stat label="Awaiting payment" value={pendingCount} sub="Sent or overdue invoices" />
        </div>
      </section>

      {/* Table */}
      <section className="bk-card">
        <div className="bk-toolbar">
          <div className="bk-toolbar-top">
            <div className="bk-icon">
              <Plane size={13} />
            </div>
            <div style={{ flex: 1 }}>
              <h2>All Bookings</h2>
              <p>
                {filtered.length} of {bookings.length} bookings
              </p>
            </div>
            <label className="bk-search">
              <Search size={12} />
              <input
                type="text"
                placeholder="Search customer, destination..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="bk-reset"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              <RotateCcw size={11} />
              Clear filters
            </button>
          </div>

          <div className="bk-filters">
            {renderTabs('Booking Status', STATUS_TABS, statusFilter, setStatusFilter, 'status')}
            <div className="bk-sep" />
            {renderTabs('Payment Status', PAYMENT_TABS, paymentFilter, setPaymentFilter, 'paymentStatus')}
          </div>
        </div>

        {loading ? (
          <div className="bk-empty">
            <span className="bk-spin" />
            <p>Loading bookings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bk-empty">
            <Plane size={26} style={{ opacity: 0.35 }} />
            <p className="t">No bookings found</p>
            <p>Try adjusting your filters or search</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="bk-table">
              <thead>
                <tr>
                  {['Ref #', 'Customer', 'Destination', 'Travel Date', 'Total Cost', 'Payment', 'Status', 'Invoice'].map(
                    (col) => (
                      <th key={col}>{col}</th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((booking, i) => (
                  <BookingRow
                    key={booking.id}
                    index={i}
                    booking={booking}
                    onPaymentUpdate={handlePaymentUpdate}
                    onCancel={handleCancel}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="bk-foot">
            <p className="count">
              Showing {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="bk-totals">
              <p>
                Collected <strong className="g">{formatCurrency(paidRevenue)}</strong>
              </p>
              <p>
                Outstanding <strong className="r">{formatCurrency(outstandingRevenue)}</strong>
              </p>
            </div>
          </div>
        )}
      </section>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <style>{CSS}</style>
    </div>
  )
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Jost:wght@400;500;600&family=Playfair+Display:wght@400;500&display=swap');

.bk-page{position:relative;isolation:isolate;display:flex;flex-direction:column;gap:16px;padding:12px;max-width:1180px;margin:0 auto;color:#faf7f2;font-family:'Playfair Display',Georgia,serif;font-size:13px;font-variant-numeric:lining-nums tabular-nums}
.bk-page *{box-sizing:border-box}

/* Background: crossfading photos with a slow push-in, under one consistent scrim */
.bk-bg{position:fixed;inset:0;z-index:-1;pointer-events:none;background:#1e130e;overflow:hidden}
.bk-bg-layer{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity 1.6s ease;transform:scale(1)}
.bk-bg-layer.on{opacity:1;animation:bk-push 8s ease-out forwards}
@keyframes bk-push{from{transform:scale(1)}to{transform:scale(1.06)}}
.bk-bg-shade{position:absolute;inset:0;background:
  linear-gradient(135deg,rgba(67,15,25,.88) 0%,rgba(46,29,23,.84) 55%,rgba(30,18,12,.90) 100%),
  linear-gradient(0deg,rgba(30,18,12,.55) 0%,transparent 45%)}

/* Hero: refined serif title + stat containers */
.bk-hero{display:flex;flex-direction:column;gap:16px;padding:16px 4px 0}
.bk-hero-text{max-width:520px}
.bk-title{margin:0;color:#f6eedd;font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:clamp(28px,3.4vw,40px);line-height:1.05;letter-spacing:.16em;text-transform:uppercase;text-shadow:0 2px 14px rgba(30,18,12,.5);animation:bk-rise .8s cubic-bezier(.2,.8,.2,1) both}
@keyframes bk-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.bk-sub{margin:8px 0 0;font-family:'Jost',system-ui,sans-serif;font-size:14px;line-height:1.5;color:#efe4cc;opacity:.92}

.bk-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.bk-stat{display:grid;grid-template-rows:auto auto auto;align-content:start;gap:2px;padding:12px 16px;border-radius:10px;background:rgba(30,18,12,.66);border:1px solid rgba(207,176,122,.28);box-shadow:0 6px 18px rgba(0,0,0,.25);font-family:'Jost',system-ui,sans-serif}
.bk-stat-num{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:28px;line-height:1.1;color:#f6eedd;font-variant-numeric:lining-nums tabular-nums;white-space:nowrap}
.bk-stat-label{font-size:12.5px;font-weight:500;color:#e8d3a6}
.bk-stat-sub{font-size:11px;color:rgba(246,238,221,.75);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* Table card: near-opaque panel with border + soft shadow */
.bk-card{background:rgba(34,21,15,.93);border:1px solid rgba(207,176,122,.3);box-shadow:0 18px 48px rgba(0,0,0,.42),0 2px 8px rgba(0,0,0,.25);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border-radius:12px;overflow:hidden;font-family:'Jost',system-ui,-apple-system,'Segoe UI',sans-serif}
.bk-toolbar{padding:12px 14px;border-bottom:1px solid rgba(246,238,221,.12);display:flex;flex-direction:column;gap:12px}
.bk-toolbar-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.bk-toolbar h2{margin:0;font-size:14px;font-weight:600}
.bk-toolbar p{margin:0;font-size:11px;opacity:.65}
.bk-icon{width:26px;height:26px;border-radius:7px;background:rgba(212,180,131,.16);color:#d4b483;display:flex;align-items:center;justify-content:center}
.bk-search{display:flex;align-items:center;gap:6px;background:rgba(246,238,221,.08);border:1px solid rgba(246,238,221,.18);border-radius:8px;padding:0 10px;height:30px;width:220px;transition:border-color .2s,box-shadow .2s,width .25s}
.bk-search:focus-within{border-color:#d4b483;box-shadow:0 0 0 2px rgba(212,180,131,.22);width:250px}
.bk-search input{flex:1;border:none;outline:none;background:transparent;color:#fff;font-size:12px;font-family:inherit}
.bk-search input::placeholder{color:rgba(246,238,221,.5)}

.bk-reset{display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 12px;border-radius:8px;border:1px solid rgba(212,180,131,.55);background:transparent;color:#e8d3a6;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap;transition:background .2s,color .2s,border-color .2s}
.bk-reset:hover:not(:disabled){background:#d4b483;color:#2b1b14;border-color:#d4b483}
.bk-reset:disabled{opacity:.4;cursor:default}
.bk-reset:focus-visible,.bk-tabs button:focus-visible,.bk-change:focus-visible{outline:2px solid #d4b483;outline-offset:2px}

.bk-filters{display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap}
.bk-fgroup{display:flex;flex-direction:column;gap:5px}
.bk-flabel{font-size:11px;font-weight:600;color:#e8d3a6;letter-spacing:.02em}
.bk-sep{width:1px;height:28px;background:rgba(246,238,221,.2)}
.bk-tabs{display:flex;background:rgba(246,238,221,.07);border-radius:8px;padding:2px;gap:2px}
.bk-tabs button{display:flex;align-items:center;gap:5px;padding:4px 10px;border:none;border-radius:6px;background:transparent;color:rgba(246,238,221,.75);font-family:inherit;font-size:12px;cursor:pointer;white-space:nowrap;transition:background .2s,color .2s}
.bk-tabs button:hover{color:#fff}
.bk-tabs button.on{background:#d4b483;color:#2b1b14;font-weight:600}
.bk-tabs span{font-size:10px;padding:0 5px;border-radius:999px;background:rgba(246,238,221,.14)}
.bk-tabs button.on span{background:rgba(43,27,20,.18)}

.bk-table{width:100%;border-collapse:collapse}
.bk-table th{padding:9px 12px;text-align:left;font-size:10px;font-weight:600;color:rgba(246,238,221,.65);text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;border-bottom:1px solid rgba(246,238,221,.12)}
.bk-table td{padding:9px 12px;vertical-align:middle}
.bk-table td.nowrap{white-space:nowrap}
.bk-row{border-bottom:1px solid rgba(246,238,221,.08);animation:bk-in .5s calc(var(--i) * 45ms) ease both;transition:background .2s,box-shadow .2s}
.bk-row:hover{background:rgba(246,238,221,.07);box-shadow:inset 2px 0 0 #d4b483}
@keyframes bk-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.bk-ref{font-family:ui-monospace,monospace;font-size:11px;font-weight:600;color:rgba(246,238,221,.7)}
.bk-cust{display:flex;align-items:center;gap:8px}
.bk-avatar{width:24px;height:24px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,#e2c898,#9c6b3f);color:#2b1b14;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;text-transform:uppercase}
.bk-name{margin:0;font-size:12.5px;font-weight:500;line-height:1.3}
.bk-meta{margin:0;font-size:10.5px;opacity:.65;line-height:1.3}
.bk-meta.soon{color:#f0a0a0;opacity:1}
.bk-dest{display:flex;align-items:center;gap:5px;font-size:12px;font-weight:500}
.bk-dest svg{opacity:.5}
.bk-cost{font-size:12.5px;font-weight:600}

/* Badges: Pending = warm highlight, Confirmed/Paid = calm */
.bk-badge{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;padding:2px 9px;border-radius:999px;font-weight:500;border:1px solid}
.bk-badge.calm{background:rgba(158,184,160,.14);color:#cfe0d0;border-color:rgba(158,184,160,.42)}
.bk-badge.quiet{background:rgba(246,238,221,.07);color:#d9cfba;border-color:rgba(246,238,221,.22)}
.bk-badge.warm{background:rgba(226,160,72,.26);color:#ffdba3;border-color:rgba(226,160,72,.75);font-weight:600;box-shadow:0 0 0 1px rgba(226,160,72,.12)}
.bk-dot{width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0}

.bk-change{display:flex;align-items:center;gap:4px;padding:3px 9px;border-radius:7px;border:1px solid rgba(246,238,221,.24);background:rgba(246,238,221,.06);color:#fff;font-family:inherit;font-size:11px;font-weight:500;cursor:pointer;transition:background .2s,border-color .2s}
.bk-change:hover:not(:disabled){background:rgba(212,180,131,.16);border-color:#d4b483}
.bk-change:disabled{cursor:not-allowed}
.bk-menu{position:absolute;top:calc(100% + 4px);right:0;z-index:20;min-width:104px;background:#2b1b14;border:1px solid rgba(246,238,221,.18);border-radius:8px;box-shadow:0 12px 30px rgba(0,0,0,.45);overflow:hidden;animation:bk-pop .16s ease both;transform-origin:top right}
@keyframes bk-pop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}
.bk-menu button{display:flex;align-items:center;gap:6px;width:100%;padding:7px 12px;border:none;background:transparent;color:#f6eedd;font-family:inherit;font-size:12px;text-align:left;cursor:pointer}
.bk-menu button:hover{background:rgba(246,238,221,.08)}
.bk-menu button.active{color:#d4b483;font-weight:600}

.bk-empty{padding:36px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;color:rgba(246,238,221,.7)}
.bk-empty p{margin:0;font-size:12px}.bk-empty .t{font-size:13px;font-weight:500;color:#fff}
.bk-spin{width:24px;height:24px;border-radius:50%;border:2px solid rgba(246,238,221,.15);border-top-color:#d4b483;animation:spin .7s linear infinite}
.bk-spin.sm{width:11px;height:11px;border-width:2px;animation-duration:.6s}
@keyframes spin{to{transform:rotate(360deg)}}

/* Footer totals: solid dark band, large high-contrast figures */
.bk-foot{padding:12px 16px;background:#1b110c;border-top:1px solid rgba(207,176,122,.35);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}
.bk-foot p{margin:0}
.bk-foot .count{font-size:12px;color:rgba(246,238,221,.8)}
.bk-totals{display:flex;align-items:center;gap:24px;flex-wrap:wrap}
.bk-totals p{display:flex;align-items:baseline;gap:8px;font-size:12px;color:rgba(246,238,221,.85)}
.bk-totals strong{font-size:16px;font-weight:700;font-variant-numeric:lining-nums tabular-nums}
.bk-foot .g{color:#f1dcab}.bk-foot .r{color:#ffb4a6}

.bk-toast{position:fixed;bottom:20px;right:20px;z-index:999;display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:10px;min-width:220px;backdrop-filter:blur(12px);box-shadow:0 10px 30px rgba(0,0,0,.4);font-family:system-ui,sans-serif;animation:bk-toast .35s cubic-bezier(.2,.8,.2,1) both}
.bk-toast p{margin:0;font-size:12px;font-weight:500;flex:1}
.bk-toast.ok{background:rgba(43,27,20,.94);border:1px solid rgba(212,180,131,.55);color:#e8d3a6}
.bk-toast.err{background:rgba(92,26,32,.94);border:1px solid rgba(190,70,80,.6);color:#f4c6c6}
@keyframes bk-toast{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}

@media (max-width:860px){
  .bk-hero{padding:12px 0 0;gap:14px}
  .bk-stats{grid-template-columns:repeat(2,1fr)}
  .bk-search,.bk-search:focus-within{width:100%}
  .bk-sep{display:none}
}
@media (prefers-reduced-motion:reduce){
  .bk-bg-layer.on,.bk-title,.bk-row,.bk-menu,.bk-toast{animation:none}
  .bk-bg-layer{transition:none}
}
`

export default Bookings