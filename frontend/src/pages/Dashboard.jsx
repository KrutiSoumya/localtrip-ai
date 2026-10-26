import { useState, useEffect } from 'react'
import {
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  MapPin,
  X,
  AlertTriangle,
  CalendarClock,
  Plane,
  CreditCard,
  Bell,
  Star,
  FileText,
  ClipboardCheck,
  ChevronRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import MetricCard from '../components/MetricCard'
import useAnalyticsSummary from '../hooks/useAnalyticsSummary'
import api from '../services/api'

// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK DATA
// ─────────────────────────────────────────────────────────────────────────────

const mockAlerts = [
  {
    id: 'mock-alert-1',
    type: 'overdue',
    message: 'Follow-up requires attention',
  },
  {
    id: 'mock-alert-2',
    type: 'departure',
    message: 'Upcoming departure requires attention',
  },
]

const mockPipeline = {
  New: [
    { id: 4, name: 'Arjun Verma' },
    { id: 7, name: 'Vikram Singh' },
    { id: 10, name: 'Meera Pillai' },
  ],

  Quoted: [
    { id: 1, name: 'Priya Sharma' },
    { id: 6, name: 'Neha Joshi' },
    { id: 11, name: 'Ravi Tiwari' },
  ],

  Confirmed: [
    { id: 5, name: 'Kapoor Family' },
    { id: 8, name: 'Ananya Iyer' },
    { id: 2, name: 'Rahul Mehta' },
  ],

  Lost: [
    { id: 12, name: 'Pooja Agarwal' },
    { id: 9, name: 'Deepak Nair' },
  ],
}

const pipelineMeta = {
  New: {
    color: '#6b7280',
    bg: '#f3f4f6',
    accent: '#e5e7eb',
    count: 34,
  },

  Quoted: {
    color: '#d97706',
    bg: '#fffbeb',
    accent: '#fde68a',
    count: 22,
  },

  Confirmed: {
    color: '#0f766e',
    bg: '#f0fdfa',
    accent: '#99f6e4',
    count: 14,
  },

  Lost: {
    color: '#dc2626',
    bg: '#fef2f2',
    accent: '#fecaca',
    count: 8,
  },
}

const getDateForOffset = (offset) => {
  const date = new Date()

  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + offset)

  return date
}

const getDayMeta = (offset) => {
  const date = getDateForOffset(offset)

  return {
    label: date.toLocaleDateString('en-IN', {
      weekday: 'short',
    }),

    date: date.getDate(),

    fullDate: date,
  }
}

const mockTimeline = Array.from({ length: 7 }, (_, index) => {
  const day = getDayMeta(index)

  return {
    ...day,
    departures: [],
    payments: [],
    followups: [],
  }
})

const priorityTasks = [
  {
    id: 1,
    task: 'Review high-priority leads and follow up with customers',
    due: 'Today',
    urgent: true,
  },

  {
    id: 2,
    task: 'Confirm upcoming travel bookings and payment status',
    due: 'Today',
    urgent: true,
  },

  {
    id: 3,
    task: 'Prepare itineraries for active travel enquiries',
    due: 'Tomorrow',
    urgent: false,
  },

  {
    id: 4,
    task: 'Review pending quotations',
    due: 'Tomorrow',
    urgent: false,
  },

  {
    id: 5,
    task: 'Update customer follow-up status',
    due: 'This week',
    urgent: false,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value
  }

  if (Array.isArray(value?.data)) {
    return value.data
  }

  if (Array.isArray(value?.leads)) {
    return value.leads
  }

  if (Array.isArray(value?.bookings)) {
    return value.bookings
  }

  if (Array.isArray(value?.results)) {
    return value.results
  }

  return []
}

const getLeadName = (lead) => {
  return (
    lead?.customer_name ||
    lead?.customerName ||
    lead?.name ||
    lead?.customer?.name ||
    'Unknown customer'
  )
}

const getDestination = (lead) => {
  return (
    lead?.destination ||
    lead?.itinerary?.lead?.destination ||
    lead?.booking?.destination ||
    '—'
  )
}

const getLeadId = (lead) => {
  return lead?.id || lead?.leadId || lead?.lead?.id
}

const getLeadScore = (lead) => {
  const score = Number(
    lead?.priority_score ??
      lead?.priorityScore ??
      lead?.score ??
      0
  )

  return Number.isFinite(score) ? score : 0
}

const getBookingDate = (booking) => {
  const rawDate =
    booking?.travelDate ||
    booking?.travel_date ||
    booking?.date ||
    booking?.departureDate ||
    booking?.departure_date

  if (!rawDate) {
    return null
  }

  const date = new Date(rawDate)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

const getBookingCustomer = (booking) => {
  return (
    booking?.customer ||
    booking?.customer_name ||
    booking?.lead?.customer_name ||
    booking?.lead?.name ||
    booking?.name ||
    'Unknown customer'
  )
}

const getBookingDestination = (booking) => {
  return (
    booking?.destination ||
    booking?.lead?.destination ||
    booking?.itinerary?.lead?.destination ||
    booking?.itinerary?.destination ||
    '—'
  )
}

const getBookingAmount = (booking) => {
  const amount = Number(
    booking?.totalCost ??
      booking?.total_cost ??
      booking?.total_price ??
      booking?.quotation?.total_price ??
      booking?.quotation?.totalPrice ??
      0
  )

  return Number.isFinite(amount) ? amount : 0
}

const formatCurrency = (amount) => {
  const value = Number(amount)

  if (!Number.isFinite(value) || value <= 0) {
    return null
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

const sameCalendarDay = (dateA, dateB) => {
  if (!dateA || !dateB) {
    return false
  }

  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  )
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

    if (!travelDate) {
      return
    }

    const difference =
      Math.floor(
        (
          travelDate.getTime() -
          today.getTime()
        ) /
          (1000 * 60 * 60 * 24)
      )

    if (difference < 0 || difference > 6) {
      return
    }

    const day = days[difference]

    day.departures.push({
      name: getBookingCustomer(booking),
      dest: getBookingDestination(booking),
    })

    const amount = getBookingAmount(booking)

    if (amount > 0) {
      day.payments.push({
        name: getBookingCustomer(booking),
        amount: formatCurrency(amount),
      })
    }
  })

  return days
}

const buildAlertsFromPriorityLeads = (leads) => {
  if (!leads.length) {
    return mockAlerts
  }

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

  return alerts.length ? alerts : mockAlerts
}

const buildAiPanel = (priorityLeads) => {
  const sortedLeads = priorityLeads
    .slice()
    .sort(
      (a, b) =>
        getLeadScore(b) -
        getLeadScore(a)
    )

  const topLeads = sortedLeads
    .slice(0, 5)
    .map((lead) => ({
      id: getLeadId(lead),
      name: getLeadName(lead),
      score: getLeadScore(lead),
      destination: getDestination(lead),
    }))

  return {
    topLeads,

    pendingItineraries: [],

    pendingQuotes: [],

    // This remains a dashboard placeholder until the backend
    // exposes a real AI acceptance-rate aggregation.
    aiAcceptanceRate: 0,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

function Dashboard() {
  const navigate = useNavigate()

  const {
    data,
    loading,
  } = useAnalyticsSummary()

  const [alerts, setAlerts] = useState([])
  const [dismissedIds, setDismissedIds] = useState([])
  const [timeline, setTimeline] = useState([])
  const [aiPanel, setAiPanel] = useState(null)

  // ───────────────────────────────────────────────────────────────────────────
  // FETCH DASHBOARD DATA
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true

    const fetchDashboardData = async () => {
      // ────────────────────────────────────────────────────────────────────────
      // PRIORITY LEADS
      // ────────────────────────────────────────────────────────────────────────

      let priorityLeads = []

      try {
        const response = await api.get('/leads/priority')

        priorityLeads = toArray(response.data)

        if (!mounted) {
          return
        }

        setAlerts(
          buildAlertsFromPriorityLeads(
            priorityLeads
          )
        )

        setAiPanel(
          buildAiPanel(
            priorityLeads
          )
        )
      } catch (error) {
        console.error(
          'Failed to load priority leads:',
          error
        )

        if (!mounted) {
          return
        }

        setAlerts(mockAlerts)

        setAiPanel(
          buildAiPanel([])
        )
      }

      // ────────────────────────────────────────────────────────────────────────
      // UPCOMING BOOKINGS
      //
      // IMPORTANT:
      // We only call the backend endpoint that actually exists:
      //
      // GET /api/bookings/upcoming
      //
      // We do NOT call /leads/followups because that endpoint does not exist.
      // ────────────────────────────────────────────────────────────────────────

      try {
        const response = await api.get(
          '/bookings/upcoming'
        )

        const bookings = toArray(response.data)

        if (!mounted) {
          return
        }

        const realTimeline =
          buildTimelineFromBookings(
            bookings
          )

        setTimeline(
          realTimeline
        )
      } catch (error) {
        console.error(
          'Failed to load upcoming bookings:',
          error
        )

        if (!mounted) {
          return
        }

        setTimeline(
          mockTimeline
        )
      }
    }

    fetchDashboardData()

    return () => {
      mounted = false
    }
  }, [])

  // ───────────────────────────────────────────────────────────────────────────
  // ALERTS
  // ───────────────────────────────────────────────────────────────────────────

  const visibleAlerts = alerts.filter(
    (alert) =>
      !dismissedIds.includes(
        alert.id
      )
  )

  const dismissAlert = (id) => {
    setDismissedIds((previous) => [
      ...previous,
      id,
    ])
  }

  // ───────────────────────────────────────────────────────────────────────────
  // KPI CARDS
  // ───────────────────────────────────────────────────────────────────────────

  const kpiCards = [
    {
      title: 'Total Leads',
      value: data?.totalLeads,
      subtitle: data?.leadsTrend,
      color: '#0f766e',
      icon: Users,
    },

    {
      title: 'Confirmed Bookings',
      value: data?.confirmedBookings,
      subtitle: data?.bookingsTrend,
      color: '#2563eb',
      icon: Calendar,
    },

    {
      title: 'Conversion Rate',
      value: data?.conversionRate,
      subtitle: data?.conversionTrend,
      color: '#d97706',
      icon: TrendingUp,
    },

    {
      title: 'Total Revenue',
      value: data?.totalRevenue,
      subtitle: data?.revenueTrend,
      color: '#7c3aed',
      icon: DollarSign,
    },
  ]

  // ───────────────────────────────────────────────────────────────────────────
  // PIPELINE
  //
  // The current backend does not expose a dedicated pipeline endpoint.
  // Therefore the existing pipeline visualization is retained as fallback UI.
  // ───────────────────────────────────────────────────────────────────────────

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* ─────────────────────────────────────────────────────────────────────
          HEADER
      ────────────────────────────────────────────────────────────────────── */}

      <div>
        <h1
          style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: '700',
            color: '#111827',
          }}
        >
          Dashboard
        </h1>

        <p
          style={{
            margin: '4px 0 0',
            fontSize: '14px',
            color: '#9ca3af',
          }}
        >
          Here's what's happening with your agency today.
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          ALERTS
      ────────────────────────────────────────────────────────────────────── */}

      {visibleAlerts.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {visibleAlerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor:
                  alert.type === 'overdue'
                    ? '#fff7ed'
                    : '#eff6ff',
                border:
                  alert.type === 'overdue'
                    ? '1px solid #fed7aa'
                    : '1px solid #bfdbfe',
              }}
            >
              {alert.type === 'overdue' ? (
                <AlertTriangle
                  size={15}
                  color="#d97706"
                  style={{
                    flexShrink: 0,
                  }}
                />
              ) : (
                <CalendarClock
                  size={15}
                  color="#2563eb"
                  style={{
                    flexShrink: 0,
                  }}
                />
              )}

              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  flex: 1,
                  color: '#374151',
                }}
              >
                <span
                  style={{
                    fontWeight: '600',
                  }}
                >
                  {alert.type === 'overdue'
                    ? '⚠️'
                    : '📅'}
                </span>{' '}
                {alert.message}
              </p>

              <button
                onClick={() =>
                  dismissAlert(alert.id)
                }
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  borderRadius: '4px',
                  display: 'flex',
                }}
              >
                <X
                  size={14}
                  color="#9ca3af"
                />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          KPI CARDS
      ────────────────────────────────────────────────────────────────────── */}

      <div
        className="kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, 1fr)',
          gap: '16px',
        }}
      >
        {kpiCards.map((card) => (
          <MetricCard
            key={card.title}
            loading={loading}
            {...card}
          />
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          MAIN CONTENT + AI PANEL
      ────────────────────────────────────────────────────────────────────── */}

      <div
        className="main-with-panel"
        style={{
          display: 'grid',
          gridTemplateColumns:
            '1fr 320px',
          gap: '16px',
          alignItems: 'start',
        }}
      >
        {/* ═══════════════════════════════════════════════════════════════════
            LEFT COLUMN
        ═══════════════════════════════════════════════════════════════════ */}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* ─────────────────────────────────────────────────────────────────
              PRIORITY TASKS
          ──────────────────────────────────────────────────────────────── */}

          <div
            style={{
              backgroundColor: '#fff',
              border: '1px solid #f3f4f6',
              borderRadius: '14px',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2
                  size={17}
                  color="#0f766e"
                />

                <h2
                  style={{
                    margin: 0,
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#111827',
                  }}
                >
                  Priority Tasks
                </h2>
              </div>

              <span
                style={{
                  fontSize: '12px',
                  backgroundColor:
                    '#fef2f2',
                  color: '#dc2626',
                  padding: '3px 10px',
                  borderRadius:
                    '999px',
                  fontWeight: '500',
                }}
              >
                {
                  priorityTasks.filter(
                    (task) =>
                      task.urgent
                  ).length
                }{' '}
                urgent
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {priorityTasks.map(
                ({
                  id,
                  task,
                  due,
                  urgent,
                }) => (
                  <div
                    key={id}
                    style={{
                      display: 'flex',
                      alignItems:
                        'flex-start',
                      gap: '10px',
                      padding:
                        '10px 12px',
                      borderRadius:
                        '10px',
                      backgroundColor:
                        urgent
                          ? '#fff7ed'
                          : '#f9fafb',
                      border:
                        `1px solid ${
                          urgent
                            ? '#fed7aa'
                            : '#f3f4f6'
                        }`,
                    }}
                  >
                    <Clock
                      size={14}
                      color={
                        urgent
                          ? '#d97706'
                          : '#9ca3af'
                      }
                      style={{
                        marginTop: '2px',
                        flexShrink: 0,
                      }}
                    />

                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: '13px',
                          color:
                            '#374151',
                          lineHeight:
                            '1.4',
                        }}
                      >
                        {task}
                      </p>

                      <p
                        style={{
                          margin:
                            '3px 0 0',
                          fontSize:
                            '11px',
                          color:
                            urgent
                              ? '#d97706'
                              : '#9ca3af',
                        }}
                      >
                        Due: {due}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              LEAD PIPELINE
          ──────────────────────────────────────────────────────────────── */}

          <div
            style={{
              backgroundColor: '#fff',
              border: '1px solid #f3f4f6',
              borderRadius: '14px',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '18px',
              }}
            >
              <MapPin
                size={17}
                color="#0f766e"
              />

              <h2
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#111827',
                }}
              >
                Lead Pipeline
              </h2>

              <button
                onClick={() =>
                  navigate('/leads')
                }
                style={{
                  marginLeft: 'auto',
                  fontSize: '12px',
                  color: '#0f766e',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: '4px',
                }}
              >
                View all
                <ArrowRight size={12} />
              </button>
            </div>

            <div
              className="four-col"
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(4, 1fr)',
                gap: '10px',
              }}
            >
              {Object.entries(
                mockPipeline
              ).map(
                ([stage, leads]) => {
                  const meta =
                    pipelineMeta[
                      stage
                    ]

                  return (
                    <div
                      key={stage}
                      style={{
                        borderRadius:
                          '12px',
                        border:
                          `1px solid ${meta.accent}`,
                        backgroundColor:
                          meta.bg,
                        overflow:
                          'hidden',
                      }}
                    >
                      <div
                        style={{
                          padding:
                            '8px 12px',
                          borderBottom:
                            `1px solid ${meta.accent}`,
                          display:
                            'flex',
                          justifyContent:
                            'space-between',
                          alignItems:
                            'center',
                        }}
                      >
                        <span
                          style={{
                            fontSize:
                              '12px',
                            fontWeight:
                              '600',
                            color:
                              meta.color,
                          }}
                        >
                          {stage}
                        </span>

                        <span
                          style={{
                            fontSize:
                              '11px',
                            fontWeight:
                              '700',
                            padding:
                              '1px 7px',
                            borderRadius:
                              '999px',
                            backgroundColor:
                              '#fff',
                            color:
                              meta.color,
                          }}
                        >
                          {meta.count}
                        </span>
                      </div>

                      <div
                        style={{
                          padding:
                            '8px 6px',
                          display:
                            'flex',
                          flexDirection:
                            'column',
                          gap: '4px',
                        }}
                      >
                        {leads.map(
                          (lead) => (
                            <button
                              key={
                                lead.id
                              }
                              onClick={() =>
                                navigate(
                                  `/leads/${lead.id}`
                                )
                              }
                              style={{
                                width:
                                  '100%',
                                textAlign:
                                  'left',
                                padding:
                                  '6px 8px',
                                borderRadius:
                                  '7px',
                                border:
                                  'none',
                                backgroundColor:
                                  '#fff',
                                fontSize:
                                  '12px',
                                color:
                                  '#374151',
                                cursor:
                                  'pointer',
                                display:
                                  'flex',
                                alignItems:
                                  'center',
                                gap: '6px',
                              }}
                            >
                              <div
                                style={{
                                  width:
                                    '20px',
                                  height:
                                    '20px',
                                  borderRadius:
                                    '50%',
                                  flexShrink:
                                    0,
                                  backgroundColor:
                                    meta.bg,
                                  border:
                                    `1px solid ${meta.accent}`,
                                  display:
                                    'flex',
                                  alignItems:
                                    'center',
                                  justifyContent:
                                    'center',
                                  fontSize:
                                    '9px',
                                  fontWeight:
                                    '700',
                                  color:
                                    meta.color,
                                }}
                              >
                                {lead.name.charAt(
                                  0
                                )}
                              </div>

                              <span
                                style={{
                                  flex:
                                    1,
                                  overflow:
                                    'hidden',
                                  textOverflow:
                                    'ellipsis',
                                  whiteSpace:
                                    'nowrap',
                                }}
                              >
                                {
                                  lead.name
                                }
                              </span>
                            </button>
                          )
                        )}

                        {meta.count >
                          leads.length && (
                          <button
                            onClick={() =>
                              navigate(
                                '/leads'
                              )
                            }
                            style={{
                              width:
                                '100%',
                              textAlign:
                                'center',
                              padding:
                                '4px',
                              border:
                                'none',
                              background:
                                'none',
                              fontSize:
                                '11px',
                              color:
                                '#9ca3af',
                              cursor:
                                'pointer',
                            }}
                          >
                            +
                            {meta.count -
                              leads.length}{' '}
                            more
                          </button>
                        )}
                      </div>
                    </div>
                  )
                }
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              7-DAY TIMELINE
          ──────────────────────────────────────────────────────────────── */}

          <div
            style={{
              backgroundColor: '#fff',
              border: '1px solid #f3f4f6',
              borderRadius: '14px',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <Calendar
                size={17}
                color="#2563eb"
              />

              <h2
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#111827',
                }}
              >
                7-Day View
              </h2>

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginLeft: 'auto',
                  alignItems:
                    'center',
                }}
              >
                {[
                  {
                    color: '#bfdbfe',
                    label:
                      'Departures',
                  },
                  {
                    color: '#fecaca',
                    label: 'Payments',
                  },
                  {
                    color: '#fde68a',
                    label:
                      'Follow-ups',
                  },
                ].map(
                  ({
                    color,
                    label,
                  }) => (
                    <span
                      key={label}
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap: '4px',
                        fontSize:
                          '11px',
                        color:
                          '#6b7280',
                      }}
                    >
                      <span
                        style={{
                          width:
                            '8px',
                          height:
                            '8px',
                          borderRadius:
                            '3px',
                          backgroundColor:
                            color,
                          display:
                            'inline-block',
                        }}
                      />

                      {label}
                    </span>
                  )
                )}
              </div>
            </div>

            <div
              style={{
                overflowX:
                  'auto',
              }}
            >
              <div
                className="timeline-grid"
                style={{
                  display:
                    'grid',
                  gridTemplateColumns:
                    'repeat(7, 1fr)',
                  gap: '8px',
                  minWidth:
                    '560px',
                }}
              >
                {(
                  timeline.length
                    ? timeline
                    : mockTimeline
                ).map(
                  (day, index) => {
                    const isToday =
                      index === 0

                    return (
                      <div
                        key={
                          day.fullDate
                            ?.toISOString?.() ||
                          index
                        }
                        style={{
                          display:
                            'flex',
                          flexDirection:
                            'column',
                          gap: '6px',
                        }}
                      >
                        {/* Day header */}

                        <div
                          style={{
                            textAlign:
                              'center',
                            padding:
                              '6px 4px',
                            borderRadius:
                              '8px',
                            backgroundColor:
                              isToday
                                ? '#0f766e'
                                : '#f9fafb',
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize:
                                '10px',
                              fontWeight:
                                '600',
                              color:
                                isToday
                                  ? '#fff'
                                  : '#9ca3af',
                              textTransform:
                                'uppercase',
                            }}
                          >
                            {
                              day.label
                            }
                          </p>

                          <p
                            style={{
                              margin:
                                '2px 0 0',
                              fontSize:
                                '14px',
                              fontWeight:
                                '700',
                              color:
                                isToday
                                  ? '#fff'
                                  : '#111827',
                            }}
                          >
                            {
                              day.date
                            }
                          </p>
                        </div>

                        {/* Departures */}

                        {day.departures?.map(
                          (
                            departure,
                            departureIndex
                          ) => (
                            <div
                              key={
                                departureIndex
                              }
                              style={{
                                padding:
                                  '6px 7px',
                                borderRadius:
                                  '7px',
                                backgroundColor:
                                  '#eff6ff',
                                border:
                                  '1px solid #bfdbfe',
                              }}
                            >
                              <div
                                style={{
                                  display:
                                    'flex',
                                  alignItems:
                                    'center',
                                  gap: '4px',
                                  marginBottom:
                                    '2px',
                                }}
                              >
                                <Plane
                                  size={
                                    9
                                  }
                                  color="#2563eb"
                                />

                                <span
                                  style={{
                                    fontSize:
                                      '9px',
                                    fontWeight:
                                      '600',
                                    color:
                                      '#2563eb',
                                    textTransform:
                                      'uppercase',
                                  }}
                                >
                                  Departs
                                </span>
                              </div>

                              <p
                                style={{
                                  margin: 0,
                                  fontSize:
                                    '10px',
                                  color:
                                    '#1e40af',
                                  fontWeight:
                                    '500',
                                  lineHeight:
                                    '1.3',
                                }}
                              >
                                {
                                  departure.name
                                }
                              </p>

                              {departure.dest && (
                                <p
                                  style={{
                                    margin:
                                      '1px 0 0',
                                    fontSize:
                                      '9px',
                                    color:
                                      '#93c5fd',
                                  }}
                                >
                                  {
                                    departure.dest
                                  }
                                </p>
                              )}
                            </div>
                          )
                        )}

                        {/* Payments */}

                        {day.payments?.map(
                          (
                            payment,
                            paymentIndex
                          ) => (
                            <div
                              key={
                                paymentIndex
                              }
                              style={{
                                padding:
                                  '6px 7px',
                                borderRadius:
                                  '7px',
                                backgroundColor:
                                  '#fef2f2',
                                border:
                                  '1px solid #fecaca',
                              }}
                            >
                              <div
                                style={{
                                  display:
                                    'flex',
                                  alignItems:
                                    'center',
                                  gap: '4px',
                                  marginBottom:
                                    '2px',
                                }}
                              >
                                <CreditCard
                                  size={
                                    9
                                  }
                                  color="#dc2626"
                                />

                                <span
                                  style={{
                                    fontSize:
                                      '9px',
                                    fontWeight:
                                      '600',
                                    color:
                                      '#dc2626',
                                    textTransform:
                                      'uppercase',
                                  }}
                                >
                                  Payment
                                </span>
                              </div>

                              <p
                                style={{
                                  margin: 0,
                                  fontSize:
                                    '10px',
                                  color:
                                    '#991b1b',
                                  fontWeight:
                                    '500',
                                  lineHeight:
                                    '1.3',
                                }}
                              >
                                {
                                  payment.name
                                }
                              </p>

                              {payment.amount && (
                                <p
                                  style={{
                                    margin:
                                      '1px 0 0',
                                    fontSize:
                                      '9px',
                                    color:
                                      '#fca5a5',
                                  }}
                                >
                                  {
                                    payment.amount
                                  }
                                </p>
                              )}
                            </div>
                          )
                        )}

                        {/* Follow-ups */}

                        {day.followups?.map(
                          (
                            followup,
                            followupIndex
                          ) => (
                            <div
                              key={
                                followupIndex
                              }
                              style={{
                                padding:
                                  '6px 7px',
                                borderRadius:
                                  '7px',
                                backgroundColor:
                                  '#fffbeb',
                                border:
                                  '1px solid #fde68a',
                              }}
                            >
                              <div
                                style={{
                                  display:
                                    'flex',
                                  alignItems:
                                    'center',
                                  gap: '4px',
                                  marginBottom:
                                    '2px',
                                }}
                              >
                                <Bell
                                  size={
                                    9
                                  }
                                  color="#d97706"
                                />

                                <span
                                  style={{
                                    fontSize:
                                      '9px',
                                    fontWeight:
                                      '600',
                                    color:
                                      '#d97706',
                                    textTransform:
                                      'uppercase',
                                  }}
                                >
                                  Follow-up
                                </span>
                              </div>

                              <p
                                style={{
                                  margin: 0,
                                  fontSize:
                                    '10px',
                                  color:
                                    '#92400e',
                                  fontWeight:
                                    '500',
                                  lineHeight:
                                    '1.3',
                                }}
                              >
                                {
                                  followup.name
                                }
                              </p>
                            </div>
                          )
                        )}

                        {/* Empty day */}

                        {!day.departures?.length &&
                          !day.payments?.length &&
                          !day.followups
                            ?.length && (
                            <div
                              style={{
                                padding:
                                  '10px 6px',
                                borderRadius:
                                  '7px',
                                border:
                                  '1px dashed #f3f4f6',
                                textAlign:
                                  'center',
                              }}
                            >
                              <p
                                style={{
                                  margin: 0,
                                  fontSize:
                                    '10px',
                                  color:
                                    '#d1d5db',
                                }}
                              >
                                —
                              </p>
                            </div>
                          )}
                      </div>
                    )
                  }
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            RIGHT: AI PANEL
        ═══════════════════════════════════════════════════════════════════ */}

        {aiPanel && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* ───────────────────────────────────────────────────────────────
                AI PERFORMANCE
            ─────────────────────────────────────────────────────────────── */}

            <div
              style={{
                backgroundColor: '#fff',
                border: '1px solid #f3f4f6',
                borderRadius: '14px',
                padding: '18px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  marginBottom: '14px',
                }}
              >
                <Sparkles
                  size={16}
                  color="#7c3aed"
                />

                <h2
                  style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827',
                  }}
                >
                  AI Performance
                </h2>
              </div>

              <div
                style={{
                  textAlign:
                    'center',
                  padding:
                    '8px 0',
                }}
              >
                <div
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius:
                      '50%',
                    border:
                      `6px solid ${
                        aiPanel.aiAcceptanceRate >=
                        70
                          ? '#0f766e'
                          : '#d97706'
                      }`,
                    display:
                      'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                    margin:
                      '0 auto 10px',
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        '18px',
                      fontWeight:
                        '700',
                      color:
                        '#111827',
                    }}
                  >
                    {
                      aiPanel.aiAcceptanceRate
                    }
                    %
                  </span>
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize:
                      '13px',
                    fontWeight:
                      '500',
                    color:
                      '#374151',
                  }}
                >
                  AI Acceptance Rate
                </p>

                <p
                  style={{
                    margin:
                      '3px 0 0',
                    fontSize:
                      '11px',
                    color:
                      '#9ca3af',
                  }}
                >
                  Live metric will appear once AI feedback aggregation is available.
                </p>
              </div>

              <div
                style={{
                  height: '6px',
                  backgroundColor:
                    '#f3f4f6',
                  borderRadius:
                    '999px',
                  overflow:
                    'hidden',
                  marginTop:
                    '14px',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius:
                      '999px',
                    backgroundColor:
                      aiPanel.aiAcceptanceRate >=
                      70
                        ? '#0f766e'
                        : '#d97706',
                    width: `${aiPanel.aiAcceptanceRate}%`,
                    transition:
                      'width 0.5s ease',
                  }}
                />
              </div>
            </div>

            {/* ───────────────────────────────────────────────────────────────
                TOP SCORED LEADS
            ─────────────────────────────────────────────────────────────── */}

            <div
              style={{
                backgroundColor:
                  '#fff',
                border:
                  '1px solid #f3f4f6',
                borderRadius:
                  '14px',
                padding: '18px',
              }}
            >
              <div
                style={{
                  display:
                    'flex',
                  alignItems:
                    'center',
                  gap: '7px',
                  marginBottom:
                    '14px',
                }}
              >
                <Star
                  size={15}
                  color="#d97706"
                />

                <h2
                  style={{
                    margin: 0,
                    fontSize:
                      '14px',
                    fontWeight:
                      '600',
                    color:
                      '#111827',
                  }}
                >
                  Top Scored Leads
                </h2>
              </div>

              {aiPanel.topLeads.length >
              0 ? (
                <div
                  style={{
                    display:
                      'flex',
                    flexDirection:
                      'column',
                    gap: '8px',
                  }}
                >
                  {aiPanel.topLeads.map(
                    (lead) => (
                      <button
                        key={
                          lead.id ||
                          lead.name
                        }
                        onClick={() => {
                          if (
                            lead.id
                          ) {
                            navigate(
                              `/leads/${lead.id}`
                            )
                          }
                        }}
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap: '10px',
                          padding:
                            '10px',
                          borderRadius:
                            '10px',
                          border:
                            '1px solid #f3f4f6',
                          backgroundColor:
                            '#fafafa',
                          cursor:
                            lead.id
                              ? 'pointer'
                              : 'default',
                          textAlign:
                            'left',
                          width:
                            '100%',
                        }}
                      >
                        <div
                          style={{
                            width:
                              '30px',
                            height:
                              '30px',
                            borderRadius:
                              '50%',
                            flexShrink:
                              0,
                            backgroundColor:
                              '#f0fdfa',
                            display:
                              'flex',
                            alignItems:
                              'center',
                            justifyContent:
                              'center',
                            fontSize:
                              '12px',
                            fontWeight:
                              '600',
                            color:
                              '#0f766e',
                          }}
                        >
                          {lead.name
                            ?.charAt(
                              0
                            )
                            ?.toUpperCase() ||
                            '?'}
                        </div>

                        <div
                          style={{
                            flex:
                              1,
                            minWidth:
                              0,
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize:
                                '13px',
                              fontWeight:
                                '500',
                              color:
                                '#111827',
                              whiteSpace:
                                'nowrap',
                              overflow:
                                'hidden',
                              textOverflow:
                                'ellipsis',
                            }}
                          >
                            {
                              lead.name
                            }
                          </p>

                          <p
                            style={{
                              margin:
                                '1px 0 0',
                              fontSize:
                                '11px',
                              color:
                                '#9ca3af',
                            }}
                          >
                            {
                              lead.destination
                            }
                          </p>
                        </div>

                        <div
                          style={{
                            padding:
                              '3px 8px',
                            borderRadius:
                              '999px',
                            backgroundColor:
                              lead.score >=
                              90
                                ? '#fef2f2'
                                : '#fffbeb',
                            color:
                              lead.score >=
                              90
                                ? '#dc2626'
                                : '#d97706',
                            fontSize:
                              '12px',
                            fontWeight:
                              '700',
                            flexShrink:
                              0,
                          }}
                        >
                          {
                            lead.score
                          }
                        </div>
                      </button>
                    )
                  )}
                </div>
              ) : (
                <div
                  style={{
                    padding:
                      '16px 8px',
                    textAlign:
                      'center',
                    color:
                      '#9ca3af',
                    fontSize:
                      '12px',
                  }}
                >
                  No priority leads available.
                </div>
              )}
            </div>

            {/* ───────────────────────────────────────────────────────────────
                PENDING REVIEWS
            ─────────────────────────────────────────────────────────────── */}

            <div
              style={{
                backgroundColor:
                  '#fff',
                border:
                  '1px solid #f3f4f6',
                borderRadius:
                  '14px',
                padding: '18px',
              }}
            >
              <div
                style={{
                  display:
                    'flex',
                  alignItems:
                    'center',
                  gap: '7px',
                  marginBottom:
                    '14px',
                }}
              >
                <ClipboardCheck
                  size={15}
                  color="#0f766e"
                />

                <h2
                  style={{
                    margin: 0,
                    fontSize:
                      '14px',
                    fontWeight:
                      '600',
                    color:
                      '#111827',
                  }}
                >
                  Pending Reviews
                </h2>

                <span
                  style={{
                    marginLeft:
                      'auto',
                    fontSize:
                      '11px',
                    padding:
                      '2px 8px',
                    borderRadius:
                      '999px',
                    backgroundColor:
                      '#f3f4f6',
                    color:
                      '#6b7280',
                    fontWeight:
                      '500',
                  }}
                >
                  {aiPanel.pendingItineraries.length +
                    aiPanel.pendingQuotes.length}
                </span>
              </div>

              <p
                style={{
                  margin:
                    '0 0 8px',
                  fontSize:
                    '11px',
                  fontWeight:
                    '600',
                  color:
                    '#9ca3af',
                  textTransform:
                    'uppercase',
                  letterSpacing:
                    '0.4px',
                }}
              >
                Itineraries
              </p>

              {aiPanel.pendingItineraries.length >
              0 ? (
                <div
                  style={{
                    display:
                      'flex',
                    flexDirection:
                      'column',
                    gap: '6px',
                    marginBottom:
                      '14px',
                  }}
                >
                  {aiPanel.pendingItineraries.map(
                    (itinerary) => (
                      <div
                        key={
                          itinerary.id
                        }
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap: '8px',
                          padding:
                            '8px 10px',
                          borderRadius:
                            '8px',
                          backgroundColor:
                            '#f9fafb',
                          border:
                            '1px solid #f3f4f6',
                        }}
                      >
                        <MapPin
                          size={12}
                          color="#0f766e"
                        />

                        <div
                          style={{
                            flex:
                              1,
                            minWidth:
                              0,
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize:
                                '12px',
                              fontWeight:
                                '500',
                              color:
                                '#374151',
                            }}
                          >
                            {
                              itinerary.lead
                            }
                          </p>

                          <p
                            style={{
                              margin: 0,
                              fontSize:
                                '11px',
                              color:
                                '#9ca3af',
                            }}
                          >
                            {
                              itinerary.destination
                            }
                          </p>
                        </div>

                        <ChevronRight
                          size={13}
                          color="#9ca3af"
                        />
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div
                  style={{
                    padding:
                      '8px 0 14px',
                    fontSize:
                      '12px',
                    color:
                      '#9ca3af',
                  }}
                >
                  No pending itinerary reviews.
                </div>
              )}

              <p
                style={{
                  margin:
                    '0 0 8px',
                  fontSize:
                    '11px',
                  fontWeight:
                    '600',
                  color:
                    '#9ca3af',
                  textTransform:
                    'uppercase',
                  letterSpacing:
                    '0.4px',
                }}
              >
                Quotations
              </p>

              {aiPanel.pendingQuotes.length >
              0 ? (
                <div
                  style={{
                    display:
                      'flex',
                    flexDirection:
                      'column',
                    gap: '6px',
                  }}
                >
                  {aiPanel.pendingQuotes.map(
                    (quotation) => (
                      <div
                        key={
                          quotation.id
                        }
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap: '8px',
                          padding:
                            '8px 10px',
                          borderRadius:
                            '8px',
                          backgroundColor:
                            '#f9fafb',
                          border:
                            '1px solid #f3f4f6',
                        }}
                      >
                        <FileText
                          size={12}
                          color="#2563eb"
                        />

                        <div
                          style={{
                            flex:
                              1,
                            minWidth:
                              0,
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize:
                                '12px',
                              fontWeight:
                                '500',
                              color:
                                '#374151',
                            }}
                          >
                            {
                              quotation.lead
                            }
                          </p>

                          <p
                            style={{
                              margin: 0,
                              fontSize:
                                '11px',
                              color:
                                '#9ca3af',
                            }}
                          >
                            {
                              quotation.amount
                            }
                          </p>
                        </div>

                        <ChevronRight
                          size={13}
                          color="#9ca3af"
                        />
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div
                  style={{
                    padding:
                      '8px 0 0',
                    fontSize:
                      '12px',
                    color:
                      '#9ca3af',
                  }}
                >
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