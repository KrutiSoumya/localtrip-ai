import { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'
import {
  TrendingUp, Users, DollarSign, CreditCard, BarChart2,
  MapPin, RefreshCw, Award
} from 'lucide-react'
import { getAnalytics } from '../services/api'

// ── UI-only constants ─────────────────────────────────────────────────────────

const PIE_PALETTE = ['#5C1020', '#C9A765', '#2B1810', '#8A2A3C', '#E0CBA0', '#A9803A']
const AXIS_TICK = { fontSize: 13, fill: '#6B5648' }
const GRID_STROKE = 'rgba(43,24,16,0.14)'

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Jost:wght@400;500;600;700&display=swap');

.adn-root {
  --maroon: #5C1020;
  --maroon-soft: #8A2A3C;
  --gold: #C9A765;
  --ivory: #F3E8D0;
  --espresso: #2B1810;
  --offwhite: #FBF8F2;
  --paper: #FFFDF8;
  --ink: #1E110B;
  --display: 'Cormorant Garamond', Georgia, serif;
  --body: 'Jost', system-ui, sans-serif;
  font-family: var(--body);
  font-size: 14px;
  font-variant-numeric: lining-nums;
  color: var(--espresso);
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
}
.adn-root *, .adn-root *::before, .adn-root *::after { box-sizing: border-box; }
.adn-display {
  font-family: var(--display);
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.01em;
  line-height: 1.1;
}
.adn-root button { font-family: inherit; }
.adn-root :focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

/* Hero */
.adn-hero {
  position: relative; overflow: hidden;
  background: var(--maroon); color: var(--offwhite);
  border-radius: 16px; padding: 20px 24px 22px;
}
.adn-hero h1 { position: relative; z-index: 2; margin: 0; font-size: clamp(24px, 3vw, 32px); max-width: 24em; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 500; }
.adn-hero p { position: relative; z-index: 2; margin: 6px 0 0; font-size: 14px; font-weight: 500; opacity: 0.9; max-width: 40em; }
.adn-blob { position: absolute; background: var(--gold); opacity: 0.9; animation: adn-morph 11s ease-in-out infinite, adn-drift 17s ease-in-out infinite; }
.adn-blob.one { width: 150px; height: 130px; left: -50px; top: -60px; }
.adn-blob.two { width: 110px; height: 100px; right: 24%; bottom: -62px; animation-delay: -4s, -7s; background: var(--maroon-soft); }
.adn-blob.three { width: 100px; height: 90px; right: -30px; top: -30px; animation-delay: -2s, -3s; }
.adn-splat { position: absolute; right: 5%; top: 10px; z-index: 1; animation: adn-spin 26s linear infinite; }

/* Buttons: flat, small */
.adn-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 7px 14px; border-radius: 999px;
  border: 1.5px solid var(--espresso);
  background: var(--gold); color: var(--espresso);
  font-size: 13px; font-weight: 700; cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.2s;
}
.adn-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 2px 0 var(--espresso); }
.adn-btn:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
.adn-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.adn-btn.green { background: var(--espresso); color: var(--offwhite); }
.adn-btn.maroon { background: var(--maroon); color: var(--offwhite); }
.adn-btn.cream { background: var(--offwhite); color: var(--espresso); }
.adn-btn.yellow { background: var(--ivory); color: var(--espresso); }
.adn-btn.ghost { background: transparent; color: var(--offwhite); border-color: rgba(251,248,242,0.7); }
.adn-btn.ghost:hover:not(:disabled) { box-shadow: 0 2px 0 rgba(251,248,242,0.5); }
.adn-btn.block { width: 100%; }
.adn-btn.small { padding: 3px 10px; font-size: 13px; }
.adn-spin { animation: adn-spin 0.8s linear infinite; }
.adn-spin-slow { animation: adn-spin 7s linear infinite; }

/* Cards */
.adn-card { background: var(--ivory); border-radius: 16px; padding: 12px; display: flex; flex-direction: column; }
.adn-panel { background: var(--offwhite); border-radius: 12px; padding: 14px; flex: 1; }
.adn-pop { animation: adn-pop 0.5s cubic-bezier(.2,1.2,.4,1) both; }

@keyframes adn-morph {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
}
@keyframes adn-drift {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(18px, 10px) rotate(14deg); }
}
@keyframes adn-spin { to { transform: rotate(360deg); } }
@keyframes adn-wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}
@keyframes adn-pop {
  from { opacity: 0; transform: translateY(14px) scale(0.97); }
  to { opacity: 1; transform: none; }
}
@keyframes adn-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }

/* Hero extras */
.adn-hero.row { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.adn-hero-text { position: relative; z-index: 2; }
.adn-hero .adn-btn { position: relative; z-index: 2; }

/* KPIs */
.an-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.an-kpi { background: var(--ivory); border-radius: 14px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; animation: adn-pop 0.5s cubic-bezier(.2,1.2,.4,1) both; transition: transform 0.2s; }
.an-kpi:hover { transform: translateY(-2px); }
.an-kpi.hot { background: var(--maroon); color: var(--offwhite); }
.an-kpi-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.an-kpi-top small { font-size: 13px; font-weight: 600; }
.an-kpi-ico { width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: var(--espresso); color: var(--offwhite); transition: transform 0.3s; }
.an-kpi:hover .an-kpi-ico { transform: rotate(-14deg) scale(1.1); }
.an-kpi.hot .an-kpi-ico { background: var(--gold); color: var(--espresso); }
.an-kpi strong { font-family: var(--display); font-weight: 600; font-size: clamp(30px, 3.2vw, 38px); line-height: 1; }
.an-kpi em { font-style: normal; font-size: 13px; font-weight: 500; opacity: 0.7; }

/* Chart cards */
.an-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: stretch; }
.adn-card { animation: adn-pop 0.5s cubic-bezier(.2,1.2,.4,1) both; }
.an-grid2 .adn-card:nth-child(2) { animation-delay: 0.1s; }
.an-head { display: flex; align-items: center; gap: 10px; padding: 0 4px 10px; }
.an-head-ico { width: 26px; height: 26px; border-radius: 50%; background: var(--espresso); color: var(--offwhite); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.an-head h2 { margin: 0; font-size: 22px; color: var(--espresso); }
.an-head p { margin: 2px 0 0; font-size: 13px; font-weight: 500; opacity: 0.7; }
.an-empty { text-align: center; padding: 40px 12px; border: 1.5px dashed rgba(43,24,16,0.3); border-radius: 10px; font-size: 13px; font-weight: 600; }

/* Pie legend */
.an-pie { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.an-pie-chart { flex: 1 1 170px; min-width: 170px; }
.an-legend { flex: 1 1 130px; display: flex; flex-direction: column; gap: 4px; }
.an-legend-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 5px 10px; border-radius: 999px; cursor: default; transition: background 0.15s, transform 0.2s; }
.an-legend-row.on { background: var(--ivory); transform: translateX(3px); }
.an-legend-row span { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; }
.an-legend-row i { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.an-legend-row b { font-family: var(--display); font-weight: 600; font-size: 18px; }

/* Sources */
.an-sources { display: flex; flex-direction: column; gap: 14px; }
.an-src-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 5px; flex-wrap: wrap; }
.an-src-top > span { font-size: 13px; font-weight: 700; }
.an-src-meta { display: flex; gap: 8px; align-items: center; }
.an-src-meta small { font-size: 13px; font-weight: 500; opacity: 0.7; }
.an-badge { font-size: 13px; font-weight: 700; padding: 1px 9px; border-radius: 999px; }
.an-track { height: 8px; background: var(--ivory); border-radius: 999px; overflow: hidden; }
.an-fill { height: 100%; border-radius: 999px; transform-origin: left center; animation: adn-grow 0.9s cubic-bezier(.2,.9,.3,1) both; }

/* Status screens */
.an-center { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; }
.an-loading { min-height: 50vh; }
.an-loading p { margin: 0; font-size: 30px; color: var(--espresso); }
.an-error { min-height: 40vh; background: var(--ivory); border-radius: 16px; padding: 28px 20px; }
.an-error h2 { margin: 0; font-size: 30px; color: var(--espresso); }
.an-error p { margin: 0; font-size: 14px; font-weight: 500; max-width: 34em; }
.an-error-ico { width: 44px; height: 44px; border-radius: 50%; background: var(--maroon); color: var(--offwhite); display: inline-flex; align-items: center; justify-content: center; animation: adn-wiggle 2.4s ease-in-out infinite; }

@media (max-width: 1000px) { .an-kpis { grid-template-columns: 1fr 1fr; } }
@media (max-width: 900px) { .an-grid2 { grid-template-columns: minmax(0, 1fr); } .adn-hero { padding: 16px 18px 18px; } }
@media (max-width: 560px) { .an-kpis { grid-template-columns: minmax(0, 1fr); } }
@media (prefers-reduced-motion: reduce) {
  .adn-root *, .adn-root *::before, .adn-root *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
}
`

// ── Decorative + helper pieces ────────────────────────────────────────────────

function Splat({ className = '', size = 120, color = '#C9A765' }) {
  return (
    <svg className={className} viewBox="0 0 200 200" width={size} height={size} aria-hidden="true">
      <g fill={color}>
        <circle cx="100" cy="100" r="44" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
          <ellipse
            key={a}
            cx="100"
            cy="32"
            rx="16"
            ry={a % 90 === 0 ? 34 : 22}
            transform={`rotate(${a} 100 100)`}
          />
        ))}
      </g>
    </svg>
  )
}

function Backdrop() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        backgroundColor: '#FBF8F2',
      }}
    />
  )
}

// Counts a KPI up from zero. Display only: the real value is restored when it finishes.
function AnimatedValue({ value }) {
  const [shown, setShown] = useState(String(value))

  useEffect(() => {
    const str = String(value)
    const m = str.match(/^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/)
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (!m || reduce) {
      setShown(str)
      return
    }

    const [, pre, num, post] = m
    const target = parseFloat(num.replace(/,/g, ''))

    if (!Number.isFinite(target)) {
      setShown(str)
      return
    }

    const decimals = (num.split('.')[1] || '').length
    const grouped = num.includes(',')
    const fmt = n =>
      grouped
        ? n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : n.toFixed(decimals)

    let raf
    const start = performance.now()
    const duration = 1100

    const tick = now => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setShown(`${pre}${fmt(target * eased)}${post}`)
      if (p < 1) raf = requestAnimationFrame(tick)
      else setShown(str)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return <>{shown}</>
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

const tooltipBox = {
  backgroundColor: '#FBF8F2',
  border: '1.5px solid #1E110B',
  borderRadius: '10px',
  padding: '8px 12px',
  boxShadow: '0 2px 0 #1E110B',
  fontFamily: "'Jost', system-ui, sans-serif",
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null

  return (
    <div style={tooltipBox}>
      <p style={{
        margin: '0 0 6px',
        fontSize: '12px',
        fontWeight: '800',
        color: '#2B1810'
      }}>
        {label}
      </p>

      {payload.map((p, i) => (
        <p key={i} style={{
          margin: '3px 0',
          fontSize: '12px',
          color: '#2B1810',
          display: 'flex',
          alignItems: 'center',
          gap: '7px'
        }}>
          <span style={{
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            backgroundColor: p.color,
            display: 'inline-block'
          }} />
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null

  return (
    <div style={{ ...tooltipBox, padding: '8px 14px' }}>
      <p style={{
        margin: 0,
        fontSize: '13px',
        color: '#2B1810'
      }}>
        <strong>{payload[0].name}</strong>: {payload[0].value} bookings
      </p>
    </div>
  )
}

// ── Card wrapper ──────────────────────────────────────────────────────────────

const Card = ({ children, style = {} }) => (
  <div className="adn-card" style={style}>
    {children}
  </div>
)

const ChartTitle = ({
  icon: Icon,
  title,
  subtitle,
}) => (
  <div className="an-head">
    <span className="an-head-ico">
      <Icon size={17} />
    </span>

    <div>
      <h2 className="adn-display">{title}</h2>

      {subtitle && <p>{subtitle}</p>}
    </div>
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
      <div className="adn-root" style={{ position: 'relative', isolation: 'isolate', padding: '12px' }}>
        <style>{css}</style>
        <Backdrop />

        <div className="an-center an-loading" role="status" aria-live="polite">
          <Splat size={56} className="adn-spin" />
          <p className="adn-display">Crunching the numbers</p>
        </div>
      </div>
    )
  }

  // ── Error screen ────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="adn-root" style={{ position: 'relative', isolation: 'isolate', padding: '12px' }}>
        <style>{css}</style>
        <Backdrop />

        <div className="an-center an-error">
          <span className="an-error-ico">
            <TrendingUp size={26} />
          </span>

          <h2 className="adn-display">Analytics unavailable</h2>

          <p>{error}</p>

          <button
            className="adn-btn maroon"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw size={14} />
            Try again
          </button>
        </div>
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
      label: 'Awaiting Payment',
      value: summary.awaitingPayment ?? '?0',
      icon: CreditCard,
      color: '#dc2626',
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
    <div
      className="adn-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        position: 'relative',
        isolation: 'isolate',
        backgroundColor: 'transparent',
        borderRadius: 0,
        padding: '12px'
      }}
    >
      <style>{css}</style>
      <Backdrop />

      {/* Hero */}
      <header className="adn-hero row">
        <div className="adn-blob one" aria-hidden="true" />
        <div className="adn-blob two" aria-hidden="true" />
        <div className="adn-blob three" aria-hidden="true" />
        <Splat className="adn-splat" size={64} />

        <div className="adn-hero-text">
          <h1 className="adn-display">Analytics</h1>

          <p>Performance overview based on your actual data</p>
        </div>

        <button
          className="adn-btn cream"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw
            size={14}
            className={loading ? 'adn-spin' : ''}
          />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      {/* Summary KPIs */}
      <div className="an-kpis">
        {kpis.map(({ label, value, icon: Icon }, index) => (
          <div
            key={label}
            className={`an-kpi ${index === 0 ? 'hot' : ''}`}
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <div className="an-kpi-top">
              <small>{label}</small>

              <span className="an-kpi-ico">
                <Icon size={17} />
              </span>
            </div>

            <strong>
              <AnimatedValue value={value} />
            </strong>

            <em>Current database total</em>
          </div>
        ))}
      </div>

      {/* Row 1: Leads and bookings charts */}
      <div className="an-grid2">

        {/* Leads per Month */}
        <Card>
          <ChartTitle
            icon={BarChart2}
            title="Leads per Month"
            subtitle="Total vs converted leads"
          />

          <div className="adn-panel">
            {safeLeadsPerMonth.length === 0 ? (
              <p className="an-empty">
                No lead data available yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={safeLeadsPerMonth}
                  barGap={4}
                  barCategoryGap="30%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={GRID_STROKE}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(201,167,101,0.18)' }}
                  />

                  <Legend
                    wrapperStyle={{
                      fontSize: '13px',
                      paddingTop: '12px'
                    }}
                    formatter={v => (
                      <span style={{ color: '#2B1810', fontWeight: 700 }}>{v}</span>
                    )}
                  />

                  <Bar
                    dataKey="leads"
                    name="Total Leads"
                    fill="#C9A765"
                    radius={[5, 5, 0, 0]}
                    animationDuration={1100}
                  />

                  <Bar
                    dataKey="converted"
                    name="Converted"
                    fill="#5C1020"
                    radius={[5, 5, 0, 0]}
                    animationDuration={1100}
                    animationBegin={250}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Bookings Over Time */}
        <Card>
          <ChartTitle
            icon={TrendingUp}
            title="Bookings Over Time"
            subtitle="Weekly confirmed bookings and revenue"
          />

          <div className="adn-panel">
            {safeBookingsOverTime.length === 0 ? (
              <p className="an-empty">
                No booking data available yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={safeBookingsOverTime}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={GRID_STROKE}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="week"
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    yAxisId="left"
                    allowDecimals={false}
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ ...AXIS_TICK, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Legend
                    wrapperStyle={{
                      fontSize: '13px',
                      paddingTop: '12px'
                    }}
                    formatter={v => (
                      <span style={{ color: '#2B1810', fontWeight: 700 }}>{v}</span>
                    )}
                  />

                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="bookings"
                    name="Bookings"
                    stroke="#5C1020"
                    strokeWidth={2.5}
                    dot={{ fill: '#5C1020', r: 4, stroke: '#FBF8F2', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    animationDuration={1400}
                  />

                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue (₹)"
                    stroke="#B08840"
                    strokeWidth={2.5}
                    strokeDasharray="6 5"
                    dot={false}
                    animationDuration={1400}
                    animationBegin={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Row 2: Destinations and source conversion */}
      <div className="an-grid2">

        {/* Top Destinations */}
        <Card>
          <ChartTitle
            icon={MapPin}
            title="Top Destinations"
            subtitle="Confirmed bookings by destination"
          />

          <div className="adn-panel">
            {safeTopDestinations.length === 0 ? (
              <p className="an-empty">
                No destination booking data available yet.
              </p>
            ) : (
              <div className="an-pie">
                <div className="an-pie-chart">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={safeTopDestinations}
                        cx="50%"
                        cy="50%"
                        innerRadius={44}
                        outerRadius={72}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        animationDuration={1200}
                        onMouseEnter={(_, index) => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                      >
                        {safeTopDestinations.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={PIE_PALETTE[index % PIE_PALETTE.length]}
                            opacity={
                              activeIndex === null || activeIndex === index
                                ? 1
                                : 0.45
                            }
                            stroke="#FBF8F2"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>

                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="an-legend">
                  {safeTopDestinations.map((d, i) => (
                    <div
                      key={d.name}
                      className={`an-legend-row ${activeIndex === i ? 'on' : ''}`}
                      onMouseEnter={() => setActiveIndex(i)}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      <span>
                        <i style={{ backgroundColor: PIE_PALETTE[i % PIE_PALETTE.length] }} />
                        {d.name}
                      </span>

                      <b>{d.value}</b>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Leads by Source */}
        <Card>
          <ChartTitle
            icon={Users}
            title="Leads by Source"
            subtitle="Conversion rate per channel"
          />

          <div className="adn-panel">
            <div className="an-sources">
              {safeConversionBySource.map(({
                source,
                leads,
                converted
              }, index) => {
                const rate = leads > 0
                  ? Math.round((converted / leads) * 100)
                  : 0

                const high = rate >= 50
                const mid = rate >= 30

                return (
                  <div key={source}>
                    <div className="an-src-top">
                      <span>{source}</span>

                      <div className="an-src-meta">
                        <small>
                          {converted}/{leads} converted
                        </small>

                        <span
                          className="an-badge"
                          style={{
                            backgroundColor: high
                              ? '#5C1020'
                              : mid
                                ? '#C9A765'
                                : '#F3E8D0',
                            color: high ? '#FBF8F2' : '#2B1810',
                          }}
                        >
                          {rate}%
                        </span>
                      </div>
                    </div>

                    <div className="an-track">
                      <div
                        className="an-fill"
                        style={{
                          backgroundColor: high
                            ? '#5C1020'
                            : mid
                              ? '#C9A765'
                              : '#8A7466',
                          width: `${rate}%`,
                          animationDelay: `${index * 120}ms`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}

              {safeConversionBySource.length === 0 && (
                <p className="an-empty">
                  No lead source data available yet.
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Analytics