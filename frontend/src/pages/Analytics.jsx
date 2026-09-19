import { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'
import {
  TrendingUp, Users, DollarSign, BarChart2,
  MapPin, RefreshCw, Calendar, Award
} from 'lucide-react'
import { getAnalytics } from '../services/api'

// ── Mock Data ─────────────────────────────────────────────────────────────────

const mockData = {
  leadsPerMonth: [
    { month: 'Jul', leads: 28, converted: 8  },
    { month: 'Aug', leads: 34, converted: 11 },
    { month: 'Sep', leads: 29, converted: 9  },
    { month: 'Oct', leads: 42, converted: 15 },
    { month: 'Nov', leads: 38, converted: 13 },
    { month: 'Dec', leads: 51, converted: 19 },
  ],
  bookingsOverTime: [
    { week: 'Wk 1', bookings: 4,  revenue: 180000 },
    { week: 'Wk 2', bookings: 7,  revenue: 310000 },
    { week: 'Wk 3', bookings: 5,  revenue: 225000 },
    { week: 'Wk 4', bookings: 9,  revenue: 420000 },
    { week: 'Wk 5', bookings: 11, revenue: 510000 },
    { week: 'Wk 6', bookings: 8,  revenue: 380000 },
    { week: 'Wk 7', bookings: 13, revenue: 610000 },
    { week: 'Wk 8', bookings: 10, revenue: 480000 },
  ],
  topDestinations: [
    { name: 'Bali',       value: 28, color: '#0f766e' },
    { name: 'Manali',     value: 19, color: '#2563eb' },
    { name: 'Dubai',      value: 16, color: '#d97706' },
    { name: 'Goa',        value: 14, color: '#7c3aed' },
    { name: 'Kerala',     value: 11, color: '#dc2626' },
    { name: 'Maldives',   value: 8,  color: '#0891b2' },
    { name: 'Others',     value: 12, color: '#9ca3af' },
  ],
  conversionBySource: [
    { source: 'WhatsApp', leads: 45, converted: 18 },
    { source: 'Email',    leads: 30, converted: 10 },
    { source: 'Referral', leads: 22, converted: 12 },
    { source: 'Walk-in',  leads: 15, converted: 8  },
    { source: 'Instagram',leads: 12, converted: 3  },
  ],
  summary: {
    totalRevenue:     '₹42.8L',
    totalLeads:       222,
    conversionRate:   '31%',
    avgDealSize:      '₹62,500',
    revenueTrend:     '+18%',
    leadsTrend:       '+12%',
    conversionTrend:  '+3%',
    dealTrend:        '+7%',
  },
  topAgents: [
    { name: 'Ravi Kumar',  deals: 18, revenue: '₹11.2L' },
    { name: 'Sneha Iyer',  deals: 14, revenue: '₹9.4L'  },
    { name: 'Arjun Seth',  deals: 11, revenue: '₹7.8L'  },
  ],
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      backgroundColor: '#fff', border: '1px solid #f3f4f6',
      borderRadius: '10px', padding: '10px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    }}>
      <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', fontSize: '12px', color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      backgroundColor: '#fff', border: '1px solid #f3f4f6',
      borderRadius: '10px', padding: '8px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    }}>
      <p style={{ margin: 0, fontSize: '13px', color: '#111827' }}>
        <strong>{payload[0].name}</strong>: {payload[0].value} bookings
      </p>
    </div>
  )
}

// ── Card wrapper ──────────────────────────────────────────────────────────────

const Card = ({ children, style = {} }) => (
  <div style={{
    backgroundColor: '#fff', border: '1px solid #f3f4f6',
    borderRadius: '14px', padding: '20px', ...style,
  }}>
    {children}
  </div>
)

const ChartTitle = ({ icon: Icon, title, subtitle, color = '#0f766e' }) => (
  <div style={{ marginBottom: '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Icon size={16} color={color} />
      <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>{title}</h2>
    </div>
    {subtitle && <p style={{ margin: '4px 0 0 24px', fontSize: '12px', color: '#9ca3af' }}>{subtitle}</p>}
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────

function Analytics() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await getAnalytics()
      setData(res.data)
    } catch {
      setData(mockData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        border: '3px solid #e5e7eb', borderTopColor: '#0f766e',
        animation: 'spin 0.7s linear infinite',
      }} />
      <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>Loading analytics...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const { leadsPerMonth, bookingsOverTime, topDestinations, conversionBySource, summary, topAgents } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#111827' }}>Analytics</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#9ca3af' }}>
            Performance overview for the last 6 months
          </p>
        </div>
        <button
          onClick={fetchData}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '9px 16px', borderRadius: '10px',
            border: '1px solid #e5e7eb', backgroundColor: '#fff',
            fontSize: '13px', color: '#374151', cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Summary KPIs ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { label: 'Total Revenue',    value: summary.totalRevenue,   trend: summary.revenueTrend,    icon: DollarSign, color: '#7c3aed', positive: true  },
          { label: 'Total Leads',      value: summary.totalLeads,     trend: summary.leadsTrend,      icon: Users,      color: '#0f766e', positive: true  },
          { label: 'Conversion Rate',  value: summary.conversionRate, trend: summary.conversionTrend, icon: TrendingUp, color: '#2563eb', positive: true  },
          { label: 'Avg Deal Size',    value: summary.avgDealSize,    trend: summary.dealTrend,       icon: Award,      color: '#d97706', positive: true  },
        ].map(({ label, value, trend, icon: Icon, color, positive }) => (
          <div key={label} style={{
            backgroundColor: '#fff', border: '1px solid #f3f4f6',
            borderLeft: `4px solid ${color}`,
            borderRadius: '12px', padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>{label}</p>
              <div style={{
                width: '30px', height: '30px', borderRadius: '8px',
                backgroundColor: `${color}15`, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={15} color={color} />
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '26px', fontWeight: '700', color: '#111827', lineHeight: 1 }}>{value}</p>
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: positive ? '#0f766e' : '#dc2626' }}>
              {positive ? '▲' : '▼'} {trend} vs last period
            </p>
          </div>
        ))}
      </div>

      {/* ── Row 1: Bar Chart + Line Chart ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Leads per Month — Bar Chart */}
        <Card>
          <ChartTitle icon={BarChart2} title="Leads per Month" subtitle="Total vs converted leads" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={leadsPerMonth} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                formatter={v => <span style={{ color: '#6b7280' }}>{v}</span>}
              />
              <Bar dataKey="leads"     name="Total Leads"     fill="#bfdbfe" radius={[4, 4, 0, 0]} />
              <Bar dataKey="converted" name="Converted"       fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Bookings over time — Line Chart */}
        <Card>
          <ChartTitle icon={TrendingUp} title="Bookings Over Time" subtitle="Weekly bookings trend" color="#2563eb" />
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={bookingsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                formatter={v => <span style={{ color: '#6b7280' }}>{v}</span>}
              />
              <Line
                type="monotone" dataKey="bookings" name="Bookings"
                stroke="#2563eb" strokeWidth={2.5} dot={{ fill: '#2563eb', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone" dataKey="revenue" name="Revenue (₹)"
                stroke="#0f766e" strokeWidth={2} strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Row 2: Pie Chart + Conversion by Source ────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Top Destinations — Pie Chart */}
        <Card>
          <ChartTitle icon={MapPin} title="Top Destinations" subtitle="Bookings by destination" color="#d97706" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <ResponsiveContainer width="55%" height={220}>
              <PieChart>
                <Pie
                  data={topDestinations}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {topDestinations.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topDestinations.map((d, i) => (
                <div
                  key={d.name}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '5px 8px', borderRadius: '7px', cursor: 'default',
                    backgroundColor: activeIndex === i ? `${d.color}12` : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: d.color, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: '12px', color: '#374151' }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Conversion by Source — Horizontal Bar */}
        <Card>
          <ChartTitle icon={Users} title="Leads by Source" subtitle="Conversion rate per channel" color="#7c3aed" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
            {conversionBySource.map(({ source, leads, converted }) => {
              const rate = Math.round((converted / leads) * 100)
              return (
                <div key={source}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>{source}</span>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>{converted}/{leads} converted</span>
                      <span style={{
                        fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px',
                        backgroundColor: rate >= 50 ? '#f0fdfa' : rate >= 30 ? '#fffbeb' : '#f9fafb',
                        color: rate >= 50 ? '#0f766e' : rate >= 30 ? '#d97706' : '#6b7280',
                      }}>{rate}%</span>
                    </div>
                  </div>
                  <div style={{ height: '7px', backgroundColor: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '999px',
                      backgroundColor: rate >= 50 ? '#0f766e' : rate >= 30 ? '#d97706' : '#9ca3af',
                      width: `${rate}%`, transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Top agents */}
          <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #f3f4f6' }}>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#111827' }}>Top Agents</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topAgents.map((agent, i) => (
                <div key={agent.name} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 10px', borderRadius: '8px', backgroundColor: '#f9fafb',
                }}>
                  <span style={{
                    width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                    backgroundColor: ['#f0fdfa', '#eff6ff', '#f5f3ff'][i],
                    color: ['#0f766e', '#2563eb', '#7c3aed'][i],
                    fontSize: '11px', fontWeight: '700',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: '13px', color: '#374151', fontWeight: '500' }}>{agent.name}</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>{agent.deals} deals</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{agent.revenue}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default Analytics