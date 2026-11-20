import { useState, useEffect, useRef } from 'react'
import { Search, X, Menu } from 'lucide-react'
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

// ── Design tokens (Theka-inspired neo-brutalist) ───────────────────────────────
const C = {
  ink:     '#3d2523',   // dark coffee brown – borders, shadows, text
  cream:   '#fffbe6',   // header / dropdown surface
  paper:   '#fff4cf',   // slightly deeper cream
  yellow:  '#ffd100',   // primary accent
  purple:  '#cc91c5',   // secondary accent
  muted:   '#8a6b66',
}
const FONT = "'Roboto Slab', Georgia, serif"
const SHADOW    = `3px 3px 0 ${C.ink}`
const SHADOW_SM = `2px 2px 0 ${C.ink}`

const typeMeta = {
  Lead:    { bg: C.purple, color: C.ink, border: C.ink },
  Booking: { bg: C.yellow, color: C.ink, border: C.ink },
}

function Navbar({ onMenuClick }) {
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState([])
  const [grouped, setGrouped]       = useState({})
  const [searching, setSearching]   = useState(false)
  const [showDrop, setShowDrop]     = useState(false)
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

  // Flatten results in group order for keyboard nav
  const flatResults = Object.values(grouped).flat()

  // ── Keyboard navigation ──────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (!showDrop) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, flatResults.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
    if (e.key === 'Enter' && activeIdx >= 0) { handleSelect(flatResults[activeIdx]); e.preventDefault() }
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

  return (
    <header className="nb-header" style={{
      position: 'sticky', top: 0, zIndex: 40,
      width: '100%', backgroundColor: C.cream,
      borderBottom: `3px solid ${C.ink}`,
      padding: '0 24px', height: '68px',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: '16px',
      boxSizing: 'border-box', fontFamily: FONT,
    }}>

      {/* ── Hamburger (mobile) ──────────────────────────────────────────────── */}
      <button
        onClick={onMenuClick}
        className="lg-hide nb-press"
        aria-label="Open menu"
        style={{
          display: 'none',
          backgroundColor: C.yellow, border: `2px solid ${C.ink}`,
          borderRadius: '8px', padding: '6px', cursor: 'pointer',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: SHADOW_SM,
        }}
      >
        <Menu size={18} color={C.ink} strokeWidth={2.5} />
      </button>

      {/* ── Greeting ───────────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '3px' }} className="greeting-hide">
        <p style={{
          margin: 0, fontSize: '16px', fontWeight: 800, color: C.ink,
          letterSpacing: '-0.2px', lineHeight: 1.1,
        }}>
          {getGreeting()}, {user?.name?.split(' ')[0] || 'Agent'} <span style={{ fontWeight: 400 }}>👋</span>
        </p>
        <span style={{
          alignSelf: 'flex-start',
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.6px',
          textTransform: 'uppercase', color: C.cream,
          backgroundColor: C.ink, borderRadius: '999px',
          padding: '2px 9px', lineHeight: 1.4,
        }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: '460px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          backgroundColor: '#fff', border: `2px solid ${C.ink}`,
          borderRadius: showDrop ? '10px 10px 0 0' : '10px',
          padding: '0 14px', height: '42px',
          boxShadow: showDrop ? `3px 3px 0 ${C.purple}` : SHADOW,
          transition: 'box-shadow 0.15s',
        }}>
          {searching
            ? <div style={{
                width: '15px', height: '15px', borderRadius: '50%',
                border: `2px solid ${C.paper}`, borderTopColor: C.ink,
                animation: 'spin 0.6s linear infinite', flexShrink: 0,
              }} />
            : <Search size={15} color={C.ink} strokeWidth={2.5} style={{ flexShrink: 0 }} />
          }
          <input
            ref={inputRef}
            className="nb-input"
            type="text"
            placeholder="Search leads, bookings... (3+ chars)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowDrop(true)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              outline: 'none', fontSize: '13px', fontWeight: 500,
              fontFamily: FONT, color: C.ink, minWidth: 0,
            }}
          />
          {query && (
            <button onClick={clearSearch} aria-label="Clear search" style={{
              backgroundColor: C.yellow, border: `1.5px solid ${C.ink}`,
              borderRadius: '50%', width: '20px', height: '20px',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              padding: 0, flexShrink: 0,
            }}>
              <X size={11} color={C.ink} strokeWidth={3} />
            </button>
          )}
        </div>

        {/* ── Dropdown ─────────────────────────────────────────────────────── */}
        {showDrop && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            backgroundColor: C.cream, border: `2px solid ${C.ink}`,
            borderTop: `2px dashed ${C.ink}`, borderRadius: '0 0 12px 12px',
            boxShadow: `4px 4px 0 ${C.ink}`,
            zIndex: 100, overflow: 'hidden',
            maxHeight: '380px', overflowY: 'auto',
          }}>
            {flatResults.length === 0 && !searching ? (
              <div style={{ padding: '22px 20px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: C.ink }}>
                  No results for "{query}"
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: C.muted }}>
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
                      padding: '10px 14px 6px',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                      <span style={{
                        fontSize: '10px', fontWeight: 800, letterSpacing: '0.8px',
                        textTransform: 'uppercase', color: C.cream,
                        backgroundColor: C.ink, borderRadius: '999px',
                        padding: '3px 10px',
                      }}>{type}s</span>
                      <span style={{
                        fontSize: '11px', fontWeight: 800, color: C.ink,
                        backgroundColor: meta.bg, border: `1.5px solid ${C.ink}`,
                        borderRadius: '999px', padding: '0 7px', lineHeight: '17px',
                      }}>{items.length}</span>
                    </div>

                    {/* Results */}
                    {items.map((item) => {
                      const flatIdx = flatResults.indexOf(item)
                      const isActive = flatIdx === activeIdx
                      return (
                        <button
                          key={`${item.type}-${item.id}`}
                          className="nb-item"
                          data-active={isActive}
                          onClick={() => handleSelect(item)}
                          style={{
                            width: '100%', textAlign: 'left',
                            padding: '10px 14px', border: 'none',
                            borderTop: `1px solid rgba(61,37,35,0.15)`,
                            cursor: 'pointer', display: 'flex',
                            alignItems: 'center', gap: '10px',
                            fontFamily: FONT,
                          }}
                        >
                          {/* Avatar */}
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            backgroundColor: meta.bg, border: `2px solid ${C.ink}`,
                            boxShadow: SHADOW_SM,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: 800, color: C.ink, flexShrink: 0,
                          }}>
                            {item.name.charAt(0)}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              margin: 0, fontSize: '13px', fontWeight: 700, color: C.ink,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {item.name}
                            </p>
                            <p style={{ margin: '1px 0 0', fontSize: '11px', fontWeight: 500, color: C.muted }}>
                              {item.sub}
                            </p>
                          </div>

                          {/* Type tag */}
                          <span style={{
                            fontSize: '10px', padding: '2px 9px', borderRadius: '999px',
                            backgroundColor: meta.bg, color: C.ink,
                            border: `1.5px solid ${C.ink}`,
                            fontWeight: 800, flexShrink: 0,
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
                padding: '8px 14px', backgroundColor: C.ink,
                display: 'flex', justifyContent: 'space-between', gap: '12px',
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: C.yellow }}>
                  {flatResults.length} result{flatResults.length !== 1 ? 's' : ''} found
                </span>
                <span className="kbd-hint" style={{ fontSize: '11px', color: C.cream }}>
                  ↑↓ navigate · Enter to open · Esc to close
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right: Avatar ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div className="nb-press" style={{
          width: '40px', height: '40px', borderRadius: '50%',
          backgroundColor: C.purple, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: '15px', fontWeight: 800, color: C.ink,
          cursor: 'pointer', border: `2px solid ${C.ink}`,
          boxShadow: SHADOW, flexShrink: 0,
        }}>
          {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
        </div>
      </div>

      {/* Zigzag edge, echoing the ticker strip in the reference */}
      <div aria-hidden="true" className="nb-zig" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;500;700;800&display=swap');

        @keyframes spin { to { transform: rotate(360deg); } }

        .nb-header .nb-zig {
          position: absolute; left: 0; right: 0; top: 100%;
          margin-top: 3px; height: 8px; pointer-events: none;
          background:
            linear-gradient(135deg, ${C.ink} 25%, transparent 25%) -4px 0 / 8px 8px,
            linear-gradient(225deg, ${C.ink} 25%, transparent 25%) -4px 0 / 8px 8px;
        }

        .nb-header .nb-input::placeholder { color: ${C.muted}; opacity: 1; }

        .nb-header .nb-item { background-color: ${C.cream}; transition: background-color 0.1s; }
        .nb-header .nb-item:hover,
        .nb-header .nb-item[data-active="true"] { background-color: ${C.yellow}; }
        .nb-header .nb-item:focus-visible { outline: 2px solid ${C.ink}; outline-offset: -2px; }

        .nb-header .nb-press { transition: transform 0.1s, box-shadow 0.1s; }
        .nb-header .nb-press:hover  { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 ${C.ink} !important; }
        .nb-header .nb-press:active { transform: translate(2px, 2px);   box-shadow: 0 0 0 ${C.ink} !important; }
        .nb-header .nb-press:focus-visible { outline: 2px solid ${C.ink}; outline-offset: 2px; }

        @media (prefers-reduced-motion: reduce) {
          .nb-header .nb-press, .nb-header .nb-item { transition: none; }
        }

        @media (max-width: 768px) {
          .lg-hide { display: flex !important; }
          .greeting-hide { display: none !important; }
          .nb-header { padding: 0 14px !important; }
          .nb-header .kbd-hint { display: none; }
        }
      `}</style>
    </header>
  )
}

export default Navbar