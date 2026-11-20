import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Phone, Mail, MessageSquare,
  MapPin, DollarSign, Calendar, Users,
  Send, ArrowLeft, MessageCircle
} from 'lucide-react'
import { createLead } from '../services/api'

// ── Theme (visual only) ───────────────────────────────────────────────────────

const T = {
  maroon:   '#5c0f1b',
  maroonDk: '#3b0912',
  ivory:    '#f5ecd9',
  gold:     '#c8a96a',
  goldDk:   '#9c7d3c',
  espresso: '#2b1810',
  paper:    '#fbf8f2',
  muted:    '#7c6755',
  sand:     '#dccaa4',
}

const REQUIRED = ['customerName', 'phone', 'email', 'destination', 'budget', 'travelDate', 'groupSize']
const ROUTE = 'M150 16 C 70 30, 170 70, 100 96 S 70 140, 96 154'

// ── Inquiry parsing (display + payload helper; no network, no backend calls) ──

const MONTH_RE = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'
const MONTH_IDX = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }
const monthIndex = (s) => MONTH_IDX[s.slice(0, 3).toLowerCase()]

const NUM_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 }
const NUM_WORD_RE = '(one|two|three|four|five|six|seven|eight|nine|ten)'

const UNIT = { k: 1e3, thousand: 1e3, lakh: 1e5, lakhs: 1e5, lac: 1e5, lacs: 1e5, l: 1e5, cr: 1e7, crore: 1e7, crores: 1e7 }

const KNOWN_PLACES = [
  'Goa', 'Bali', 'Manali', 'Kerala', 'Dubai', 'Paris', 'Maldives', 'Shimla', 'Ladakh', 'Leh',
  'Kashmir', 'Rajasthan', 'Thailand', 'Singapore', 'Malaysia', 'Tokyo', 'Kyoto', 'Andaman',
  'Ooty', 'Munnar', 'Jaipur', 'Udaipur', 'Jaisalmer', 'Darjeeling', 'Sikkim', 'Gangtok',
  'Varanasi', 'Rishikesh', 'Bangkok', 'Phuket', 'London', 'Switzerland', 'Vietnam', 'Sri Lanka',
  'Nepal', 'Bhutan', 'Mauritius', 'Istanbul', 'Rome', 'Hampi', 'Coorg', 'Mysore', 'Pondicherry',
  'Kodaikanal', 'Agra', 'Amritsar', 'Spiti', 'Meghalaya', 'Kanyakumari', 'Kochi', 'Alleppey',
  'Wayanad', 'Gokarna', 'Lakshadweep', 'Egypt', 'Turkey', 'Europe', 'Australia',
]

const DEST_STOP = new Set([
  'i', 'we', 'my', 'our', 'the', 'a', 'an', 'this', 'next', 'budget', 'rs', 'inr', 'family',
  'group', 'party', 'couple', 'hotel', 'hotels', 'flight', 'flights', 'kids', 'adults', 'please',
  'need', 'want', 'looking', 'planning', 'trip', 'tour', 'package', 'honeymoon', 'vacation',
  'holiday', 'weekend', 'summer', 'winter', 'monsoon', 'diwali', 'christmas', 'holi', 'eid',
  'onam', 'pongal', 'dussehra', 'navratri', 'easter',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september',
  'october', 'november', 'december', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep',
  'sept', 'oct', 'nov', 'dec',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
])
const isStop = (w) => DEST_STOP.has(w.toLowerCase())

function parseDestination(text) {
  const label = text.match(/destination\s*[:\-]\s*([^,.;\n]{2,40})/i)
  if (label) return label[1].trim()

  const re = /\b(?:[Tt]o|[Vv]isit(?:ing)?|[Ii]n|[Aa]t|[Aa]round|[Ee]xplor(?:e|ing)|[Ff]or)\s+([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){0,2})/g
  let m
  while ((m = re.exec(text)) !== null) {
    const words = m[1].split(/\s+/)
    if (isStop(words[0])) continue
    while (words.length > 1 && isStop(words[words.length - 1])) words.pop()
    return words.join(' ')
  }

  let best = null
  for (const p of KNOWN_PLACES) {
    const mm = new RegExp('\\b' + p + '\\b', 'i').exec(text)
    if (mm && (best === null || mm.index < best.index)) best = { index: mm.index, name: p }
  }
  return best ? best.name : ''
}

function parseDate(text) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const iso = (y, m, d) => {
    const dt = new Date(y, m, d)
    if (dt.getFullYear() !== y || dt.getMonth() !== m || dt.getDate() !== d) return ''
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  const withYear = (m, d, y) => {
    if (y) return iso(Number(y), m, d)
    let yy = today.getFullYear()
    if (new Date(yy, m, d) < today) yy += 1
    return iso(yy, m, d)
  }

  let m = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/)
  if (m) return iso(+m[1], +m[2] - 1, +m[3])

  m = text.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:of\\s+)?${MONTH_RE}\\b(?:[,\\s]+(20\\d{2}))?`, 'i'))
  if (m) return withYear(monthIndex(m[2]), +m[1], m[3])

  m = text.match(new RegExp(`\\b${MONTH_RE}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?!\\s*(?:days?|nights?|people|pax|persons?|adults?|kids?|members?))(?:[,\\s]+(20\\d{2}))?`, 'i'))
  if (m) return withYear(monthIndex(m[1]), +m[2], m[3])

  m = text.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](20\d{2}|\d{2})\b/)
  if (m) {
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3]
    return iso(y, +m[2] - 1, +m[1])
  }

  return ''
}

function parseBudget(text) {
  const t = text.replace(/(\d),(?=\d)/g, '$1')
  const toNum = (n, u) => Math.round(parseFloat(n) * (u ? UNIT[u.toLowerCase()] || 1 : 1))
  const unit = '(k|thousand|lakhs?|lacs?|l|cr|crores?)'

  let m = t.match(new RegExp(`(?:₹|\\brs\\.?|\\binr)\\s*(\\d+(?:\\.\\d+)?)\\s*${unit}?\\b`, 'i'))
  if (m) return toNum(m[1], m[2])

  m = t.match(new RegExp(`budget[^\\d\\n]{0,25}?(\\d+(?:\\.\\d+)?)\\s*${unit}?\\b`, 'i'))
  if (m) return toNum(m[1], m[2])

  m = t.match(/(\d+(?:\.\d+)?)\s*(k|thousand|lakhs?|lacs?|crores?)\b/i)
  if (m) return toNum(m[1], m[2])

  m = t.match(/(\d+(?:\.\d+)?)\s*(?:rupees|inr)\b/i)
  if (m) return toNum(m[1], null)

  return 0
}

function parseParty(text) {
  let t = text.replace(
    new RegExp(`\\b${NUM_WORD_RE}\\b(?=\\s+(?:of us|people|persons?|pax|adults?|kids?|children|friends|members|travell?ers|guests))`, 'gi'),
    (w) => String(NUM_WORDS[w.toLowerCase()])
  )
  t = t.replace(
    new RegExp(`\\b(family|group|party|team|gang)\\s+of\\s+${NUM_WORD_RE}\\b`, 'gi'),
    (_, g, w) => `${g} of ${NUM_WORDS[w.toLowerCase()]}`
  )

  let total = 0
  let found = false
  const re = /(\d+)\s*(?:adults?|kids?|children|child|infants?|seniors?|elders?)\b/gi
  let m
  while ((m = re.exec(t)) !== null) { total += +m[1]; found = true }
  if (found && total > 0 && total <= 500) return total

  m = t.match(/\b(?:family|group|party|team|gang)\s+of\s+(\d+)/i)
  if (m && +m[1] > 0 && +m[1] <= 500) return +m[1]

  m = t.match(/(\d+)\s*(?:people|persons?|pax|members?|travell?ers?|guests?|friends|of us|heads)\b/i)
  if (m && +m[1] > 0 && +m[1] <= 500) return +m[1]

  if (/\b(couple|honeymoon)\b/i.test(t)) return 2
  if (/\b(solo|alone|myself)\b/i.test(t)) return 1

  return 0
}

function parseInquiry(text) {
  if (!text || !text.trim()) {
    return { destination: '', budget: 0, travelDate: '', groupSize: 0 }
  }
  return {
    destination: parseDestination(text),
    budget: parseBudget(text),
    travelDate: parseDate(text),
    groupSize: parseParty(text),
  }
}


// ── Reusable field wrapper ────────────────────────────────────────────────────

function Field({ label, icon: Icon, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label className="lf-label">
        {Icon && <Icon size={12} />}
        {label}
      </label>

      {children}

      {error && <p className="lf-error">{error}</p>}
    </div>
  )
}

const inputClass = (hasError) => `lf-input${hasError ? ' has-error' : ''}`

// ── Live ticket row (display only) ────────────────────────────────────────────

function TicketItem({ label, icon: Icon, value, wide }) {
  return (
    <div className={`lf-t-item${wide ? ' wide' : ''}`}>
      <span className="lf-t-label"><Icon size={11} />{label}</span>
      <span key={value} className={`lf-serif lf-t-val${value ? '' : ' empty'}`}>
        {value || '—'}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function LeadForm({ onSuccess }) {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    source: '',
    inquiryMessage: '',
    destination: '',
    budget: '',
    travelDate: '',
    groupSize: ''
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState(null)

  // ── Route progress (visual only) ────────────────────────────────────────────

  const pathRef = useRef(null)
  const shownRef = useRef(0)
  const rafRef = useRef(null)
  const [shown, setShown] = useState(0)
  const [pt, setPt] = useState({ x: 150, y: 16 })

  // Trip details are read from the inquiry message; anything it doesn't
  // contain can be typed into the small fallback fields below the message.
  const parsed = parseInquiry(form.inquiryMessage)
  const eff = {
    destination: parsed.destination || form.destination.trim(),
    budget: parsed.budget ? String(parsed.budget) : form.budget,
    travelDate: parsed.travelDate || form.travelDate,
    groupSize: parsed.groupSize ? String(parsed.groupSize) : form.groupSize,
  }
  const vals = {
    customerName: form.customerName,
    phone: form.phone,
    email: form.email,
    destination: eff.destination,
    budget: eff.budget,
    travelDate: eff.travelDate,
    groupSize: eff.groupSize,
  }
  const filledCount = REQUIRED.filter(k => String(vals[k]).trim() !== '').length
  const progress = filledCount / REQUIRED.length

  useEffect(() => {
    const path = pathRef.current
    if (!path) return

    const len = path.getTotalLength()
    const place = (v) => {
      const p = path.getPointAtLength(v * len)
      shownRef.current = v
      setShown(v)
      setPt({ x: p.x, y: p.y })
    }

    const reduce = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { place(progress); return }

    const from = shownRef.current
    const to = progress
    const start = performance.now()
    const dur = 800

    const tick = (now) => {
      const k = Math.min(1, (now - start) / dur)
      const e = 1 - Math.pow(1 - k, 3)
      place(from + (to - from) * e)
      if (k < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafRef.current)
  }, [progress, submitted])

  // ── Change handler ─────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: null }))
    setServerError(null)
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  const validate = () => {
    const e = {}

    if (!form.customerName.trim())
      e.customerName = 'Customer name is required.'

    if (!form.phone.trim())
      e.phone = 'Phone number is required.'

    if (!form.email.trim())
      e.email = 'Email is required.'
    else if (!/\S+@\S+\.\S+/.test(form.email))
      e.email = 'Please enter a valid email.'

    if (!eff.destination.trim())
      e.destination = 'Destination is required.'

    if (!eff.budget)
      e.budget = 'Budget is required.'
    else if (Number(eff.budget) <= 0)
      e.budget = 'Budget must be greater than 0.'

    if (!eff.travelDate)
      e.travelDate = 'Travel date is required.'

    if (!eff.groupSize)
      e.groupSize = 'Group size is required.'
    else if (Number(eff.groupSize) < 1)
      e.groupSize = 'Group size must be at least 1.'

    return e
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError(null)

    const validationErrors = validate()

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    try {
      setLoading(true)

      await createLead({
        customer_name: form.customerName,
        phone: form.phone,
        email: form.email,
        source: form.source || null,
        inquiry_text: form.inquiryMessage,
        destination: eff.destination,
        budget: Number(eff.budget),
        travel_date: eff.travelDate,
        group_size: Number(eff.groupSize),
      })

      setSubmitted(true)

      if (onSuccess) onSuccess()

    } catch (err) {
      setServerError(
        err.response?.data?.message ||
        'Failed to create lead. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ── Display helpers ──────────────────────────────────────────────────────────

  const fmtDate = eff.travelDate
    ? new Date(eff.travelDate + 'T00:00:00').toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : ''
  const fmtBudget = eff.budget && Number(eff.budget) > 0
    ? '₹' + Number(eff.budget).toLocaleString('en-IN')
    : ''
  const fmtParty = eff.groupSize && Number(eff.groupSize) > 0
    ? `${eff.groupSize} ${Number(eff.groupSize) === 1 ? 'guest' : 'guests'}`
    : ''

  const missing = {
    destination: !parsed.destination,
    budget: !parsed.budget,
    travelDate: !parsed.travelDate,
    groupSize: !parsed.groupSize,
  }
  const missingLabels = [
    missing.destination && 'destination',
    missing.travelDate && 'date',
    missing.groupSize && 'party size',
    missing.budget && 'budget',
  ].filter(Boolean)
  const hasDetailErrors = ['destination', 'budget', 'travelDate', 'groupSize'].some(k => errors[k])
  const showFallback = form.inquiryMessage.trim().length > 0 || hasDetailErrors

  // ── Shared background ────────────────────────────────────────────────────────

  const backdrop = (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
        backgroundColor: T.ivory,
      }}
    >
      <span className="lf-glow lf-glow-a" />
      <span className="lf-glow lf-glow-b" />
    </div>
  )

  // ── Success screen ───────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="lf-page">
        {backdrop}

        <div className="lf-success">
          <svg className="lf-check" viewBox="0 0 56 56" aria-hidden="true">
            <circle className="lf-check-ring" cx="28" cy="28" r="26" />
            <path className="lf-check-tick" d="M16 29 L24 37 L40 19" />
          </svg>

          <h2 className="lf-serif lf-success-title">Lead created</h2>

          <p className="lf-success-text">
            {form.customerName}'s inquiry for {eff.destination} has been added to your pipeline.
          </p>

          <div style={{ display: 'flex', gap: '10px', marginTop: '22px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="lf-g-outline"
              onClick={() => {
                setSubmitted(false)
                setForm({
                  customerName: '',
                  phone: '',
                  email: '',
                  source: '',
                  inquiryMessage: '',
                  destination: '',
                  budget: '',
                  travelDate: '',
                  groupSize: '',
                })
                setErrors({})
                setServerError(null)
              }}
            >
              Add Another Lead
            </button>

            <button className="lf-g-fill" onClick={() => navigate('/leads')}>
              View All Leads
            </button>
          </div>
        </div>

        <style>{CSS}</style>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────────────

  return (
    <div className="lf-page">
      {backdrop}

      <div className="lf-layout">

        {/* ── Left: journey panel ───────────────────────────────────────────── */}
        <aside className="lf-pass">
          <span className="lf-frame" aria-hidden="true" />

          <button className="lf-back" onClick={() => navigate('/leads')} title="Back to leads">
            <ArrowLeft size={16} />
          </button>

          <h1 className="lf-serif lf-title">New lead</h1>
          <p className="lf-sub">Fill in the customer's inquiry details</p>

          {/* Kashmir → Kanyakumari route; advances as the form fills */}
          <svg className="lf-route" viewBox="0 0 220 170" aria-hidden="true">
            <path d={ROUTE} className="lf-track" />
            <path
              ref={pathRef}
              d={ROUTE}
              className="lf-trail"
              pathLength="1"
              style={{ strokeDasharray: 1, strokeDashoffset: 1 - shown }}
            />
            <circle cx="150" cy="16" r="3" className="lf-stop" />
            <circle cx="96" cy="154" r="3" className="lf-stop" />
            <text x="160" y="19" className="lf-place">Kashmir</text>
            <text x="108" y="158" className="lf-place">Kanyakumari</text>
            <circle cx={pt.x} cy={pt.y} r="9" className="lf-pulse" />
            <circle cx={pt.x} cy={pt.y} r="5" className="lf-marker" />
          </svg>

          <p className="lf-prog">{filledCount} of {REQUIRED.length} details added</p>

          {/* Live summary of what has been typed */}
          <div className="lf-ticket">
            <TicketItem wide label="Traveller" icon={User} value={form.customerName.trim()} />
            <TicketItem wide label="Destination" icon={MapPin} value={eff.destination} />
            <div className="lf-perf" />
            <TicketItem label="Date" icon={Calendar} value={fmtDate} />
            <TicketItem label="Party" icon={Users} value={fmtParty} />
            <TicketItem wide label="Budget" icon={DollarSign} value={fmtBudget} />
          </div>
          <p className="lf-t-hint">Trip details are read from the inquiry message.</p>
        </aside>

        {/* ── Right: form ───────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="lf-card">

            {/* Customer Information */}
            <div className="lf-sec" style={{ animationDelay: '.15s' }}>
              <h2 className="lf-serif lf-sec-title">Customer Information</h2>

              <div className="lf-grid">

                <Field label="Customer Name" icon={User} error={errors.customerName}>
                  <input
                    type="text"
                    name="customerName"
                    placeholder="e.g. Priya Sharma"
                    value={form.customerName}
                    onChange={handleChange}
                    className={inputClass(errors.customerName)}
                  />
                </Field>

                <Field label="Phone" icon={Phone} error={errors.phone}>
                  <input
                    type="text"
                    name="phone"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={handleChange}
                    className={inputClass(errors.phone)}
                  />
                </Field>

                <Field label="Email" icon={Mail} error={errors.email}>
                  <input
                    type="email"
                    name="email"
                    placeholder="customer@email.com"
                    value={form.email}
                    onChange={handleChange}
                    className={inputClass(errors.email)}
                  />
                </Field>

                {/* Lead Source Dropdown */}
                <Field label="Source" icon={MessageCircle}>
                  <select
                    name="source"
                    value={form.source}
                    onChange={handleChange}
                    className={`${inputClass(false)} lf-select`}
                  >
                    <option value="">Select source</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email">Email</option>
                    <option value="Referral">Referral</option>
                    <option value="Walk In">Walk In</option>
                    <option value="Instagram">Instagram</option>
                  </select>
                </Field>

              </div>
            </div>

            {/* Inquiry Message */}
            <div className="lf-sec" style={{ animationDelay: '.25s' }}>
              <h2 className="lf-serif lf-sec-title">Inquiry Details</h2>

              <Field
                label="Inquiry Message"
                icon={MessageSquare}
                error={errors.inquiryMessage}
              >
                <textarea
                  name="inquiryMessage"
                  placeholder="e.g. Family of 4 planning a trip to Goa on 15 Dec 2026, budget ₹1.5 lakh. Prefer beach resorts and a few water sports."
                  value={form.inquiryMessage}
                  onChange={handleChange}
                  rows={4}
                  className={`${inputClass(errors.inquiryMessage)} lf-textarea`}
                />

                <p className="lf-count">
                  {form.inquiryMessage.length} characters
                </p>
              </Field>

              {showFallback && missingLabels.length > 0 && (
                <div className="lf-missing">
                  <p className="lf-missing-note">
                    Not found in the message: {missingLabels.join(', ')}. Mention {missingLabels.length > 1 ? 'them' : 'it'} above or add {missingLabels.length > 1 ? 'them' : 'it'} here.
                  </p>

                  <div className="lf-grid">
                    {missing.destination && (
                      <Field label="Destination" icon={MapPin} error={errors.destination}>
                        <input
                          type="text"
                          name="destination"
                          placeholder="e.g. Bali, Indonesia"
                          value={form.destination}
                          onChange={handleChange}
                          className={inputClass(errors.destination)}
                        />
                      </Field>
                    )}

                    {missing.budget && (
                      <Field label="Budget (₹)" icon={DollarSign} error={errors.budget}>
                        <input
                          type="number"
                          name="budget"
                          placeholder="e.g. 85000"
                          value={form.budget}
                          onChange={handleChange}
                          min="0"
                          className={inputClass(errors.budget)}
                        />
                      </Field>
                    )}

                    {missing.travelDate && (
                      <Field label="Travel Date" icon={Calendar} error={errors.travelDate}>
                        <input
                          type="date"
                          name="travelDate"
                          value={form.travelDate}
                          onChange={handleChange}
                          min={new Date().toISOString().split('T')[0]}
                          className={inputClass(errors.travelDate)}
                        />
                      </Field>
                    )}

                    {missing.groupSize && (
                      <Field label="Group Size" icon={Users} error={errors.groupSize}>
                        <input
                          type="number"
                          name="groupSize"
                          placeholder="e.g. 4"
                          value={form.groupSize}
                          onChange={handleChange}
                          min="1"
                          className={inputClass(errors.groupSize)}
                        />
                      </Field>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="lf-server">
                {serverError}
              </div>
            )}

            {/* Footer actions */}
            <div className="lf-foot">
              <span className="lf-note">Destination, date, party and budget are read from the inquiry message.</span>

              <div className="lf-actions">
                <button
                  type="button"
                  className="lf-cancel"
                  onClick={() => navigate('/leads')}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="lf-submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="lf-spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Create Lead
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>

      <style>{CSS}</style>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=DM+Sans:wght@400;500;600&display=swap');

  .lf-page {
    position: relative; isolation: isolate;
    max-width: 1080px; margin: 0 auto; padding: 12px;
    font-family: 'DM Sans', system-ui, sans-serif; color: ${T.espresso};
  }
  .lf-serif { font-family: 'Playfair Display', Georgia, serif; }

  /* ambient light: two soft gold glows drifting very slowly */
  .lf-glow { position: absolute; border-radius: 50%; filter: blur(70px); opacity: .55; }
  .lf-glow-a { width: 520px; height: 520px; top: -160px; right: -120px; background: rgba(200,169,106,0.45); animation: lf-drift-a 26s ease-in-out infinite alternate; }
  .lf-glow-b { width: 460px; height: 460px; bottom: -180px; left: 12%; background: rgba(92,15,27,0.14); animation: lf-drift-b 32s ease-in-out infinite alternate; }

  .lf-layout { display: grid; grid-template-columns: 290px 1fr; gap: 18px; align-items: start; }

  /* ── Journey panel ── */
  .lf-pass {
    position: sticky; top: 12px;
    padding: 24px 22px 22px; border-radius: 18px; color: ${T.ivory};
    background:
      radial-gradient(circle at 100% 0, rgba(200,169,106,0.20), transparent 55%),
      linear-gradient(165deg, ${T.maroon} 0%, ${T.maroonDk} 100%);
    box-shadow: 0 14px 34px rgba(59,9,18,0.28);
    animation: lf-slide-in .6s ease both;
  }
  .lf-frame {
    position: absolute; inset: 9px; border-radius: 12px; pointer-events: none;
    border: 1px solid rgba(200,169,106,0.45);
    animation: lf-frame-in 1.2s ease .2s both;
  }
  .lf-back {
    width: 34px; height: 34px; border-radius: 50%; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    background: transparent; color: ${T.gold}; border: 1.5px solid ${T.gold};
    transition: background .2s ease, color .2s ease, transform .2s ease;
  }
  .lf-back:hover { background: ${T.gold}; color: ${T.maroon}; transform: translateX(-2px); }
  .lf-title { margin: 18px 0 0; font-size: 34px; line-height: 1.05; font-weight: 600; color: ${T.ivory}; }
  .lf-sub { margin: 6px 0 0; font-size: 13px; color: rgba(245,236,217,0.7); }

  .lf-route { display: block; width: 100%; max-width: 230px; margin: 14px auto 0; overflow: visible; }
  .lf-track { fill: none; stroke: rgba(200,169,106,0.35); stroke-width: 1.5; stroke-dasharray: 3 5; animation: lf-march 4s linear infinite; }
  .lf-trail { fill: none; stroke: ${T.gold}; stroke-width: 2.2; stroke-linecap: round; }
  .lf-stop { fill: ${T.maroon}; stroke: ${T.gold}; stroke-width: 1.5; }
  .lf-place { font-family: 'Playfair Display', serif; font-style: italic; font-size: 10px; fill: rgba(245,236,217,0.75); }
  .lf-marker { fill: ${T.gold}; stroke: ${T.maroonDk}; stroke-width: 2; }
  .lf-pulse { fill: none; stroke: ${T.gold}; stroke-width: 1; opacity: .6; transform-box: fill-box; transform-origin: center; animation: lf-pulse 3s ease-out infinite; }
  .lf-prog { margin: 4px 0 14px; text-align: center; font-size: 12px; color: ${T.gold}; }

  .lf-ticket {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px 12px;
    padding: 14px 16px; border-radius: 12px; background: ${T.paper}; color: ${T.espresso};
  }
  .lf-t-item { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .lf-t-item.wide { grid-column: 1 / -1; }
  .lf-t-label { display: flex; align-items: center; gap: 5px; font-size: 11px; color: ${T.goldDk}; }
  .lf-t-val { font-size: 15px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; animation: lf-swap .35s ease both; }
  .lf-t-val.empty { color: #b9a98f; font-weight: 500; }
  .lf-t-hint { margin: 10px 2px 0; font-size: 11px; text-align: center; color: rgba(245,236,217,0.6); }
  .lf-perf { grid-column: 1 / -1; border-top: 1.5px dashed ${T.sand}; }

  /* ── Form card ── */
  .lf-card {
    background: ${T.paper}; border-radius: 18px; overflow: hidden;
    border: 1px solid rgba(200,169,106,0.5);
    box-shadow: 0 12px 32px rgba(43,24,16,0.10);
    animation: lf-enter .55s ease .08s both;
  }
  .lf-sec { padding: 22px 28px 6px; animation: lf-enter .5s ease both; }
  .lf-sec-title {
    display: flex; align-items: center; gap: 14px;
    margin: 0 0 14px; font-size: 19px; font-weight: 600; color: ${T.maroon};
  }
  .lf-sec-title::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, ${T.gold}, transparent); }
  .lf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 26px; padding-bottom: 14px; }

  .lf-label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: ${T.espresso}; }
  .lf-label svg { color: ${T.goldDk}; }

  .lf-input {
    width: 100%; box-sizing: border-box; padding: 7px 2px 8px;
    border: 0; border-bottom: 1px solid ${T.sand}; border-radius: 0;
    background-color: transparent; color: ${T.espresso};
    background-image: linear-gradient(${T.maroon}, ${T.maroon});
    background-repeat: no-repeat; background-position: 0 100%; background-size: 0 2px;
    font-family: inherit; font-size: 14px; outline: none;
    transition: background-size .35s ease, background-color .2s ease;
  }
  .lf-input::placeholder { color: #b9a98f; }
  .lf-input:focus { background-size: 100% 2px; }
  .lf-input.has-error { border-bottom-color: #a3201a; background-color: rgba(163,32,26,0.05); }
  .lf-select { cursor: pointer; }
  .lf-textarea {
    margin-top: 2px; padding: 10px 12px; border: 1px solid ${T.sand}; border-radius: 10px;
    background-color: #fffdf8; background-image: none; resize: vertical; line-height: 1.5; min-height: 84px;
    transition: border-color .2s ease, box-shadow .2s ease;
  }
  .lf-textarea:focus { border-color: ${T.maroon}; box-shadow: 0 0 0 3px rgba(92,15,27,0.10); }
  .lf-count { margin: 4px 0 0; font-size: 11px; color: ${T.muted}; }
  .lf-error { margin: 0; font-size: 12px; color: #a3201a; animation: lf-fade .2s ease both; }

  .lf-missing {
    margin: 14px 0 6px; padding: 12px 14px 2px; border-radius: 12px;
    border: 1px dashed rgba(200,169,106,0.8); background: rgba(200,169,106,0.08);
    animation: lf-enter .4s ease both;
  }
  .lf-missing-note { margin: 0 0 10px; font-size: 12px; color: ${T.muted}; }

  .lf-server {
    margin: 4px 28px 16px; padding: 10px 14px; border-radius: 8px;
    background: rgba(92,15,27,0.07); border-left: 3px solid ${T.maroon};
    font-size: 13px; color: ${T.maroon};
  }

  .lf-foot {
    display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;
    margin-top: 10px; padding: 14px 28px; background: ${T.ivory};
    border-top: 1px solid rgba(200,169,106,0.55);
  }
  .lf-note { font-size: 12px; color: ${T.muted}; }
  .lf-actions { display: flex; gap: 10px; }
  .lf-cancel {
    padding: 8px 18px; border-radius: 999px; cursor: pointer;
    background: transparent; color: ${T.espresso}; border: 1.5px solid ${T.gold};
    font-family: inherit; font-size: 13px; font-weight: 500;
    transition: background .2s ease, color .2s ease;
  }
  .lf-cancel:hover { background: ${T.gold}; color: ${T.maroonDk}; }

  .lf-submit {
    position: relative; overflow: hidden;
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 22px; border-radius: 999px; border: none; cursor: pointer;
    background: ${T.maroon}; color: ${T.ivory};
    font-family: inherit; font-size: 13px; font-weight: 600;
    transition: background .2s ease, transform .2s ease;
  }
  .lf-submit::after {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(105deg, transparent 40%, rgba(200,169,106,0.45) 50%, transparent 60%);
    transform: translateX(-120%); transition: transform .7s ease;
  }
  .lf-submit:hover:not(:disabled) { background: ${T.maroonDk}; transform: translateY(-1px); }
  .lf-submit:hover:not(:disabled)::after { transform: translateX(120%); }
  .lf-submit:disabled { opacity: .7; cursor: not-allowed; }
  .lf-spinner {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(245,236,217,0.3); border-top-color: ${T.ivory};
    animation: spin .6s linear infinite;
  }

  /* ── Success ── */
  .lf-success {
    position: relative; max-width: 480px; margin: 28px auto 0; padding: 38px 28px;
    display: flex; flex-direction: column; align-items: center; text-align: center;
    border-radius: 18px; color: ${T.ivory}; border: 1px solid rgba(200,169,106,0.5);
    background: linear-gradient(165deg, ${T.maroon} 0%, ${T.maroonDk} 100%);
    box-shadow: 0 14px 34px rgba(59,9,18,0.28);
    animation: lf-enter .5s ease both;
  }
  .lf-check { width: 60px; height: 60px; margin-bottom: 14px; }
  .lf-check-ring { fill: none; stroke: ${T.gold}; stroke-width: 2; stroke-dasharray: 164; stroke-dashoffset: 164; animation: lf-draw .7s ease .1s forwards; }
  .lf-check-tick { fill: none; stroke: ${T.gold}; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 40; stroke-dashoffset: 40; animation: lf-draw .4s ease .7s forwards; }
  .lf-success-title { margin: 0; font-size: 28px; font-weight: 600; }
  .lf-success-text { margin: 8px 0 0; max-width: 340px; font-size: 14px; line-height: 1.5; color: rgba(245,236,217,0.78); }
  .lf-g-outline {
    padding: 8px 18px; border-radius: 999px; cursor: pointer;
    background: transparent; color: ${T.ivory}; border: 1.5px solid ${T.gold};
    font-family: inherit; font-size: 13px; font-weight: 500;
    transition: background .2s ease, color .2s ease;
  }
  .lf-g-outline:hover { background: ${T.gold}; color: ${T.maroonDk}; }
  .lf-g-fill {
    padding: 8px 20px; border-radius: 999px; border: none; cursor: pointer;
    background: ${T.gold}; color: ${T.maroonDk};
    font-family: inherit; font-size: 13px; font-weight: 600;
    transition: background .2s ease, transform .2s ease;
  }
  .lf-g-fill:hover { background: #d6ba80; transform: translateY(-1px); }

  /* ── Motion ── */
  @keyframes lf-enter    { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  @keyframes lf-slide-in { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: none; } }
  @keyframes lf-frame-in { from { opacity: 0; inset: 18px; } to { opacity: 1; inset: 9px; } }
  @keyframes lf-fade     { from { opacity: 0; } to { opacity: 1; } }
  @keyframes lf-swap     { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
  @keyframes lf-march    { to { stroke-dashoffset: -16; } }
  @keyframes lf-pulse    { 0% { transform: scale(.7); opacity: .7; } 100% { transform: scale(1.9); opacity: 0; } }
  @keyframes lf-draw     { to { stroke-dashoffset: 0; } }
  @keyframes lf-drift-a  { from { transform: translate(0,0); } to { transform: translate(-90px, 60px); } }
  @keyframes lf-drift-b  { from { transform: translate(0,0); } to { transform: translate(80px, -50px); } }
  @keyframes spin        { to { transform: rotate(360deg); } }

  @media (max-width: 860px) {
    .lf-layout { grid-template-columns: 1fr; }
    .lf-pass { position: relative; top: 0; }
  }
  @media (max-width: 640px) {
    .lf-grid { grid-template-columns: 1fr; }
  }

  @media (prefers-reduced-motion: reduce) {
    .lf-pass, .lf-frame, .lf-card, .lf-sec, .lf-success, .lf-glow, .lf-track, .lf-pulse, .lf-t-val, .lf-error, .lf-missing { animation: none !important; }
    .lf-check-ring, .lf-check-tick { animation: none !important; stroke-dashoffset: 0; }
    .lf-back, .lf-submit, .lf-submit::after, .lf-input { transition: none !important; }
  }
`

export default LeadForm