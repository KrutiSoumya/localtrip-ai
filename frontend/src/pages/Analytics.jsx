
import { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'
import {
  TrendingUp, Users, DollarSign, BarChart2,
  MapPin, RefreshCw, Award
} from 'lucide-react'
import { getAnalytics } from '../services/api'

// ── Custom tooltip ────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null

  return (
    <div style={{
      backgroundColor: '#fff',
      border: '1px solid #f3f4f6',
      borderRadius: '10px',
      padding: '10px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    }}>
      <p style={{
        margin: '0 0 6px',
        fontSize: '12px',
        fontWeight: '600',
        color: '#374151'
      }}>
        {label}
      </p>

      {payload.map((p, i) => (
        <p key={i} style={{
          margin: '2px 0',
          fontSize: '12px',
          color: p.color
        }}>
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
      backgroundColor: '#fff',
      border: '1px solid #f3f4f6',
      borderRadius: '10px',
      padding: '8px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    }}>
      <p style={{
        margin: 0,
        fontSize: '13px',
        color: '#111827'
      }}>
        <strong>{payload[0].name}</strong>: {payload[0].value} bookings
      </p>
    </div>
  )
}

// ── Card wrapper ──────────────────────────────────────────────────────────────

const Card = ({ children, style = {} }) => (
  <div style={{
    backgroundColor: '#fff',
    border: '1px solid #f3f4f6',
    borderRadius: '14px',
    padding: '20px',
    ...style,
  }}>
    {children}
  </div>
)

const ChartTitle = ({
  icon: Icon,
  title,
  subtitle,
  color = '#0f766e'
}) => (
  <div style={{ marginBottom: '20px' }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <Icon size={16} color={color} />

      <h2 style={{
        margin: 0,
        fontSize: '15px',
        fontWeight: '600',
        color: '#111827'
      }}>
        {title}
      </h2>
    </div>

    {subtitle && (
      <p style={{
        margin: '4px 0 0 24px',
        fontSize: '12px',
        color: '#9ca3af'
      }}>
        {subtitle}
      </p>
    )}
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────

function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeIndex, setActiveIndex] = useState(null)

  // ── Fetch real analytics data ───────────────────────────────────────────────

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await getAnalytics()

      if (!res.data || !res.data.summary) {
        throw new Error('Invalid analytics response from server')
      }

      setData(res.data)

    } catch (err) {
      console.error('Analytics fetch error:', err)

      setData(null)

      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to load analytics. Please try again.'
      )

    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // ── Loading screen ──────────────────────────────────────────────────────────

  if (loading && !data) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '3px solid #e5e7eb',
          borderTopColor: '#0f766e',
          animation: 'spin 0.7s linear infinite',
        }} />

        <p style={{
          margin: 0,
          color: '#9ca3af',
          fontSize: '14px'
        }}>
          Loading analytics...
        </p>

        <style>
          {`@keyframes spin { to { transform: rotate(360deg); } }`}
        </style>
      </div>
    )
  }

  // ── Error screen ────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        padding: '30px',
        textAlign: 'center',
        backgroundColor: '#fff',
        borderRadius: '14px',
        border: '1px solid #f3f4f6',
        gap: '12px'
      }}>
        <TrendingUp size={32} color="#dc2626" />

        <h2 style={{
          margin: 0,
          fontSize: '18px',
          color: '#111827'
        }}>
          Analytics unavailable
        </h2>

        <p style={{
          margin: 0,
          fontSize: '14px',
          color: '#6b7280'
        }}>
          {error}
        </p>

        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '9px 16px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: '#115e59',
            color: '#fff',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} />
          Try Again
        </button>
      </div>
    )
  }

  if (!data) return null

  // ── Safe data extraction ────────────────────────────────────────────────────

  const {
    leadsPerMonth = [],
    bookingsOverTime = [],
    topDestinations = [],
    conversionBySource = [],
    summary = {},
  } = data

  const safeLeadsPerMonth = Array.isArray(leadsPerMonth)
    ? leadsPerMonth
    : []

  const safeBookingsOverTime = Array.isArray(bookingsOverTime)
    ? bookingsOverTime
    : []

  const safeTopDestinations = Array.isArray(topDestinations)
    ? topDestinations
    : []

  const safeConversionBySource = Array.isArray(conversionBySource)
    ? conversionBySource
    : []

  // ── KPI data ────────────────────────────────────────────────────────────────

  const kpis = [
    {
      label: 'Total Revenue',
      value: summary.totalRevenue ?? '₹0',
      icon: DollarSign,
      color: '#7c3aed',
    },
    {
      label: 'Total Leads',
      value: summary.totalLeads ?? 0,
      icon: Users,
      color: '#0f766e',
    },
    {
      label: 'Conversion Rate',
      value: summary.conversionRate ?? '0%',
      icon: TrendingUp,
      color: '#2563eb',
    },
    {
      label: 'Avg Deal Size',
      value: summary.avgDealSize ?? '₹0',
      icon: Award,
      color: '#d97706',
    },
  ]

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: '700',
            color: '#111827'
          }}>
            Analytics
          </h1>

          <p style={{
            margin: '4px 0 0',
            fontSize: '14px',
            color: '#9ca3af'
          }}>
            Performance overview based on your actual data
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '9px 16px',
            borderRadius: '10px',
            border: '1px solid #e5e7eb',
            backgroundColor: '#fff',
            fontSize: '13px',
            color: '#374151',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={e => {
            if (!loading) e.currentTarget.style.backgroundColor = '#f9fafb'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = '#fff'
          }}
        >
          <RefreshCw
            size={14}
            style={{
              animation: loading ? 'spin 0.7s linear infinite' : 'none'
            }}
          />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Summary KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '14px'
      }}>
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            style={{
              backgroundColor: '#fff',
              border: '1px solid #f3f4f6',
              borderLeft: `4px solid ${color}`,
              borderRadius: '12px',
              padding: '18px 20px',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '10px'
            }}>
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                {label}
              </p>

              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: `${color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon size={15} color={color} />
              </div>
            </div>

            <p style={{
              margin: 0,
              fontSize: '26px',
              fontWeight: '700',
              color: '#111827',
              lineHeight: 1
            }}>
              {value}
            </p>

            <p style={{
              margin: '6px 0 0',
              fontSize: '12px',
              color: '#9ca3af'
            }}>
              Current database total
            </p>
          </div>
        ))}
      </div>

      {/* Row 1: Leads and bookings charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px'
      }}>

        {/* Leads per Month */}
        <Card>
          <ChartTitle
            icon={BarChart2}
            title="Leads per Month"
            subtitle="Total vs converted leads"
          />

          {safeLeadsPerMonth.length === 0 ? (
            <p style={{
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '13px',
              padding: '70px 0'
            }}>
              No lead data available yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={safeLeadsPerMonth}
                barGap={4}
                barCategoryGap="30%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f3f4f6"
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip content={<CustomTooltip />} />

                <Legend
                  wrapperStyle={{
                    fontSize: '12px',
                    paddingTop: '12px'
                  }}
                  formatter={v => (
                    <span style={{ color: '#6b7280' }}>{v}</span>
                  )}
                />

                <Bar
                  dataKey="leads"
                  name="Total Leads"
                  fill="#bfdbfe"
                  radius={[4, 4, 0, 0]}
                />

                <Bar
                  dataKey="converted"
                  name="Converted"
                  fill="#0f766e"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Bookings Over Time */}
        <Card>
          <ChartTitle
            icon={TrendingUp}
            title="Bookings Over Time"
            subtitle="Weekly confirmed bookings and revenue"
            color="#2563eb"
          />

          {safeBookingsOverTime.length === 0 ? (
            <p style={{
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '13px',
              padding: '70px 0'
            }}>
              No booking data available yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={safeBookingsOverTime}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f3f4f6"
                  vertical={false}
                />

                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  yAxisId="left"
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip content={<CustomTooltip />} />

                <Legend
                  wrapperStyle={{
                    fontSize: '12px',
                    paddingTop: '12px'
                  }}
                  formatter={v => (
                    <span style={{ color: '#6b7280' }}>{v}</span>
                  )}
                />

                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="bookings"
                  name="Bookings"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ fill: '#2563eb', r: 4 }}
                  activeDot={{ r: 6 }}
                />

                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue (₹)"
                  stroke="#0f766e"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Row 2: Destinations and source conversion */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px'
      }}>

        {/* Top Destinations */}
        <Card>
          <ChartTitle
            icon={MapPin}
            title="Top Destinations"
            subtitle="Confirmed bookings by destination"
            color="#d97706"
          />

          {safeTopDestinations.length === 0 ? (
            <p style={{
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '13px',
              padding: '70px 0'
            }}>
              No destination booking data available yet.
            </p>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px'
            }}>
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie
                    data={safeTopDestinations}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {safeTopDestinations.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color || '#9ca3af'}
                        opacity={
                          activeIndex === null || activeIndex === index
                            ? 1
                            : 0.5
                        }
                        stroke="none"
                      />
                    ))}
                  </Pie>

                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {safeTopDestinations.map((d, i) => (
                  <div
                    key={d.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 8px',
                      borderRadius: '7px',
                      cursor: 'default',
                      backgroundColor:
                        activeIndex === i
                          ? `${d.color || '#9ca3af'}12`
                          : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px'
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: d.color || '#9ca3af',
                        flexShrink: 0,
                        display: 'inline-block'
                      }} />

                      <span style={{
                        fontSize: '12px',
                        color: '#374151'
                      }}>
                        {d.name}
                      </span>
                    </div>

                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#111827'
                    }}>
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Leads by Source */}
        <Card>
          <ChartTitle
            icon={Users}
            title="Leads by Source"
            subtitle="Conversion rate per channel"
            color="#7c3aed"
          />

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            marginTop: '4px'
          }}>
            {safeConversionBySource.map(({
              source,
              leads,
              converted
            }) => {
              const rate = leads > 0
                ? Math.round((converted / leads) * 100)
                : 0

              return (
                <div key={source}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '5px'
                  }}>
                    <span style={{
                      fontSize: '13px',
                      color: '#374151',
                      fontWeight: '500'
                    }}>
                      {source}
                    </span>

                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        fontSize: '11px',
                        color: '#9ca3af'
                      }}>
                        {converted}/{leads} converted
                      </span>

                      <span style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        backgroundColor:
                          rate >= 50
                            ? '#f0fdfa'
                            : rate >= 30
                              ? '#fffbeb'
                              : '#f9fafb',
                        color:
                          rate >= 50
                            ? '#0f766e'
                            : rate >= 30
                              ? '#d97706'
                              : '#6b7280',
                      }}>
                        {rate}%
                      </span>
                    </div>
                  </div>

                  <div style={{
                    height: '7px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '999px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      borderRadius: '999px',
                      backgroundColor:
                        rate >= 50
                          ? '#0f766e'
                          : rate >= 30
                            ? '#d97706'
                            : '#9ca3af',
                      width: `${rate}%`,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              )
            })}

            {safeConversionBySource.length === 0 && (
              <p style={{
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: '13px',
                padding: '30px 0'
              }}>
                No lead source data available yet.
              </p>
            )}
          </div>
        </Card>
      </div>

      <style>
        {`@keyframes spin { to { transform: rotate(360deg); } }`}
      </style>
    </div>
  )
}

export default Analytics
