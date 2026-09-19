import { useState, useEffect, useRef } from 'react'
import { Search, Bell, X, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const mockResults = [
  { id: 1,  type: 'Lead',    name: 'Priya Sharma',    sub: 'Bali · Hot',         path: '/leads/1'    },
  { id: 2,  type: 'Lead',    name: 'Rahul Mehta',     sub: 'Manali · Warm',      path: '/leads/2'    },
  { id: 5,  type: 'Lead',    name: 'Kapoor Family',   sub: 'Goa · Hot',          path: '/leads/5'    },
  { id: 8,  type: 'Lead',    name: 'Ananya Iyer',     sub: 'Maldives · Hot',     path: '/leads/8'    },
  { id: 11, type: 'Booking', name: 'Ravi Tiwari',     sub: 'Bangkok · Dec 20',   path: '/bookings'   },
  { id: 12, type: 'Booking', name: 'Pooja Agarwal',   sub: 'Ladakh · Confirmed', path: '/bookings'   },
  { id: 6,  type: 'Booking', name: 'Neha Joshi',      sub: 'Paris · Dec 28',     path: '/bookings'   },
]

const typeMeta = {
  Lead:    { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
  Booking: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
}

function Navbar({ onMenuClick }) {
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState([])
  const [grouped, setGrouped]       = useState({})
  const [searching, setSearching]   = useState(false)
  const [showDrop, setShowDrop]     = useState(false)
  const [notifications]             = useState(3)
  const [activeIdx, setActiveIdx]   = useState(-1)

  const debounceRef = useRef(null)
  const searchRef   = useRef(null)
  const inputRef    = useRef(null)

  // ── Search ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 3) {
      setResults([]); setGrouped({}); setShowDrop(false); setActiveIdx(-1)
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true)
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`)
        const data = res.data?.results || []
        setResults(data)
        setGrouped(data.reduce((acc, item) => {
          acc[item.type] = [...(acc[item.type] || []), item]
          return acc
        }, {}))
        setShowDrop(true)
      } catch {
        // Fallback mock search
        const q = query.toLowerCase()
        const filtered = mockResults.filter(r =>
          r.name.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q)
        )
        setResults(filtered)
        setGrouped(filtered.reduce((acc, item) => {
          acc[item.type] = [...(acc[item.type] || []), item]
          return acc
        }, {}))
        setShowDrop(true)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  // ── Close on outside click ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDrop(false); setActiveIdx(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Keyboard navigation ──────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (!showDrop) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
    if (e.key === 'Enter' && activeIdx >= 0) { handleSelect(results[activeIdx]); e.preventDefault() }
    if (e.key === 'Escape') { setShowDrop(false); setActiveIdx(-1); inputRef.current?.blur() }
  }

  const handleSelect = (item) => {
    setQuery(''); setShowDrop(false); setActiveIdx(-1)
    navigate(item.path)
  }

  const clearSearch = () => {
    setQuery(''); setResults([]); setGrouped({}); setShowDrop(false)
    inputRef.current?.focus()
  }

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // Flatten results in group order for keyboard nav
  const flatResults = Object.values(grouped).flat()

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 40,
      width: '100%', backgroundColor: '#fff',
      borderBottom: '1px solid #f3f4f6',
      padding: '0 24px', height: '64px',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: '16px',
      boxSizing: 'border-box',
    }}>

      {/* ── Hamburger (mobile) ──────────────────────────────────────────────── */}
      <button
        onClick={onMenuClick}
        className="lg-hide"
        style={{
          display: 'none',
          background: 'none', border: '1px solid #e5e7eb',
          borderRadius: '8px', padding: '6px', cursor: 'pointer',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        <Menu size={18} color="#6b7280" />
      </button>

      {/* ── Greeting ───────────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column' }} className="greeting-hide">
        <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
          {getGreeting()}, {user?.name?.split(' ')[0] || 'Agent'} 👋
        </p>
        <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: '440px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          backgroundColor: '#f9fafb', border: `1px solid ${showDrop ? '#0f766e' : '#e5e7eb'}`,
          borderRadius: showDrop ? '10px 10px 0 0' : '10px',
          padding: '0 14px', height: '38px', transition: 'border-color 0.15s',
        }}>
          {searching
            ? <div style={{
                width: '15px', height: '15px', borderRadius: '50%',
                border: '2px solid #d1d5db', borderTopColor: '#0f766e',
                animation: 'spin 0.6s linear infinite', flexShrink: 0,
              }} />
            : <Search size={14} color={showDrop ? '#0f766e' : '#9ca3af'} style={{ flexShrink: 0 }} />
          }
          <input
            ref={inputRef}
            type="text"
            placeholder="Search leads, bookings... (3+ chars)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowDrop(true)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              outline: 'none', fontSize: '13px', color: '#111827',
              minWidth: 0,
            }}
          />
          {query && (
            <button onClick={clearSearch} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '2px', display: 'flex', flexShrink: 0,
            }}>
              <X size={13} color="#9ca3af" />
            </button>
          )}
        </div>

        {/* ── Dropdown ─────────────────────────────────────────────────────── */}
        {showDrop && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            backgroundColor: '#fff', border: '1px solid #e5e7eb',
            borderTop: 'none', borderRadius: '0 0 12px 12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            zIndex: 100, overflow: 'hidden',
            maxHeight: '380px', overflowY: 'auto',
          }}>
            {flatResults.length === 0 && !searching ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
                  No results for "{query}"
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#d1d5db' }}>
                  Try searching by name, destination, or email
                </p>
              </div>
            ) : (
              Object.entries(grouped).map(([type, items]) => {
                const meta = typeMeta[type] || typeMeta.Lead
                return (
                  <div key={type}>
                    {/* Group header */}
                    <div style={{
                      padding: '8px 14px 4px',
                      display: 'flex', alignItems: 'center', gap: '7px',
                      backgroundColor: '#fafafa',
                      borderBottom: '1px solid #f9fafb',
                    }}>
                      <span style={{
                        fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px',
                        textTransform: 'uppercase', color: meta.color,
                      }}>{type}s</span>
                      <span style={{
                        fontSize: '10px', padding: '1px 6px', borderRadius: '999px',
                        backgroundColor: meta.bg, color: meta.color, fontWeight: '600',
                      }}>{items.length}</span>
                    </div>

                    {/* Results */}
                    {items.map((item) => {
                      const flatIdx = flatResults.indexOf(item)
                      const isActive = flatIdx === activeIdx
                      return (
                        <button
                          key={`${item.type}-${item.id}`}
                          onClick={() => handleSelect(item)}
                          style={{
                            width: '100%', textAlign: 'left',
                            padding: '10px 14px', border: 'none',
                            backgroundColor: isActive ? meta.bg : '#fff',
                            cursor: 'pointer', display: 'flex',
                            alignItems: 'center', gap: '10px',
                            borderBottom: '1px solid #f9fafb',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = meta.bg}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = isActive ? meta.bg : '#fff'}
                        >
                          {/* Avatar */}
                          <div style={{
                            width: '30px', height: '30px', borderRadius: '8px',
                            backgroundColor: meta.bg, border: `1px solid ${meta.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: '600', color: meta.color, flexShrink: 0,
                          }}>
                            {item.name.charAt(0)}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              margin: 0, fontSize: '13px', fontWeight: '500', color: '#111827',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {/* Highlight matched text */}
                              {item.name}
                            </p>
                            <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                              {item.sub}
                            </p>
                          </div>

                          {/* Type tag */}
                          <span style={{
                            fontSize: '10px', padding: '2px 8px', borderRadius: '999px',
                            backgroundColor: meta.bg, color: meta.color,
                            border: `1px solid ${meta.border}`,
                            fontWeight: '600', flexShrink: 0,
                          }}>
                            {type}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )
              })
            )}

            {/* Footer hint */}
            {flatResults.length > 0 && (
              <div style={{
                padding: '8px 14px', backgroundColor: '#fafafa',
                borderTop: '1px solid #f3f4f6',
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                  {flatResults.length} result{flatResults.length !== 1 ? 's' : ''} found
                </span>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                  ↑↓ navigate · Enter to open · Esc to close
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right: Bell + Avatar ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <button style={{
          position: 'relative', background: 'none',
          border: '1px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer',
          width: '38px', height: '38px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Bell size={17} color="#6b7280" />
          {notifications > 0 && (
            <span style={{
              position: 'absolute', top: '7px', right: '7px',
              width: '7px', height: '7px', borderRadius: '50%',
              backgroundColor: '#ef4444', border: '1.5px solid #fff',
            }} />
          )}
        </button>

        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          backgroundColor: '#ccfbf1', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: '600', color: '#0f766e',
          cursor: 'pointer', border: '2px solid #99f6e4', flexShrink: 0,
        }}>
          {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .lg-hide { display: flex !important; }
          .greeting-hide { display: none !important; }
        }
      `}</style>
    </header>
  )
}

export default Navbar