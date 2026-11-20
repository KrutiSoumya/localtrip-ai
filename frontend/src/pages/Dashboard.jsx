import { useEffect, useState } from 'react'
import {
  Users, Calendar, TrendingUp, IndianRupee, Sparkles,
  ArrowRight, MapPin, X, AlertTriangle, CalendarClock, Plane, CreditCard,
  Bell, Star, FileText, ClipboardCheck, ChevronRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getLeads, getBookings } from '../services/api'

// ─────────────────────────────────────────────────────────────────────────────
// THEME  (UI only — maroon / ivory / champagne gold, Amravati-inspired)
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  maroon: '#5e1a26',
  maroonDeep: '#430f19',
  ivory: '#FBF7EE',      // page canvas (also used for inset surfaces on cards)
  offwhite: '#FFFDF9',   // warm alabaster card surface
  border: '#E5DAC8',     // consistent border for cream cards
  gold: '#cfb07a',
  goldSoft: '#ebdcb8',
  goldDeep: '#a98544',
  sand: '#e3d3ae',
  brick: '#8f2d3a',
  blush: '#efdad4',
  espresso: '#2e1d17',
  muted: '#7d6a5c',
  line: 'rgba(94, 26, 38, 0.2)',
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'Jost', system-ui, sans-serif",
}

// Quick action destinations — adjust paths here if your routes differ.
const QUICK_ACTIONS = [
  { label: 'Follow up with leads', icon: Bell, to: '/leads' },
  { label: 'Confirm bookings', icon: ClipboardCheck, to: '/bookings' },
  { label: 'Send quotations', icon: FileText, to: '/quotations' },
  { label: 'Plan itineraries', icon: Plane, to: '/itineraries' },
]

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Jost:wght@400;500;600&display=swap');
.ml-dash { font-family: ${T.body}; color: ${T.espresso}; font-variant-numeric: lining-nums tabular-nums; }
.ml-num { font-variant-numeric: lining-nums tabular-nums; }
.ml-dash h1, .ml-dash h2 { font-family: ${T.display}; font-weight: 600; letter-spacing: 0.02em; }
.ml-dash h1 { letter-spacing: 0.06em; text-transform: uppercase; font-weight: 500; }
.ml-dash button { font-family: inherit; }
.ml-dash button:focus-visible { outline: 2px solid ${T.maroon}; outline-offset: 2px; }
.ml-row:hover { background: ${T.goldSoft} !important; }
.ml-pill:hover { background: ${T.maroon} !important; color: ${T.gold} !important; }
.ml-pill:hover svg { color: ${T.gold}; }
.ml-cap { text-transform: capitalize; }
.ml-avatar { text-transform: uppercase; font-weight: 700; }

/* Header rule: thin double line, like the print-repeat divider in the inspiration */
.ml-double-rule { height: 5px; border-top: 1px solid ${T.gold}; border-bottom: 1px solid ${T.gold}; }
`

const card = {
  backgroundColor: T.offwhite,
  border: `1px solid ${T.border}`,
  borderRadius: '6px',
  padding: '22px',
}

const cardTitle = {
  margin: 0,
  fontSize: '22px',
  color: T.maroon,
}

const countPill = {
  fontSize: '11px',
  padding: '3px 10px',
  borderRadius: '999px',
  backgroundColor: T.offwhite,
  border: `1px solid ${T.gold}`,
  color: T.maroon,
  fontWeight: 500,
}

const sectionLabel = {
  margin: '0 0 8px',
  fontSize: '11px',
  fontWeight: 600,
  color: T.muted,
}

const avatarBase = {
  borderRadius: '50%',
  flexShrink: 0,
  backgroundColor: T.gold,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: T.maroon,
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS (unchanged logic)
// ─────────────────────────────────────────────────────────────────────────────

const getDateForOffset = (offset) => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + offset)
  return date
}

const getDayMeta = (offset) => {
  const date = getDateForOffset(offset)
  return {
    label: date.toLocaleDateString('en-IN', { weekday: 'short' }),
    date: date.getDate(),
    fullDate: date,
  }
}

const toArray = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.leads)) return value.leads
  if (Array.isArray(value?.bookings)) return value.bookings
  if (Array.isArray(value?.results)) return value.results
  return []
}

const getLeadName = (lead) =>
  lead?.customer_name || lead?.customerName || lead?.name || lead?.customer?.name || 'Unknown customer'

const getDestination = (lead) =>
  lead?.destination || lead?.itinerary?.lead?.destination || lead?.booking?.destination || '—'

const getLeadId = (lead) => lead?.id || lead?.leadId || lead?.lead?.id

const getLeadScore = (lead) => {
  const score = Number(lead?.priority_score ?? lead?.priorityScore ?? lead?.score ?? 0)
  return Number.isFinite(score) ? score : 0
}

const getBookingDate = (booking) => {
  const rawDate =
    booking?.travelDate || booking?.travel_date || booking?.date ||
    booking?.departureDate || booking?.departure_date
  if (!rawDate) return null
  const date = new Date(rawDate)
  if (Number.isNaN(date.getTime())) return null
  return date
}

const getBookingCustomer = (booking) =>
  booking?.customer || booking?.customer_name || booking?.lead?.customer_name ||
  booking?.lead?.name || booking?.name || 'Unknown customer'

const getBookingDestination = (booking) =>
  booking?.destination || booking?.lead?.destination ||
  booking?.itinerary?.lead?.destination || booking?.itinerary?.destination || '—'

const getBookingAmount = (booking) => {
  const amount = Number(
    booking?.totalCost ?? booking?.total_cost ?? booking?.total_price ??
      booking?.quotation?.total_price ?? booking?.quotation?.totalPrice ?? 0
  )
  return Number.isFinite(amount) ? amount : 0
}

const formatCurrency = (amount) => {
  const value = Number(amount)
  if (!Number.isFinite(value) || value <= 0) return null
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

const buildTimelineFromBookings = (bookings) => {
  const days = Array.from({ length: 7 }, (_, index) => ({
    ...getDayMeta(index),
    departures: [],
    payments: [],
    followups: [],
  }))
  const today = getDateForOffset(0)

  bookings.forEach((booking) => {
    const travelDate = getBookingDate(booking)
    if (!travelDate) return
    const difference = Math.floor((travelDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (difference < 0 || difference > 6) return
    const day = days[difference]
    day.departures.push({ name: getBookingCustomer(booking), dest: getBookingDestination(booking) })
    const amount = getBookingAmount(booking)
    if (amount > 0) {
      day.payments.push({ name: getBookingCustomer(booking), amount: formatCurrency(amount) })
    }
  })
  return days
}

const buildAlertsFromPriorityLeads = (leads) => {
  if (!leads.length) return []
  const alerts = []
  leads
    .slice()
    .sort((a, b) => getLeadScore(b) - getLeadScore(a))
    .slice(0, 5)
    .forEach((lead) => {
      const name = getLeadName(lead)
      const score = getLeadScore(lead)
      alerts.push({
        id: `lead-${getLeadId(lead) || name}`,
        type: score >= 70 ? 'overdue' : 'departure',
        message:
          score >= 70
            ? `${name} — high-priority lead requires follow-up`
            : `${name} — lead requires attention`,
      })
    })
  return alerts
}

const getPipelineStage = (lead) => {
  const status = String(lead?.status || lead?.lead_status || 'New').toLowerCase()
  if (status.includes('lost') || status.includes('reject')) return 'Lost'
  if (status.includes('confirm') || status.includes('book')) return 'Confirmed'
  if (status.includes('quot')) return 'Quoted'
  return 'New'
}

const emptyPipeline = () => ({ New: [], Quoted: [], Confirmed: [], Lost: [] })

// ─────────────────────────────────────────────────────────────────────────────
// SMALL UI PIECES
// ─────────────────────────────────────────────────────────────────────────────

function KpiCard({ title, value, subtitle, icon: Icon, loading, featured }) {
  return (
    <div
      style={{
        backgroundColor: featured ? T.maroon : T.offwhite,
        color: featured ? T.offwhite : T.espresso,
        border: featured ? `1px solid ${T.gold}` : `1px solid ${T.border}`,
        borderRadius: '6px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minHeight: '128px',
        // thin inner gold frame on the featured card, like the gold cartouche
        boxShadow: featured ? `inset 0 0 0 4px ${T.maroon}, inset 0 0 0 5px ${T.gold}` : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, opacity: featured ? 0.9 : 0.75 }}>{title}</span>
        <span
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: featured ? T.gold : T.goldSoft,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={15} color={T.maroon} />
        </span>
      </div>
      <div
        className="ml-num"
        style={{
          fontFamily: T.display,
          fontWeight: 600,
          fontSize: '38px',
          lineHeight: 1.1,
          color: featured ? T.gold : T.maroon,
          opacity: loading ? 0.4 : 1,
        }}
      >
        {value}
      </div>
      <span style={{ fontSize: '11px', opacity: featured ? 0.8 : 0.65 }}>{subtitle}</span>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

function Dashboard() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [bookings, setBookings] = useState([])
  const [dismissedIds, setDismissedIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true

    const loadDashboardData = async () => {
      setLoading(true)
      setLoadError('')

      const [leadsResult, bookingsResult] = await Promise.allSettled([getLeads(), getBookings()])
      if (!active) return

      if (leadsResult.status === 'fulfilled') {
        setLeads(toArray(leadsResult.value?.data))
      } else {
        setLoadError('Could not load leads from the server. Please check the backend and try again.')
        console.error('Dashboard leads request failed:', leadsResult.reason)
      }

      if (bookingsResult.status === 'fulfilled') {
        setBookings(toArray(bookingsResult.value?.data))
      } else {
        console.error('Dashboard bookings request failed:', bookingsResult.reason)
      }

      setLoading(false)
    }

    loadDashboardData()
    return () => {
      active = false
    }
  }, [])

  const pipeline = emptyPipeline()
  leads.forEach((lead) => {
    const stage = getPipelineStage(lead)
    pipeline[stage].push({
      id: getLeadId(lead),
      name: getLeadName(lead),
      destination: getDestination(lead),
      budget: Number(lead?.budget || 0),
      score: getLeadScore(lead),
      status: stage,
    })
  })

  const confirmedLeads = leads.filter((lead) => getPipelineStage(lead) === 'Confirmed')
  const confirmedBookings = bookings.filter((booking) => {
    const status = String(booking?.status || booking?.payment_status || '').toLowerCase()
    return status.includes('confirm') || status.includes('book')
  })
  const revenue = bookings.reduce((total, booking) => total + getBookingAmount(booking), 0)
  const conversionRate = leads.length ? Math.round((confirmedLeads.length / leads.length) * 100) : 0

  const kpiCards = [
    {
      title: 'Total Leads',
      value: loading ? '—' : leads.length,
      subtitle: `${pipeline.New.length} new leads`,
      icon: Users,
      featured: true,
    },
    {
      title: 'Confirmed Bookings',
      value: loading ? '—' : confirmedBookings.length || confirmedLeads.length,
      subtitle: 'Based on available booking and lead records',
      icon: Calendar,
    },
    {
      title: 'Conversion Rate',
      value: loading ? '—' : `${conversionRate}%`,
      subtitle: 'Confirmed leads ÷ total leads',
      icon: TrendingUp,
    },
    {
      title: 'Total Revenue',
      value: loading ? '—' : formatCurrency(revenue) || '₹0',
      subtitle: 'Sum of available booking amounts',
      icon: IndianRupee,
    },
  ]

  const priorityLeads = leads.slice().sort((a, b) => getLeadScore(b) - getLeadScore(a)).slice(0, 5)

  const aiPanel = {
    topLeads: priorityLeads.map((lead) => ({
      id: getLeadId(lead),
      name: getLeadName(lead),
      score: getLeadScore(lead),
      destination: getDestination(lead),
    })),
    pendingItineraries: [],
    pendingQuotes: [],
    // Placeholder until the backend exposes an AI acceptance-rate aggregation.
    aiAcceptanceRate: 80,
  }

  const alerts = buildAlertsFromPriorityLeads(leads)
  const visibleAlerts = alerts.filter((alert) => !dismissedIds.includes(alert.id))
  const timeline = buildTimelineFromBookings(bookings)

  const dismissAlert = (id) => setDismissedIds((previous) => [...previous, id])

  const pipelineMeta = {
    New: { color: T.maroon, bg: T.offwhite, accent: T.border, count: pipeline.New.length },
    Quoted: { color: '#7a5c24', bg: T.goldSoft, accent: '#d4b872', count: pipeline.Quoted.length },
    Confirmed: { color: T.offwhite, bg: T.sand, accent: T.maroon, count: pipeline.Confirmed.length, solid: true },
    Lost: { color: T.brick, bg: T.blush, accent: '#d9aaa3', count: pipeline.Lost.length },
  }

  // Short, scannable snippet for each lead mini-card: destination and/or budget.
  const leadSnippet = (lead) => {
    const parts = []
    if (lead.destination && lead.destination !== '—') parts.push(lead.destination)
    const budget = formatCurrency(lead.budget)
    if (budget) parts.push(budget)
    return parts.length ? parts.join(' · ') : 'No details yet'
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="ml-dash"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        position: 'relative',
        isolation: 'isolate',
        padding: '16px',
      }}
    >
      <style>{FONT_CSS}</style>

      {/* Full-viewport canvas background */}
      <div
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none', backgroundColor: T.ivory }}
      />

      {/* HEADER */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            paddingBottom: '14px',
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: '38px', lineHeight: 1.05, color: T.maroon }}>Dashboard</h1>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: T.muted }}>
              Here's what's happening with your agency today.
            </p>
            {loadError && (
              <p style={{ margin: '8px 0 0', color: T.brick, fontSize: '12px' }}>{loadError}</p>
            )}
          </div>
          <button
            className="ml-pill"
            onClick={() => navigate('/leads')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '999px',
              border: `1px solid ${T.maroon}`,
              backgroundColor: 'transparent',
              color: T.maroon,
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            View all leads
            <ArrowRight size={14} />
          </button>
        </div>
        <div className="ml-double-rule" />
      </div>

      {/* ALERTS */}
      {visibleAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {visibleAlerts.map((alert) => {
            const overdue = alert.type === 'overdue'
            return (
              <div
                key={alert.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 16px',
                  borderRadius: '999px',
                  backgroundColor: overdue ? T.gold : T.offwhite,
                  border: `1px solid ${overdue ? T.goldDeep : T.border}`,
                }}
              >
                {overdue ? (
                  <AlertTriangle size={15} color={T.maroon} style={{ flexShrink: 0 }} />
                ) : (
                  <CalendarClock size={15} color={T.maroon} style={{ flexShrink: 0 }} />
                )}
                <p style={{ margin: 0, fontSize: '13px', flex: 1, color: T.espresso }}>{alert.message}</p>
                <button
                  aria-label="Dismiss alert"
                  onClick={() => dismissAlert(alert.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    borderRadius: '4px',
                    display: 'flex',
                  }}
                >
                  <X size={14} color={T.maroon} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* QUICK ACTIONS (flat, static) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          padding: '12px 16px',
          backgroundColor: T.offwhite,
          border: `1px solid ${T.border}`,
          borderRadius: '6px',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: T.maroon, marginRight: '4px' }}>
          Quick actions
        </span>
        {QUICK_ACTIONS.map(({ label, icon: Icon, to }) => (
          <button
            key={label}
            className="ml-pill"
            onClick={() => navigate(to)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '999px',
              border: `1px solid ${T.maroon}`,
              backgroundColor: 'transparent',
              color: T.maroon,
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* KPI CARDS */}
      <div
        className="kpi-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}
      >
        {kpiCards.map((kpi) => (
          <KpiCard key={kpi.title} loading={loading} {...kpi} />
        ))}
      </div>

      {/* MAIN + AI PANEL */}
      <div
        className="main-with-panel"
        style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}
      >
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* LEAD PIPELINE */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <MapPin size={18} color={T.goldDeep} />
              <h2 style={cardTitle}>Lead Pipeline</h2>
              <button
                className="ml-pill"
                onClick={() => navigate('/leads')}
                style={{
                  marginLeft: 'auto',
                  fontSize: '12px',
                  color: T.maroon,
                  background: 'none',
                  border: `1px solid ${T.maroon}`,
                  borderRadius: '999px',
                  padding: '5px 12px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                View all
                <ArrowRight size={12} />
              </button>
            </div>

            <div
              className="four-col"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}
            >
              {Object.entries(pipeline).map(([stage, stageLeads]) => {
                const meta = pipelineMeta[stage]
                return (
                  <div
                    key={stage}
                    style={{
                      borderRadius: '6px',
                      border: `1px solid ${meta.accent}`,
                      backgroundColor: meta.bg,
                      overflow: 'hidden',
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        padding: '9px 12px',
                        backgroundColor: meta.solid ? T.maroon : 'transparent',
                        borderBottom: `1px solid ${meta.accent}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 600, color: meta.solid ? T.gold : meta.color }}>{stage}</span>
                      <span
                        className="ml-num"
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '1px 8px',
                          borderRadius: '999px',
                          backgroundColor: T.offwhite,
                          color: meta.solid ? T.maroon : meta.color,
                        }}
                      >
                        {meta.count}
                      </span>
                    </div>

                    <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {stageLeads.map((lead) => (
                        <button
                          key={lead.id}
                          className="ml-row"
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: `1px solid ${T.border}`,
                            backgroundColor: T.offwhite,
                            color: T.espresso,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            minWidth: 0,
                          }}
                        >
                          <div
                            className="ml-avatar"
                            style={{ ...avatarBase, width: '24px', height: '24px', fontSize: '10px' }}
                          >
                            {lead.name.charAt(0)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              className="ml-cap"
                              style={{
                                margin: 0,
                                fontSize: '12px',
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {lead.name}
                            </p>
                            <p
                              className="ml-num"
                              style={{
                                margin: '1px 0 0',
                                fontSize: '10.5px',
                                color: T.muted,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {leadSnippet(lead)}
                            </p>
                          </div>
                        </button>
                      ))}

                      {meta.count > stageLeads.length && (
                        <button
                          onClick={() => navigate('/leads')}
                          style={{
                            width: '100%',
                            textAlign: 'center',
                            padding: '4px',
                            border: 'none',
                            background: 'none',
                            fontSize: '11px',
                            color: T.muted,
                            cursor: 'pointer',
                          }}
                        >
                          +{meta.count - stageLeads.length} more
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 7-DAY TIMELINE */}
          <div style={card}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
                flexWrap: 'wrap',
              }}
            >
              <Calendar size={18} color={T.goldDeep} />
              <h2 style={cardTitle}>7-Day View</h2>

              <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto', alignItems: 'center' }}>
                {[
                  { color: T.sand, label: 'Departures' },
                  { color: T.blush, label: 'Payments' },
                  { color: T.gold, label: 'Follow-ups' },
                ].map(({ color, label }) => (
                  <span
                    key={label}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: T.muted }}
                  >
                    <span
                      style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        backgroundColor: color,
                        border: `1px solid ${T.line}`,
                        display: 'inline-block',
                      }}
                    />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <div
                className="timeline-grid"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', minWidth: '560px' }}
              >
                {timeline.map((day, index) => {
                  const isToday = index === 0
                  const empty = !day.departures?.length && !day.payments?.length && !day.followups?.length

                  return (
                    <div
                      key={day.fullDate?.toISOString?.() || index}
                      style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
                    >
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '7px 4px',
                          borderRadius: '999px',
                          backgroundColor: isToday ? T.maroon : T.ivory,
                          border: isToday ? `1px solid ${T.maroon}` : `1px solid ${T.border}`,
                        }}
                      >
                        <p style={{ margin: 0, fontSize: '10px', fontWeight: 500, color: isToday ? T.gold : T.muted }}>
                          {day.label}
                        </p>
                        <p
                          className="ml-num"
                          style={{
                            margin: '1px 0 0',
                            fontFamily: T.display,
                            fontWeight: 600,
                            fontSize: '17px',
                            color: isToday ? T.offwhite : T.maroon,
                          }}
                        >
                          {day.date}
                        </p>
                      </div>

                      {day.departures?.map((departure, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '7px 8px',
                            borderRadius: '6px',
                            backgroundColor: T.sand,
                            border: `1px solid ${T.maroon}33`,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                            <Plane size={9} color={T.maroon} />
                            <span style={{ fontSize: '9px', fontWeight: 600, color: T.maroon }}>Departs</span>
                          </div>
                          <p className="ml-cap" style={{ margin: 0, fontSize: '10px', color: T.espresso, fontWeight: 500, lineHeight: 1.3 }}>
                            {departure.name}
                          </p>
                          {departure.dest && (
                            <p style={{ margin: '1px 0 0', fontSize: '9px', color: T.maroonDeep, opacity: 0.75 }}>
                              {departure.dest}
                            </p>
                          )}
                        </div>
                      ))}

                      {day.payments?.map((payment, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '7px 8px',
                            borderRadius: '6px',
                            backgroundColor: T.blush,
                            border: '1px solid #d9aaa3',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                            <CreditCard size={9} color={T.brick} />
                            <span style={{ fontSize: '9px', fontWeight: 600, color: T.brick }}>Payment</span>
                          </div>
                          <p className="ml-cap" style={{ margin: 0, fontSize: '10px', color: '#5a1c24', fontWeight: 500, lineHeight: 1.3 }}>
                            {payment.name}
                          </p>
                          {payment.amount && (
                            <p className="ml-num" style={{ margin: '1px 0 0', fontSize: '9px', color: T.brick }}>{payment.amount}</p>
                          )}
                        </div>
                      ))}

                      {day.followups?.map((followup, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '7px 8px',
                            borderRadius: '6px',
                            backgroundColor: T.gold,
                            border: `1px solid ${T.goldDeep}`,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                            <Bell size={9} color="#6b4f1c" />
                            <span style={{ fontSize: '9px', fontWeight: 600, color: '#6b4f1c' }}>Follow-up</span>
                          </div>
                          <p className="ml-cap" style={{ margin: 0, fontSize: '10px', color: '#4e3a12', fontWeight: 500, lineHeight: 1.3 }}>
                            {followup.name}
                          </p>
                        </div>
                      ))}

                      {empty && (
                        <div
                          style={{
                            marginTop: '2px',
                            paddingTop: '8px',
                            borderTop: `1px solid ${T.border}`,
                            textAlign: 'center',
                          }}
                        >
                          <p style={{ margin: 0, fontSize: '10px', color: T.muted, opacity: 0.8 }}>No events</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: AI PANEL */}
        {aiPanel && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* AI PERFORMANCE */}
            <div
              style={{
                ...card,
                backgroundColor: T.maroon,
                border: `1px solid ${T.gold}`,
                color: T.offwhite,
                boxShadow: `inset 0 0 0 4px ${T.maroon}, inset 0 0 0 5px ${T.gold}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Sparkles size={17} color={T.gold} />
                <h2 style={{ ...cardTitle, color: T.offwhite }}>AI Performance</h2>
              </div>

              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    border: `6px solid ${aiPanel.aiAcceptanceRate >= 70 ? T.gold : T.blush}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <span className="ml-num" style={{ fontFamily: T.display, fontWeight: 600, fontSize: '26px', color: T.offwhite }}>
                    {aiPanel.aiAcceptanceRate}%
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>AI Acceptance Rate</p>
                <p style={{ margin: '4px 0 0', fontSize: '11px', opacity: 0.75, lineHeight: 1.5 }}>
                  Live metric will appear once AI feedback aggregation is available.
                </p>
              </div>

              <div
                style={{
                  height: '6px',
                  backgroundColor: 'rgba(255, 253, 249, 0.22)',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  marginTop: '14px',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: '999px',
                    backgroundColor: aiPanel.aiAcceptanceRate >= 70 ? T.gold : T.blush,
                    width: `${aiPanel.aiAcceptanceRate}%`,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>

            {/* TOP SCORED LEADS */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Star size={16} color={T.goldDeep} />
                <h2 style={cardTitle}>Top Scored Leads</h2>
              </div>

              {aiPanel.topLeads.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {aiPanel.topLeads.map((lead) => (
                    <button
                      key={lead.id || lead.name}
                      className="ml-row"
                      onClick={() => {
                        if (lead.id) navigate(`/leads/${lead.id}`)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px',
                        borderRadius: '6px',
                        border: `1px solid ${T.border}`,
                        backgroundColor: T.offwhite,
                        cursor: lead.id ? 'pointer' : 'default',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <div
                        className="ml-avatar"
                        style={{ ...avatarBase, width: '32px', height: '32px', fontSize: '12px' }}
                      >
                        {lead.name?.charAt(0) || '?'}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          className="ml-cap"
                          style={{
                            margin: 0,
                            fontSize: '13px',
                            fontWeight: 500,
                            color: T.espresso,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {lead.name}
                        </p>
                        <p style={{ margin: '1px 0 0', fontSize: '11px', color: T.muted }}>{lead.destination}</p>
                      </div>

                      <div
                        className="ml-num"
                        style={{
                          padding: '3px 10px',
                          borderRadius: '999px',
                          backgroundColor: lead.score >= 90 ? T.maroon : T.gold,
                          color: lead.score >= 90 ? T.gold : T.maroon,
                          fontSize: '12px',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {lead.score}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '16px 8px', textAlign: 'center', color: T.muted, fontSize: '12px' }}>
                  No priority leads available.
                </div>
              )}
            </div>

            {/* PENDING REVIEWS */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <ClipboardCheck size={16} color={T.goldDeep} />
                <h2 style={cardTitle}>Pending Reviews</h2>
                <span className="ml-num" style={{ ...countPill, marginLeft: 'auto' }}>
                  {aiPanel.pendingItineraries.length + aiPanel.pendingQuotes.length}
                </span>
              </div>

              <p style={sectionLabel}>Itineraries</p>

              {aiPanel.pendingItineraries.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                  {aiPanel.pendingItineraries.map((itinerary) => (
                    <div
                      key={itinerary.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: T.offwhite,
                        border: `1px solid ${T.border}`,
                      }}
                    >
                      <MapPin size={12} color={T.maroon} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="ml-cap" style={{ margin: 0, fontSize: '12px', fontWeight: 500, color: T.espresso }}>
                          {itinerary.lead}
                        </p>
                        <p style={{ margin: 0, fontSize: '11px', color: T.muted }}>{itinerary.destination}</p>
                      </div>
                      <ChevronRight size={13} color={T.muted} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '4px 0 14px', fontSize: '12px', color: T.muted }}>
                  No pending itinerary reviews.
                </div>
              )}

              <p style={sectionLabel}>Quotations</p>

              {aiPanel.pendingQuotes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {aiPanel.pendingQuotes.map((quotation) => (
                    <div
                      key={quotation.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: T.offwhite,
                        border: `1px solid ${T.border}`,
                      }}
                    >
                      <FileText size={12} color={T.maroon} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="ml-cap" style={{ margin: 0, fontSize: '12px', fontWeight: 500, color: T.espresso }}>
                          {quotation.lead}
                        </p>
                        <p className="ml-num" style={{ margin: 0, fontSize: '11px', color: T.muted }}>{quotation.amount}</p>
                      </div>
                      <ChevronRight size={13} color={T.muted} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '4px 0 0', fontSize: '12px', color: T.muted }}>
                  No pending quotation reviews.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard