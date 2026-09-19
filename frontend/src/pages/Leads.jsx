import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Plus, Search, Filter,
  Eye, Trash2, Phone, Mail,
  ChevronUp, ChevronDown, RefreshCw
} from 'lucide-react'
import { getLeads } from '../services/api'

// ── Mock fallback data ────────────────────────────────────────────────────────

const mockLeads = [
  { id: 1,  name: 'Priya Sharma',    destination: 'Bali, Indonesia',      budget: '₹85,000',  score: 'Hot',  status: 'Quoted',      lastContact: '2 hrs ago',   phone: '+91 98765 43210', email: 'priya@email.com'  },
  { id: 2,  name: 'Rahul Mehta',     destination: 'Manali, Himachal',     budget: '₹45,000',  score: 'Warm', status: 'Contacted',   lastContact: '1 day ago',   phone: '+91 91234 56789', email: 'rahul@email.com'  },
  { id: 3,  name: 'Sunita Rao',      destination: 'Dubai, UAE',           budget: '₹1,20,000',score: 'Hot',  status: 'Negotiating', lastContact: '3 hrs ago',   phone: '+91 99887 76655', email: 'sunita@email.com' },
  { id: 4,  name: 'Arjun Verma',     destination: 'Kerala Backwaters',    budget: '₹60,000',  score: 'Warm', status: 'New',         lastContact: '3 days ago',  phone: '+91 87654 32109', email: 'arjun@email.com'  },
  { id: 5,  name: 'Kapoor Family',   destination: 'Goa, India',           budget: '₹1,50,000',score: 'Hot',  status: 'Confirmed',   lastContact: '5 hrs ago',   phone: '+91 70000 11223', email: 'kapoor@email.com' },
  { id: 6,  name: 'Neha Joshi',      destination: 'Paris, France',        budget: '₹2,00,000',score: 'Warm', status: 'Quoted',      lastContact: '2 days ago',  phone: '+91 81234 00987', email: 'neha@email.com'   },
  { id: 7,  name: 'Vikram Singh',    destination: 'Rajasthan Circuit',    budget: '₹55,000',  score: 'Cold', status: 'New',         lastContact: '1 week ago',  phone: '+91 94321 12345', email: 'vikram@email.com' },
  { id: 8,  name: 'Ananya Iyer',     destination: 'Maldives',             budget: '₹3,00,000',score: 'Hot',  status: 'Negotiating', lastContact: 'Just now',    phone: '+91 96543 21987', email: 'ananya@email.com' },
  { id: 9,  name: 'Deepak Nair',     destination: 'Singapore + Malaysia', budget: '₹95,000',  score: 'Cold', status: 'Contacted',   lastContact: '5 days ago',  phone: '+91 78901 23456', email: 'deepak@email.com' },
  { id: 10, name: 'Meera Pillai',    destination: 'Shimla, Himachal',     budget: '₹35,000',  score: 'Warm', status: 'New',         lastContact: '4 days ago',  phone: '+91 77665 54433', email: 'meera@email.com'  },
  { id: 11, name: 'Ravi Tiwari',     destination: 'Thailand — Bangkok',   budget: '₹75,000',  score: 'Hot',  status: 'Quoted',      lastContact: '1 day ago',   phone: '+91 90011 22334', email: 'ravi@email.com'   },
  { id: 12, name: 'Pooja Agarwal',   destination: 'Leh Ladakh',          budget: '₹70,000',  score: 'Cold', status: 'Closed',      lastContact: '2 weeks ago', phone: '+91 82345 67890', email: 'pooja@email.com'  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const scoreMeta = {
  Hot:  { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
  Warm: { bg: '#fffbeb', color: '#d97706', dot: '#f59e0b' },
  Cold: { bg: '#f0f9ff', color: '#0369a1', dot: '#38bdf8' },
}

const statusMeta = {
  New:          { bg: '#f3f4f6', color: '#6b7280' },
  Contacted:    { bg: '#eff6ff', color: '#2563eb' },
  Quoted:       { bg: '#fffbeb', color: '#d97706' },
  Negotiating:  { bg: '#f5f3ff', color: '#7c3aed' },
  Confirmed:    { bg: '#f0fdfa', color: '#0f766e' },
  Closed:       { bg: '#fef2f2', color: '#dc2626' },
}

const ScoreBadge = ({ score }) => {
  const meta = scoreMeta[score] || scoreMeta.Cold
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '999px',
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
      padding: '3px 10px', borderRadius: '999px',
      backgroundColor: meta.bg, color: meta.color,
      fontSize: '12px', fontWeight: '500',
    }}>
      {status}
    </span>
  )
}

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

  // ── Fetch leads ─────────────────────────────────────────────────────────────
  const fetchLeads = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getLeads()
      setLeads(res.data || [])
    } catch {
      setLeads(mockLeads)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLeads() }, [])

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

  const SortIcon = ({ field }) => (
    <span style={{ marginLeft: '4px', opacity: sortField === field ? 1 : 0.3 }}>
      {sortField === field && sortDir === 'desc'
        ? <ChevronDown size={13} />
        : <ChevronUp size={13} />}
    </span>
  )

  const thStyle = (field) => ({
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    cursor: field ? 'pointer' : 'default',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  })

  // ── Counts for filter pills ──────────────────────────────────────────────────
  const hotCount  = leads.filter(l => l.score === 'Hot').length
  const warmCount = leads.filter(l => l.score === 'Warm').length
  const coldCount = leads.filter(l => l.score === 'Cold').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#111827' }}>
            Leads
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#9ca3af' }}>
            {leads.length} total leads · {hotCount} hot · {warmCount} warm · {coldCount} cold
          </p>
        </div>
        <button
          onClick={() => navigate('/leads/new')}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '10px 18px', borderRadius: '10px',
            backgroundColor: '#115e59', color: '#fff',
            border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: '600',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0f766e'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#115e59'}
        >
          <Plus size={16} />
          Add Lead
        </button>
      </div>

      {/* ── Filters bar ────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
      }}>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          backgroundColor: '#fff', border: '1px solid #e5e7eb',
          borderRadius: '10px', padding: '0 14px', height: '38px',
          flex: '1', minWidth: '200px', maxWidth: '320px',
        }}>
          <Search size={14} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search name, destination, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: '13px', color: '#111827', background: 'transparent',
            }}
          />
        </div>

        {/* Score filter pills */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Filter size={14} color="#9ca3af" />
          {['All', 'Hot', 'Warm', 'Cold'].map(s => (
            <button key={s} onClick={() => setScoreFilter(s)} style={{
              padding: '5px 14px', borderRadius: '999px',
              border: `1px solid ${scoreFilter === s ? '#115e59' : '#e5e7eb'}`,
              backgroundColor: scoreFilter === s ? '#115e59' : '#fff',
              color: scoreFilter === s ? '#fff' : '#6b7280',
              fontSize: '12px', fontWeight: '500', cursor: 'pointer',
            }}>
              {s}
            </button>
          ))}
        </div>

        {/* Status filter tabs */}
<div style={{
  display: 'flex',
  backgroundColor: '#f3f4f6',
  borderRadius: '10px',
  padding: '3px',
  gap: '2px',
}}>
  {['All', 'New', 'Quoted', 'Confirmed', 'Lost'].map(s => {
    const isActive = statusFilter === s
    const count = s === 'All'
      ? leads.length
      : leads.filter(l => l.status === s).length
    return (
      <button
        key={s}
        onClick={() => setStatusFilter(s)}
        style={{
          padding: '6px 14px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: isActive ? '600' : '400',
          backgroundColor: isActive ? '#fff' : 'transparent',
          color: isActive ? '#111827' : '#6b7280',
          boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          transition: 'all 0.15s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          whiteSpace: 'nowrap',
        }}
      >
        {s}
        <span style={{
          fontSize: '11px',
          fontWeight: '500',
          padding: '1px 6px',
          borderRadius: '999px',
          backgroundColor: isActive ? '#f0fdfa' : '#e5e7eb',
          color: isActive ? '#0f766e' : '#9ca3af',
        }}>
          {count}
        </span>
      </button>
    )
  })}
</div>

        {/* Refresh */}
        <button onClick={fetchLeads} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '38px', height: '38px', borderRadius: '10px',
          border: '1px solid #e5e7eb', backgroundColor: '#fff',
          cursor: 'pointer',
        }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
          title="Refresh"
        >
          <RefreshCw size={14} color="#6b7280" />
        </button>

      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: '#fff', border: '1px solid #f3f4f6',
        borderRadius: '14px', overflow: 'hidden',
      }}>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              border: '3px solid #e5e7eb', borderTopColor: '#0f766e',
              animation: 'spin 0.7s linear infinite',
              margin: '0 auto 12px',
            }} />
            <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>Loading leads...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: '#dc2626', fontSize: '14px' }}>{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Users size={36} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: '15px', fontWeight: '500', color: '#6b7280' }}>No leads found</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9ca3af' }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>

              {/* Table Head */}
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: '#fafafa' }}>
                  <th style={thStyle('name')}    onClick={() => handleSort('name')}>
                    Customer Name <SortIcon field="name" />
                  </th>
                  <th style={thStyle('destination')} onClick={() => handleSort('destination')}>
                    Destination <SortIcon field="destination" />
                  </th>
                  <th style={thStyle('budget')}  onClick={() => handleSort('budget')}>
                    Budget <SortIcon field="budget" />
                  </th>
                  <th style={thStyle('score')}   onClick={() => handleSort('score')}>
                    Score <SortIcon field="score" />
                  </th>
                  <th style={thStyle('status')}  onClick={() => handleSort('status')}>
                    Status <SortIcon field="status" />
                  </th>
                  <th style={thStyle('lastContact')} onClick={() => handleSort('lastContact')}>
                    Last Contact <SortIcon field="lastContact" />
                  </th>
                  <th style={thStyle(null)}>Actions</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {filtered.map((lead, i) => (
                  <tr key={lead.id} style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid #f9fafb' : 'none',
                    transition: 'background 0.1s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >

                    {/* Name + contact */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '50%',
                          backgroundColor: '#f0fdfa', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: '600', color: '#0f766e',
                        }}>
                          {lead.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                            {lead.name}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                            {lead.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Destination */}
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151' }}>
                      {lead.destination}
                    </td>

                    {/* Budget */}
                    <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '500', color: '#111827' }}>
                      {lead.budget}
                    </td>

                    {/* Score badge */}
                    <td style={{ padding: '14px 16px' }}>
                      <ScoreBadge score={lead.score} />
                    </td>

                    {/* Status badge */}
                    <td style={{ padding: '14px 16px' }}>
                      <StatusBadge status={lead.status} />
                    </td>

                    {/* Last contact */}
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#9ca3af' }}>
                      {lead.lastContact}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>

                        {/* View */}
                        <button
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          title="View lead"
                          style={{
                            width: '30px', height: '30px', borderRadius: '8px',
                            border: '1px solid #e5e7eb', backgroundColor: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0fdfa'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
                        >
                          <Eye size={14} color="#0f766e" />
                        </button>

                        {/* Call */}
                        <button
                          onClick={() => window.open(`tel:${lead.phone}`)}
                          title="Call lead"
                          style={{
                            width: '30px', height: '30px', borderRadius: '8px',
                            border: '1px solid #e5e7eb', backgroundColor: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#eff6ff'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
                        >
                          <Phone size={14} color="#2563eb" />
                        </button>

                        {/* Email */}
                        <button
                          onClick={() => window.open(`mailto:${lead.email}`)}
                          title="Email lead"
                          style={{
                            width: '30px', height: '30px', borderRadius: '8px',
                            border: '1px solid #e5e7eb', backgroundColor: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f3ff'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
                        >
                          <Mail size={14} color="#7c3aed" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete lead for ${lead.name}?`)) {
                              setLeads(prev => prev.filter(l => l.id !== lead.id))
                            }
                          }}
                          title="Delete lead"
                          style={{
                            width: '30px', height: '30px', borderRadius: '8px',
                            border: '1px solid #e5e7eb', backgroundColor: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
                        >
                          <Trash2 size={14} color="#dc2626" />
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
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid #f3f4f6',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
              Showing {filtered.length} of {leads.length} leads
            </p>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[...new Set(leads.map(l => l.score))].map(score => (
                <span key={score} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#9ca3af' }}>
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    backgroundColor: scoreMeta[score]?.dot,
                    display: 'inline-block',
                  }} />
                  {leads.filter(l => l.score === score).length} {score}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default Leads