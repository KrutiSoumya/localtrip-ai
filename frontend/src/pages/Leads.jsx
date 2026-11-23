import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Plus, Search, Filter,
  Eye, Trash2, Mail,
  ChevronUp, ChevronDown, RefreshCw
} from 'lucide-react'
import api, { getLeads } from '../services/api'

const LOCAL_LEADS_KEY = 'localtrip_leads'

const publishLocalLeads = (items) => {
  try {
    localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(items))
    window.dispatchEvent(new Event('localtrip:leads-updated'))
  } catch (error) {
    console.error('Unable to sync leads with dashboard:', error)
  }
}

// ── Theme ─────────────────────────────────────────────────────────────────────

const T = {
  maroon:    '#7a0c12',
  maroonDk:  '#3f0509',
  green:     '#0f4a3a',
  greenLt:   '#1f6b4f',
  cream:     '#fdf6c3',
  creamSoft: '#fffbe0',
  orange:    '#f26a3c',
  ink:       '#2b0a0c',
}

const scoreMeta = {
  Hot:  { bg: '#fbe0dc', color: '#a31621', dot: '#e0352b' },
  Warm: { bg: '#fcebc4', color: '#9a5b00', dot: '#e8a317' },
  Cold: { bg: '#dcebf2', color: '#1d5877', dot: '#4a9cc2' },
}

const statusMeta = {
  New:          { bg: '#efe8c0', color: '#6b5d1f' },
  Contacted:    { bg: '#d9ece4', color: '#0f4a3a' },
  Quoted:       { bg: '#fcdfc4', color: '#a14a10' },
  Negotiating:  { bg: '#ecd6e0', color: '#6d1f45' },
  Confirmed:    { bg: '#0f4a3a', color: '#fdf6c3' },
  Closed:       { bg: '#7a0c12', color: '#fdf6c3' },
}

const SortIcon = ({ field, sortField, sortDir }) => (
  <span style={{ marginLeft: '4px', opacity: sortField === field ? 1 : 0.4, verticalAlign: 'middle' }}>
    {sortField === field && sortDir === 'desc'
      ? <ChevronDown size={13} />
      : <ChevronUp size={13} />}
  </span>
)

const ScoreBadge = ({ score }) => {
  const meta = scoreMeta[score] || scoreMeta.Cold
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '3px 11px', borderRadius: '999px',
      backgroundColor: meta.bg, color: meta.color,
      fontSize: '12px', fontWeight: '600',
    }}>
      <span style={{
        width: '6px', height: '6px', borderRadius: '50%',
        backgroundColor: meta.dot, flexShrink: 0,
      }} />
      {score}
    </span>
  )
}

const StatusBadge = ({ status }) => {
  const meta = statusMeta[status] || statusMeta.New
  return (
    <span style={{
      padding: '3px 11px', borderRadius: '999px',
      backgroundColor: meta.bg, color: meta.color,
      fontSize: '12px', fontWeight: '600',
    }}>
      {status}
    </span>
  )
}

// ── Decorative SVGs (purely visual) ───────────────────────────────────────────

const Leaves = ({ className, flip }) => (
  <svg
    className={className}
    viewBox="0 0 220 160"
    aria-hidden="true"
    style={{ transform: flip ? 'scaleX(-1)' : undefined }}
  >
    <g fill={T.greenLt} stroke="#0a3a2c" strokeWidth="1">
      <path d="M0 10 C40 6 80 22 118 58" fill="none" stroke="#0a3a2c" strokeWidth="2" />
      <ellipse cx="38" cy="30" rx="26" ry="9" transform="rotate(28 38 30)" />
      <ellipse cx="62" cy="14" rx="24" ry="8" transform="rotate(-18 62 14)" />
      <ellipse cx="78" cy="48" rx="28" ry="9" transform="rotate(42 78 48)" />
      <ellipse cx="104" cy="32" rx="24" ry="8" transform="rotate(-8 104 32)" />
      <ellipse cx="112" cy="68" rx="26" ry="9" transform="rotate(58 112 68)" />
      <ellipse cx="22" cy="58" rx="24" ry="8" transform="rotate(62 22 58)" />
    </g>
  </svg>
)

const Temple = () => (
  <svg className="lt-temple" viewBox="0 0 600 170" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
    <g fill="rgba(253,246,195,0.10)">
      <path d="M220 130 C220 70 260 50 300 28 C340 50 380 70 380 130 Z" />
      <rect x="298" y="8" width="4" height="22" />
      <path d="M150 130 C150 100 170 88 185 76 C200 88 220 100 220 130 Z" />
      <path d="M380 130 C380 100 400 88 415 76 C430 88 450 100 450 130 Z" />
      <rect x="104" y="66" width="10" height="64" />
      <path d="M102 66 C102 56 109 52 109 46 C109 52 116 56 116 66 Z" />
      <rect x="486" y="66" width="10" height="64" />
      <path d="M484 66 C484 56 491 52 491 46 C491 52 498 56 498 66 Z" />
      <rect x="90" y="130" width="420" height="40" />
    </g>
  </svg>
)

// ─────────────────────────────────────────────────────────────────────────────

function Leads() {
  const navigate = useNavigate()

  const [leads, setLeads]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [search, setSearch]         = useState('')
  const [scoreFilter, setScoreFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortField, setSortField]   = useState(null)
  const [sortDir, setSortDir]       = useState('asc')
  const [deletingId, setDeletingId] = useState(null)

  // ── Fetch leads ─────────────────────────────────────────────────────────────
  const fetchLeads = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getLeads()
      const fetchedLeads = Array.isArray(res.data) ? res.data : []
      setLeads(fetchedLeads)
      publishLocalLeads(fetchedLeads)
    } catch (error) {
      setLeads([])
      setError(error.response?.data?.message || 'Could not load leads.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLeads() }, [])

  // Permanently delete a lead through the backend API
  const handleDeleteLead = async (lead) => {
    const leadName = lead.customer_name || lead.name || 'this lead'

    if (!window.confirm(
      `Delete ${leadName}? This will permanently delete the lead and its associated bookings and itineraries.`
    )) {
      return
    }

    try {
      setDeletingId(lead.id)

      await api.delete(`/leads/${lead.id}`)

      setLeads((prev) => {
        const updated = prev.filter((item) => item.id !== lead.id)
        publishLocalLeads(updated)
        return updated
      })
    } catch (error) {
      console.error('Delete lead error:', error)
      window.alert(
        error.response?.data?.message ||
        'Could not delete this lead. Please try again.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  // ── Sort handler ─────────────────────────────────────────────────────────────
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  // ── Filter + sort ────────────────────────────────────────────────────────────
  const filtered = leads
    .filter(l => {
      const q = search.toLowerCase()
      return (
        l.name?.toLowerCase().includes(q) ||
        l.destination?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q)
      )
    })
    .filter(l => scoreFilter  === 'All' || l.score  === scoreFilter)
    .filter(l => {
      if (statusFilter === 'All') return true
      if (statusFilter === 'Lost') return l.status === 'Closed'
      return l.status === statusFilter
    })
    .sort((a, b) => {
      if (!sortField) return 0
      const valA = a[sortField] ?? ''
      const valB = b[sortField] ?? ''
      return sortDir === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA))
    })

  const thStyle = (field) => ({
    cursor: field ? 'pointer' : 'default',
  })

  // ── Counts ───────────────────────────────────────────────────────────────────
  const hotCount  = leads.filter(l => l.score === 'Hot').length
  const warmCount = leads.filter(l => l.score === 'Warm').length
  const coldCount = leads.filter(l => l.score === 'Cold').length

  return (
    <div
      className="lt-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        position: 'relative',
        isolation: 'isolate',
        backgroundColor: 'transparent',
        borderRadius: 0,
        padding: '12px',
      }}
    >
      {/* Full-viewport background image, extending to the screen edges. */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
          backgroundColor: '#ffffff',
          backgroundImage: `linear-gradient(rgba(253, 246, 195, 0.82), rgba(253, 246, 195, 0.82)), url("https://raw.githubusercontent.com/krithi575/pp_images/main/loginbg.png")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* ── Hero header ────────────────────────────────────────────────────── */}
      <header className="lt-hero">
        <Leaves className="lt-leaf lt-leaf-a" />
        <Leaves className="lt-leaf lt-leaf-b" flip />
        <Temple />

        <div className="lt-hero-inner">
          <div className="lt-hero-text">
            <h1 className="lt-title">Leads</h1>
            <p className="lt-sub">
              {leads.length} travellers in your pipeline
            </p>
            <div className="lt-chips">
              <span className="lt-chip"><i style={{ background: scoreMeta.Hot.dot }} />{hotCount} hot</span>
              <span className="lt-chip"><i style={{ background: scoreMeta.Warm.dot }} />{warmCount} warm</span>
              <span className="lt-chip"><i style={{ background: scoreMeta.Cold.dot }} />{coldCount} cold</span>
            </div>
          </div>

          <button className="lt-add" onClick={() => navigate('/leads/new')}>
            <Plus size={16} />
            Add Lead
          </button>
        </div>
      </header>

      {/* ── Filters band ───────────────────────────────────────────────────── */}
      <section className="lt-filters">

        {/* Search */}
        <div className="lt-search">
          <Search size={14} color={T.maroon} />
          <input
            type="text"
            placeholder="Search name, destination, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Score filter pills */}
        <div className="lt-score-row">
          <Filter size={14} color={T.cream} style={{ opacity: 0.7 }} />
          {['All', 'Hot', 'Warm', 'Cold'].map(s => (
            <button
              key={s}
              onClick={() => setScoreFilter(s)}
              className={`lt-pill ${scoreFilter === s ? 'is-active' : ''}`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Status filter tabs */}
        <div className="lt-tabs">
          {['All', 'New', 'Quoted', 'Confirmed', 'Lost'].map(s => {
            const isActive = statusFilter === s
            const count = s === 'All'
              ? leads.length
              : leads.filter(l => l.status === (s === 'Lost' ? 'Closed' : s)).length
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`lt-tab ${isActive ? 'is-active' : ''}`}
              >
                {s}
                <span className="lt-tab-count">{count}</span>
              </button>
            )
          })}
        </div>

        {/* Refresh */}
        <button onClick={fetchLeads} className="lt-refresh" title="Refresh">
          <RefreshCw size={14} className={loading ? 'lt-spin' : ''} />
        </button>

      </section>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <section className="lt-card">

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="lt-loader" />
            <p style={{ margin: 0, fontSize: '14px', color: '#8a6a55' }}>Loading leads...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: '#a31621', fontSize: '14px' }}>{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Users size={36} color="#c9b88a" style={{ margin: '0 auto 12px' }} />
            <p className="lt-serif" style={{ margin: 0, fontSize: '18px', color: T.maroon }}>No leads found</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#8a6a55' }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>

              {/* Table Head */}
              <thead>
                <tr className="lt-thead-row">
                  <th className="lt-th" style={thStyle('name')}    onClick={() => handleSort('name')}>
                    Customer Name <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th className="lt-th" style={thStyle('destination')} onClick={() => handleSort('destination')}>
                    Destination <SortIcon field="destination" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th className="lt-th" style={thStyle('budget')}  onClick={() => handleSort('budget')}>
                    Budget <SortIcon field="budget" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th className="lt-th" style={thStyle('score')}   onClick={() => handleSort('score')}>
                    Score <SortIcon field="score" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th className="lt-th" style={thStyle('status')}  onClick={() => handleSort('status')}>
                    Status <SortIcon field="status" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th className="lt-th" style={thStyle(null)}>Actions</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {filtered.map((lead, i) => (
                  <tr
                    key={lead.id}
                    className="lt-row"
                    style={{
                      '--accent': scoreMeta[lead.score]?.dot || '#c9b88a',
                      animationDelay: `${Math.min(i, 8) * 45}ms`,
                    }}
                  >

                    {/* Name + contact */}
                    <td style={{ padding: '9px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="lt-avatar">
                          {(lead.name || lead.customer_name || lead.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: T.ink }}>
                            {lead.name || lead.customer_name}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#8a6a55' }}>
                            {lead.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Destination */}
                    <td style={{ padding: '9px 14px', fontSize: '13px', color: '#4a2a26' }}>
                      {lead.destination}
                    </td>

                    {/* Budget */}
                    <td style={{ padding: '9px 14px', fontSize: '14px', fontWeight: '600', color: T.maroon }}>
                      {lead.budget}
                    </td>

                    {/* Score badge */}
                    <td style={{ padding: '9px 14px' }}>
                      <ScoreBadge score={lead.score} />
                    </td>

                    {/* Status badge */}
                    <td style={{ padding: '9px 14px' }}>
                      <StatusBadge status={lead.status} />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '9px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>

                        {/* View */}
                        <button
                          className="lt-icon-btn lt-view"
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          title="View lead"
                        >
                          <Eye size={13} />
                        </button>

                        {/* Email */}
                        <button
                          className="lt-icon-btn lt-mail"
                          onClick={() => window.open(`mailto:${lead.email}`)}
                          title="Email lead"
                        >
                          <Mail size={13} />
                        </button>

                        {/* Delete */}
                        <button
                          className="lt-icon-btn lt-del"
                          onClick={() => handleDeleteLead(lead)}
                          disabled={deletingId === lead.id}
                          title="Delete lead"
                          style={{
                            cursor: deletingId === lead.id ? 'not-allowed' : 'pointer',
                            opacity: deletingId === lead.id ? 0.5 : 1,
                          }}
                        >
                          <Trash2 size={13} />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        {!loading && filtered.length > 0 && (
          <div className="lt-footer">
            <p style={{ margin: 0, fontSize: '13px' }}>
              Showing {filtered.length} of {leads.length} leads
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['Hot', 'Warm', 'Cold'].filter(score => leads.some(l => l.score === score)).map(score => (
                <span key={score} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                  <span style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    backgroundColor: scoreMeta[score]?.dot,
                    display: 'inline-block',
                  }} />
                  {leads.filter(l => l.score === score).length} {score}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,700;1,500;1,700&family=Marcellus&family=DM+Sans:wght@400;500;600&display=swap');

        .lt-page { font-family: 'DM Sans', system-ui, sans-serif; }
        .lt-serif { font-family: 'Marcellus', serif; }

        /* ── Hero ── */
        .lt-hero {
          position: relative; overflow: hidden; border-radius: 18px;
          background:
            repeating-radial-gradient(circle at 88% 130%, rgba(253,246,195,0.07) 0 2px, transparent 2px 16px),
            linear-gradient(135deg, ${T.maroonDk} 0%, ${T.maroon} 100%);
          padding: 18px 26px; min-height: 0;
          box-shadow: 0 10px 28px rgba(63,5,9,0.22);
          animation: lt-enter .6s ease both;
        }
        .lt-hero-inner {
          position: relative; z-index: 2;
          display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap;
        }
        .lt-title {
          margin: 0; font-family: 'Cormorant Garamond', serif; font-style: italic;
          font-weight: 700; font-size: 40px; line-height: 1; color: ${T.cream};
          letter-spacing: 0.5px;
        }
        .lt-sub { margin: 4px 0 10px; font-size: 13px; color: rgba(253,246,195,0.75); }
        .lt-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .lt-chip {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 500;
          color: ${T.cream}; border: 1px solid rgba(253,246,195,0.35);
        }
        .lt-chip i { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }

        .lt-temple {
          position: absolute; right: 0; bottom: 0; height: 100%; width: auto; max-width: 70%;
          z-index: 1; pointer-events: none;
        }
        .lt-leaf { position: absolute; z-index: 1; width: 100px; pointer-events: none; transform-origin: 0 0; }
        .lt-leaf-a { top: -6px; left: -10px; animation: lt-sway 7s ease-in-out infinite; }
        .lt-leaf-b { top: -6px; right: 28%; width: 80px; opacity: .85; animation: lt-sway 9s ease-in-out infinite reverse; }

        .lt-add {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 7px 16px; border-radius: 999px; cursor: pointer;
          background: transparent; color: ${T.cream};
          border: 1.5px solid ${T.cream};
          font-family: inherit; font-size: 13px; font-weight: 600;
          transition: background .2s ease, color .2s ease, transform .2s ease;
        }
        .lt-add:hover { background: ${T.cream}; color: ${T.maroon}; transform: translateY(-1px); }
        .lt-add:active { transform: translateY(0); }

        /* ── Filters ── */
        .lt-filters {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          background: ${T.green}; border-radius: 14px; padding: 10px 14px;
          box-shadow: 0 6px 18px rgba(15,74,58,0.2);
          animation: lt-enter .6s ease .1s both;
        }
        .lt-search {
          display: flex; align-items: center; gap: 8px;
          background: ${T.creamSoft}; border-radius: 999px;
          padding: 0 14px; height: 32px; flex: 1; min-width: 180px; max-width: 280px;
          border: 2px solid transparent; transition: border-color .2s ease;
        }
        .lt-search:focus-within { border-color: ${T.orange}; }
        .lt-search input {
          flex: 1; border: none; outline: none; background: transparent;
          font-family: inherit; font-size: 12px; color: ${T.ink};
        }
        .lt-score-row { display: flex; gap: 6px; align-items: center; }
        .lt-pill {
          padding: 3px 12px; border-radius: 999px; cursor: pointer;
          border: 1px solid rgba(253,246,195,0.4); background: transparent; color: ${T.cream};
          font-family: inherit; font-size: 12px; font-weight: 500;
          transition: background .2s ease, color .2s ease, border-color .2s ease;
        }
        .lt-pill:hover { background: rgba(253,246,195,0.14); }
        .lt-pill.is-active { background: ${T.orange}; border-color: ${T.orange}; color: #fff; }

        .lt-tabs { display: flex; background: rgba(0,0,0,0.22); border-radius: 999px; padding: 3px; gap: 2px; }
        .lt-tab {
          display: flex; align-items: center; gap: 6px; white-space: nowrap;
          padding: 4px 11px; border-radius: 999px; border: none; cursor: pointer;
          background: transparent; color: rgba(253,246,195,0.8);
          font-family: inherit; font-size: 12px; font-weight: 400;
          transition: background .2s ease, color .2s ease;
        }
        .lt-tab:hover { background: rgba(253,246,195,0.1); }
        .lt-tab.is-active { background: ${T.cream}; color: ${T.maroon}; font-weight: 600; }
        .lt-tab-count {
          font-size: 11px; font-weight: 500; padding: 1px 7px; border-radius: 999px;
          background: rgba(253,246,195,0.18); color: ${T.cream};
        }
        .lt-tab.is-active .lt-tab-count { background: ${T.maroon}; color: ${T.cream}; }

        .lt-refresh {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 50%; cursor: pointer;
          border: 1px solid rgba(253,246,195,0.4); background: transparent; color: ${T.cream};
          transition: background .2s ease;
        }
        .lt-refresh:hover { background: rgba(253,246,195,0.14); }
        .lt-refresh:hover svg { transform: rotate(90deg); }
        .lt-refresh svg { transition: transform .3s ease; }
        .lt-spin { animation: lt-rotate .8s linear infinite; }

        /* ── Table card ── */
        .lt-card {
          background: ${T.creamSoft}; border-radius: 18px; overflow: hidden;
          border: 1px solid rgba(122,12,18,0.15);
          box-shadow: 0 10px 28px rgba(63,5,9,0.12);
          animation: lt-enter .6s ease .2s both;
        }
        .lt-thead-row { background: ${T.maroon}; }
        .lt-th {
          padding: 10px 14px; text-align: left; white-space: nowrap; user-select: none;
          font-family: 'Marcellus', serif; font-weight: 400; font-size: 13px;
          letter-spacing: 0.3px; color: ${T.cream};
        }
        .lt-th svg { display: inline-block; vertical-align: middle; }
        .lt-row {
          border-bottom: 1px solid rgba(122,12,18,0.09);
          animation: lt-row-in .45s ease both;
          transition: background-color .2s ease;
        }
        .lt-row:last-child { border-bottom: none; }
        .lt-row td:first-child { box-shadow: inset 3px 0 0 transparent; transition: box-shadow .2s ease; }
        .lt-row:hover { background-color: rgba(122,12,18,0.05); }
        .lt-row:hover td:first-child { box-shadow: inset 3px 0 0 var(--accent); }

        .lt-avatar {
          width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: ${T.cream}; color: ${T.maroon};
          border: 1.5px solid ${T.maroon};
          font-family: 'Marcellus', serif; font-size: 13px;
          transition: transform .2s ease;
        }
        .lt-row:hover .lt-avatar { transform: rotate(-4deg) scale(1.05); }

        .lt-icon-btn {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          background: #fff; border: 1px solid rgba(122,12,18,0.18);
          transition: transform .18s ease, background-color .18s ease, color .18s ease, border-color .18s ease;
        }
        .lt-icon-btn:hover:not(:disabled) { transform: translateY(-2px); }
        .lt-view { color: ${T.green}; }
        .lt-view:hover:not(:disabled) { background: ${T.green}; color: ${T.cream}; border-color: ${T.green}; }
        .lt-mail { color: #6d1f45; }
        .lt-mail:hover:not(:disabled) { background: #6d1f45; color: ${T.cream}; border-color: #6d1f45; }
        .lt-del  { color: #a31621; }
        .lt-del:hover:not(:disabled)  { background: ${T.maroon}; color: ${T.cream}; border-color: ${T.maroon}; }

        .lt-footer {
          padding: 8px 18px; display: flex; justify-content: space-between; align-items: center;
          background: ${T.maroon}; color: rgba(253,246,195,0.85);
        }

        .lt-loader {
          width: 32px; height: 32px; border-radius: 50%; margin: 0 auto 12px;
          border: 3px solid rgba(122,12,18,0.15); border-top-color: ${T.maroon};
          animation: lt-rotate .8s linear infinite;
        }

        /* ── Motion ── */
        @keyframes lt-enter   { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes lt-row-in  { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes lt-sway    { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(3deg); } }
        @keyframes lt-rotate  { to { transform: rotate(360deg); } }
        @keyframes spin       { to { transform: rotate(360deg); } }

        @media (max-width: 720px) {
          .lt-title { font-size: 34px; }
          .lt-hero { padding: 24px 20px; }
          .lt-leaf-b { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .lt-hero, .lt-filters, .lt-card, .lt-row, .lt-leaf { animation: none !important; }
          .lt-icon-btn, .lt-avatar, .lt-add, .lt-refresh svg { transition: none !important; }
        }
      `}</style>
    </div>
  )
}

export default Leads