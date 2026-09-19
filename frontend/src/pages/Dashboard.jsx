import { useState, useEffect } from 'react'
import {
  Users, Calendar, TrendingUp, DollarSign,
  CheckCircle2, Clock, Sparkles, ArrowRight,
  MapPin, X, AlertTriangle, CalendarClock,
  Plane, CreditCard, Bell, Star, FileText,
  ClipboardCheck, ChevronRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import MetricCard from '../components/MetricCard'
import useAnalyticsSummary from '../hooks/useAnalyticsSummary'
import api from '../services/api'

// ── Mock data ─────────────────────────────────────────────────────────────────

const mockAlerts = [
  { id: 1, type: 'overdue',   message: 'Rohit Kumar — overdue follow-up (3 days)'  },
  { id: 2, type: 'departure', message: 'Priya Sharma — departure in 5 days'         },
  { id: 3, type: 'overdue',   message: 'Deepak Nair — no response in 4 days'        },
  { id: 4, type: 'departure', message: 'Kapoor Family — travel date in 3 days'      },
  { id: 5, type: 'overdue',   message: 'Vikram Singh — quote expiring tomorrow'     },
]

const mockPipeline = {
  New:       [{ id: 4,  name: 'Arjun Verma'   }, { id: 7,  name: 'Vikram Singh'  }, { id: 10, name: 'Meera Pillai'  }],
  Quoted:    [{ id: 1,  name: 'Priya Sharma'  }, { id: 6,  name: 'Neha Joshi'    }, { id: 11, name: 'Ravi Tiwari'   }],
  Confirmed: [{ id: 5,  name: 'Kapoor Family' }, { id: 8,  name: 'Ananya Iyer'   }, { id: 2,  name: 'Rahul Mehta'   }],
  Lost:      [{ id: 12, name: 'Pooja Agarwal' }, { id: 9,  name: 'Deepak Nair'   }],
}

const pipelineMeta = {
  New:       { color: '#6b7280', bg: '#f3f4f6', accent: '#e5e7eb', count: 34 },
  Quoted:    { color: '#d97706', bg: '#fffbeb', accent: '#fde68a', count: 22 },
  Confirmed: { color: '#0f766e', bg: '#f0fdfa', accent: '#99f6e4', count: 14 },
  Lost:      { color: '#dc2626', bg: '#fef2f2', accent: '#fecaca', count: 8  },
}

const today = new Date()
const getDay = (offset) => {
  const d = new Date(today)
  d.setDate(today.getDate() + offset)
  return { label: d.toLocaleDateString('en-IN', { weekday: 'short' }), date: d.getDate() }
}

const mockTimeline = [
  { ...getDay(0), departures: [{ name: 'Priya Sharma',  dest: 'Bali'   }], payments: [{ name: 'Mehta Family', amount: '₹45,000'   }], followups: [{ name: 'Arjun Verma' }, { name: 'Neha Joshi' }] },
  { ...getDay(1), departures: [],                                            payments: [{ name: 'Ravi Tiwari',  amount: '₹75,000'   }], followups: [{ name: 'Deepak Nair' }]                          },
  { ...getDay(2), departures: [{ name: 'Kapoor Family', dest: 'Goa'    }], payments: [],                                               followups: [{ name: 'Vikram Singh' }, { name: 'Sunita Rao' }] },
  { ...getDay(3), departures: [],                                            payments: [{ name: 'Ananya Iyer',  amount: '₹3,00,000' }], followups: []                                                  },
  { ...getDay(4), departures: [{ name: 'Rahul Mehta',   dest: 'Manali' }], payments: [],                                               followups: [{ name: 'Meera Pillai' }]                          },
  { ...getDay(5), departures: [],                                            payments: [{ name: 'Neha Joshi',   amount: '₹2,00,000' }], followups: []                                                  },
  { ...getDay(6), departures: [],                                            payments: [],                                               followups: [{ name: 'Pooja Agarwal' }]                         },
]

const mockAiPanel = {
  topLeads: [
    { id: 1, name: 'Priya Sharma',  score: 94, destination: 'Bali'     },
    { id: 8, name: 'Ananya Iyer',   score: 89, destination: 'Maldives' },
    { id: 5, name: 'Kapoor Family', score: 85, destination: 'Goa'      },
  ],
  pendingItineraries: [
    { id: 'ITN-001', lead: 'Priya Sharma', destination: 'Bali'     },
    { id: 'ITN-003', lead: 'Ananya Iyer',  destination: 'Maldives' },
  ],
  pendingQuotes: [
    { id: 'QT-002', lead: 'Neha Joshi',   amount: '₹2,00,000' },
    { id: 'QT-005', lead: 'Rahul Mehta',  amount: '₹45,000'   },
    { id: 'QT-007', lead: 'Vikram Singh', amount: '₹55,000'   },
  ],
  aiAcceptanceRate: 78,
}

const priorityTasks = [
  { id: 1, task: 'Follow up with Priya Sharma — Bali trip quote pending',  due: 'Today',    urgent: true  },
  { id: 2, task: 'Confirm hotel booking for Mehta family — Manali Dec 15', due: 'Tomorrow', urgent: true  },
  { id: 3, task: 'Send itinerary to Arjun Verma — Kerala backwaters',      due: 'Dec 12',   urgent: false },
  { id: 4, task: 'Call Sunita Rao about visa requirements — Dubai trip',   due: 'Dec 13',   urgent: false },
  { id: 5, task: 'Review and approve quotation for Kapoor group — Goa',    due: 'Dec 14',   urgent: false },
]

// ─────────────────────────────────────────────────────────────────────────────

function Dashboard() {
  const navigate = useNavigate()
  const { data, loading } = useAnalyticsSummary()

  const [alerts, setAlerts]             = useState([])
  const [dismissedIds, setDismissedIds] = useState([])
  const [timeline, setTimeline]         = useState([])
  const [aiPanel, setAiPanel]           = useState(null)

  useEffect(() => {
    const fetchAll = async () => {
      try { const r = await api.get('/leads/priority'); setAlerts(r.data?.slice(0, 5) || []) }
      catch { setAlerts(mockAlerts) }

      try {
        const [upcomingRes] = await Promise.all([
          api.get('/bookings/upcoming'),
          api.get('/leads/followups'),
        ])
        setTimeline(upcomingRes.data || [])
      } catch { setTimeline(mockTimeline) }

      try { const r = await api.get('/ai/suggestions'); setAiPanel(r.data) }
      catch { setAiPanel(mockAiPanel) }
    }
    fetchAll()
  }, [])

  const visibleAlerts = alerts.filter(a => !dismissedIds.includes(a.id))
  const dismissAlert  = (id) => setDismissedIds(prev => [...prev, id])

  const kpiCards = [
    { title: 'Total Leads',        value: data?.totalLeads,        subtitle: data?.leadsTrend,      color: '#0f766e', icon: Users      },
    { title: 'Confirmed Bookings', value: data?.confirmedBookings, subtitle: data?.bookingsTrend,   color: '#2563eb', icon: Calendar   },
    { title: 'Conversion Rate',    value: data?.conversionRate,    subtitle: data?.conversionTrend, color: '#d97706', icon: TrendingUp },
    { title: 'Total Revenue',      value: data?.totalRevenue,      subtitle: data?.revenueTrend,    color: '#7c3aed', icon: DollarSign },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#111827' }}>Dashboard</h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#9ca3af' }}>
          Here's what's happening with your agency today.
        </p>
      </div>

      {/* ── Alerts ───────────────────────────────────────────────────────────── */}
      {visibleAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {visibleAlerts.map(alert => (
            <div key={alert.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '10px',
              backgroundColor: alert.type === 'overdue' ? '#fff7ed' : '#eff6ff',
              border: `1px solid ${alert.type === 'overdue' ? '#fed7aa' : '#bfdbfe'}`,
            }}>
              {alert.type === 'overdue'
                ? <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0 }} />
                : <CalendarClock size={15} color="#2563eb" style={{ flexShrink: 0 }} />
              }
              <p style={{ margin: 0, fontSize: '13px', flex: 1, color: '#374151' }}>
                <span style={{ fontWeight: '600' }}>{alert.type === 'overdue' ? '⚠️' : '📅'}</span>{' '}{alert.message}
              </p>
              <button onClick={() => dismissAlert(alert.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px', borderRadius: '4px', display: 'flex',
              }}>
                <X size={14} color="#9ca3af" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── KPI Cards ────────────────────────────────────────────────────────── */}
      <div
        className="kpi-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}
      >
        {kpiCards.map(card => <MetricCard key={card.title} loading={loading} {...card} />)}
      </div>

      {/* ── Main content + AI Panel ───────────────────────────────────────────── */}
      <div
        className="main-with-panel"
        style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}
      >

        {/* LEFT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Priority Tasks */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={17} color="#0f766e" />
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>Priority Tasks</h2>
              </div>
              <span style={{
                fontSize: '12px', backgroundColor: '#fef2f2', color: '#dc2626',
                padding: '3px 10px', borderRadius: '999px', fontWeight: '500',
              }}>
                {priorityTasks.filter(t => t.urgent).length} urgent
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {priorityTasks.map(({ id, task, due, urgent }) => (
                <div key={id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '10px 12px', borderRadius: '10px',
                  backgroundColor: urgent ? '#fff7ed' : '#f9fafb',
                  border: `1px solid ${urgent ? '#fed7aa' : '#f3f4f6'}`,
                }}>
                  <Clock size={14} color={urgent ? '#d97706' : '#9ca3af'} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: '1.4' }}>{task}</p>
                    <p style={{ margin: '3px 0 0', fontSize: '11px', color: urgent ? '#d97706' : '#9ca3af' }}>Due: {due}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Horizontal Pipeline */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <MapPin size={17} color="#0f766e" />
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>Lead Pipeline</h2>
              <button onClick={() => navigate('/leads')} style={{
                marginLeft: 'auto', fontSize: '12px', color: '#0f766e',
                background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                View all <ArrowRight size={12} />
              </button>
            </div>

            {/* ✅ Pipeline columns grid */}
            <div
              className="four-col"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}
            >
              {Object.entries(mockPipeline).map(([stage, leads]) => {
                const meta = pipelineMeta[stage]
                return (
                  <div key={stage} style={{
                    borderRadius: '12px', border: `1px solid ${meta.accent}`,
                    backgroundColor: meta.bg, overflow: 'hidden',
                  }}>
                    <div style={{
                      padding: '8px 12px', borderBottom: `1px solid ${meta.accent}`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: meta.color }}>{stage}</span>
                      <span style={{
                        fontSize: '11px', fontWeight: '700', padding: '1px 7px',
                        borderRadius: '999px', backgroundColor: '#fff', color: meta.color,
                      }}>{meta.count}</span>
                    </div>
                    <div style={{ padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {leads.map(lead => (
                        <button
                          key={lead.id}
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          style={{
                            width: '100%', textAlign: 'left', padding: '6px 8px',
                            borderRadius: '7px', border: 'none', backgroundColor: '#fff',
                            fontSize: '12px', color: '#374151', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.1s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = meta.bg; e.currentTarget.style.color = meta.color }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#374151' }}
                        >
                          <div style={{
                            width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                            backgroundColor: meta.bg, border: `1px solid ${meta.accent}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '9px', fontWeight: '700', color: meta.color,
                          }}>
                            {lead.name.charAt(0)}
                          </div>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {lead.name}
                          </span>
                        </button>
                      ))}
                      {meta.count > leads.length && (
                        <button onClick={() => navigate('/leads')} style={{
                          width: '100%', textAlign: 'center', padding: '4px',
                          border: 'none', background: 'none', fontSize: '11px',
                          color: '#9ca3af', cursor: 'pointer',
                        }}>
                          +{meta.count - leads.length} more
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── 7-Day Timeline ─────────────────────────────────────────────── */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Calendar size={17} color="#2563eb" />
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>7-Day View</h2>
              <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto', alignItems: 'center' }}>
                {[
                  { color: '#bfdbfe', label: 'Departures' },
                  { color: '#fecaca', label: 'Payments'   },
                  { color: '#fde68a', label: 'Follow-ups' },
                ].map(({ color, label }) => (
                  <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6b7280' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '3px', backgroundColor: color, display: 'inline-block' }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* ✅ Timeline grid — scrollable on mobile */}
            <div style={{ overflowX: 'auto' }}>
              <div
                className="timeline-grid"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', minWidth: '560px' }}
              >
                {(timeline.length ? timeline : mockTimeline).map((day, i) => {
                  const isToday = i === 0
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

                      {/* Day header */}
                      <div style={{
                        textAlign: 'center', padding: '6px 4px', borderRadius: '8px',
                        backgroundColor: isToday ? '#0f766e' : '#f9fafb',
                      }}>
                        <p style={{ margin: 0, fontSize: '10px', fontWeight: '600', color: isToday ? '#fff' : '#9ca3af', textTransform: 'uppercase' }}>
                          {day.label}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: '700', color: isToday ? '#fff' : '#111827' }}>
                          {day.date}
                        </p>
                      </div>

                      {/* Departures */}
                      {day.departures?.map((dep, di) => (
                        <div key={di} style={{ padding: '6px 7px', borderRadius: '7px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                            <Plane size={9} color="#2563eb" />
                            <span style={{ fontSize: '9px', fontWeight: '600', color: '#2563eb', textTransform: 'uppercase' }}>Departs</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '10px', color: '#1e40af', fontWeight: '500', lineHeight: '1.3' }}>{dep.name}</p>
                          {dep.dest && <p style={{ margin: '1px 0 0', fontSize: '9px', color: '#93c5fd' }}>{dep.dest}</p>}
                        </div>
                      ))}

                      {/* Payments */}
                      {day.payments?.map((pay, pi) => (
                        <div key={pi} style={{ padding: '6px 7px', borderRadius: '7px', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                            <CreditCard size={9} color="#dc2626" />
                            <span style={{ fontSize: '9px', fontWeight: '600', color: '#dc2626', textTransform: 'uppercase' }}>Payment</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '10px', color: '#991b1b', fontWeight: '500', lineHeight: '1.3' }}>{pay.name}</p>
                          {pay.amount && <p style={{ margin: '1px 0 0', fontSize: '9px', color: '#fca5a5' }}>{pay.amount}</p>}
                        </div>
                      ))}

                      {/* Follow-ups */}
                      {day.followups?.map((fu, fi) => (
                        <div key={fi} style={{ padding: '6px 7px', borderRadius: '7px', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                            <Bell size={9} color="#d97706" />
                            <span style={{ fontSize: '9px', fontWeight: '600', color: '#d97706', textTransform: 'uppercase' }}>Follow-up</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '10px', color: '#92400e', fontWeight: '500', lineHeight: '1.3' }}>{fu.name}</p>
                        </div>
                      ))}

                      {/* Empty day */}
                      {!day.departures?.length && !day.payments?.length && !day.followups?.length && (
                        <div style={{ padding: '10px 6px', borderRadius: '7px', border: '1px dashed #f3f4f6', textAlign: 'center' }}>
                          <p style={{ margin: 0, fontSize: '10px', color: '#d1d5db' }}>—</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: AI Suggestions Panel ──────────────────────────────────── */}
        {aiPanel && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* AI acceptance rate */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
                <Sparkles size={16} color="#7c3aed" />
                <h2 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>AI Performance</h2>
              </div>
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{
                  width: '70px', height: '70px', borderRadius: '50%',
                  border: `6px solid ${aiPanel.aiAcceptanceRate >= 70 ? '#0f766e' : '#d97706'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 10px',
                }}>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                    {aiPanel.aiAcceptanceRate}%
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '500', color: '#374151' }}>AI Acceptance Rate</p>
                <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#9ca3af' }}>Itineraries approved without changes</p>
              </div>
              <div style={{ height: '6px', backgroundColor: '#f3f4f6', borderRadius: '999px', overflow: 'hidden', marginTop: '14px' }}>
                <div style={{
                  height: '100%', borderRadius: '999px',
                  backgroundColor: aiPanel.aiAcceptanceRate >= 70 ? '#0f766e' : '#d97706',
                  width: `${aiPanel.aiAcceptanceRate}%`, transition: 'width 0.5s ease',
                }} />
              </div>
            </div>

            {/* Top scored leads */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
                <Star size={15} color="#d97706" />
                <h2 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>Top Scored Leads</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {aiPanel.topLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px', borderRadius: '10px',
                      border: '1px solid #f3f4f6', backgroundColor: '#fafafa',
                      cursor: 'pointer', textAlign: 'left', width: '100%',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0fdfa'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                  >
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                      backgroundColor: '#f0fdfa', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '12px', fontWeight: '600', color: '#0f766e',
                    }}>
                      {lead.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '500', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lead.name}
                      </p>
                      <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#9ca3af' }}>{lead.destination}</p>
                    </div>
                    <div style={{
                      padding: '3px 8px', borderRadius: '999px',
                      backgroundColor: lead.score >= 90 ? '#fef2f2' : '#fffbeb',
                      color: lead.score >= 90 ? '#dc2626' : '#d97706',
                      fontSize: '12px', fontWeight: '700', flexShrink: 0,
                    }}>
                      {lead.score}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pending reviews */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
                <ClipboardCheck size={15} color="#0f766e" />
                <h2 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>Pending Reviews</h2>
                <span style={{
                  marginLeft: 'auto', fontSize: '11px', padding: '2px 8px',
                  borderRadius: '999px', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: '500',
                }}>
                  {aiPanel.pendingItineraries.length + aiPanel.pendingQuotes.length}
                </span>
              </div>

              <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Itineraries
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                {aiPanel.pendingItineraries.map(itn => (
                  <div key={itn.id} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 10px', borderRadius: '8px',
                    backgroundColor: '#f9fafb', border: '1px solid #f3f4f6',
                  }}>
                    <MapPin size={12} color="#0f766e" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '500', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {itn.lead}
                      </p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>{itn.destination}</p>
                    </div>
                    <button
                      onClick={() => navigate('/itinerary')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}
                    >
                      <ChevronRight size={13} color="#9ca3af" />
                    </button>
                  </div>
                ))}
              </div>

              <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Quotations
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {aiPanel.pendingQuotes.map(q => (
                  <div key={q.id} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 10px', borderRadius: '8px',
                    backgroundColor: '#f9fafb', border: '1px solid #f3f4f6',
                  }}>
                    <FileText size={12} color="#2563eb" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '500', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {q.lead}
                      </p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>{q.amount}</p>
                    </div>
                    <ChevronRight size={13} color="#9ca3af" />
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard