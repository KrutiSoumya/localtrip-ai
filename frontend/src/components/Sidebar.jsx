import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Map,
  BarChart2,
  Settings,
  LogOut,
  X,
  CircleHelp,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { label: 'Dashboard',         icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Leads',             icon: Users,           path: '/leads'     },
  { label: 'Bookings',          icon: Calendar,        path: '/bookings'  },
  { label: 'Itinerary Builder', icon: Map,             path: '/itinerary' },
  { label: 'Analytics',         icon: BarChart2,       path: '/analytics' },
  { label: 'Guide',             icon: CircleHelp,      path: '/guide'     },
]

// ─────────────────────────────────────────────────────────────────────────────
// THEME  (Maha Gauri: deep maroon, cream silk, antique gold, peach)
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  maroon: '#5a1626',
  maroonDeep: '#3b0c18',
  maroonLift: '#7a2336',
  cream: '#f6ecd9',
  gold: '#d4a95c',
  goldDeep: '#a8742a',
  peach: '#f3c9a3',
  text: '#f6ecd9',
  muted: 'rgba(246, 236, 217, 0.66)',
  serif: "'Cormorant Garamond', Georgia, serif",
  sans: "'Poppins', system-ui, sans-serif",
}

// Subtle jaali (lattice) pattern, inline SVG so there are no extra assets.
const jaali = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'>
     <path d='M18 2 L34 18 L18 34 L2 18 Z' fill='none' stroke='#d4a95c' stroke-width='.6'/>
     <circle cx='18' cy='18' r='1.6' fill='#d4a95c'/>
   </svg>`
)

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Poppins:wght@400;500&display=swap');

.bt-side {
  --mx: 50%; --my: 0%;
  font-family: ${T.sans};
  isolation: isolate;
  background: linear-gradient(180deg, ${T.maroon} 0%, ${T.maroonDeep} 100%);
  color: ${T.text};
}
.bt-side > * { position: relative; z-index: 1; }
.bt-side { -ms-overflow-style: none; scrollbar-width: none; }
.bt-side::-webkit-scrollbar { display: none; }

/* faint lattice that only shows near the cursor */
.bt-side::after {
  content: '';
  position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background-image: url("data:image/svg+xml,${jaali}");
  opacity: .07;
  -webkit-mask-image: radial-gradient(260px circle at var(--mx) var(--my), #000 0%, transparent 75%);
          mask-image: radial-gradient(260px circle at var(--mx) var(--my), #000 0%, transparent 75%);
  transition: opacity .5s ease;
}
.bt-side:hover::after { opacity: .5; }

/* cursor glow: warm gold over rose */
.bt-side::before {
  content: '';
  position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(200px circle at var(--mx) var(--my), rgba(212, 169, 92, 0.14), transparent 70%),
    radial-gradient(320px circle at var(--mx) var(--my), rgba(122, 35, 54, 0.55), transparent 75%);
  opacity: 0;
  transition: opacity .45s ease;
}
.bt-side:hover::before { opacity: 1; }

/* logo plaque: the logo image fills it edge to edge, so no inner box shows */
.bt-logo {
  position: relative;
  background: #f2f0e4;           /* same as the logo file's own background */
  border-radius: 16px;
  height: 104px;
  overflow: hidden;
  transition: transform .35s cubic-bezier(.34, 1.56, .64, 1), box-shadow .3s ease;
}
.bt-logo img {
  position: absolute; top: 50%; left: 50%;
  width: 330px; max-width: none; height: auto;   /* big: the artwork sits in the middle of a padded file */
  transform: translate(calc(-50% - 10px), -50%);
  display: block;
}
/* gold inner border drawn above the image */
.bt-logo::before {
  content: '';
  position: absolute; inset: 4px; z-index: 2; pointer-events: none;
  border: 1px solid ${T.gold}; border-radius: 12px;
}
/* gold shimmer sweeps across the logo once on load, and again on hover */
.bt-logo::after {
  content: '';
  position: absolute; top: 0; bottom: 0; left: -60%; width: 40%;
  background: linear-gradient(100deg, transparent, rgba(212, 169, 92, .45), transparent);
  transform: skewX(-18deg);
  animation: btShine 1.4s ease .5s 1 both;
  pointer-events: none;
}
.bt-logo:hover::after { animation: btShine 1s ease 1 both; }
.bt-logo:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 6px 18px rgba(0,0,0,.35); }
@keyframes btShine { from { left: -60%; } to { left: 130%; } }

/* nav item: cream silk drapes in from the left, gold thread draws under the label */
.bt-nav {
  position: relative; overflow: hidden;
  display: flex; align-items: center; gap: 12px;
  width: 100%; padding: clamp(5px, 1vh, 9px) 12px clamp(5px, 1vh, 9px) 9px; white-space: nowrap;
  border: 1px solid transparent; border-radius: 999px 18px 18px 999px;
  background: transparent; color: ${T.muted};
  font-family: ${T.serif}; font-size: 17px; font-weight: 600; letter-spacing: .01em; text-align: left;
  cursor: pointer;
  transition: color .3s ease, border-color .3s ease, transform .25s ease;
  animation: btIn .6s cubic-bezier(.2, .8, .2, 1) both;
  animation-delay: calc(var(--i, 0) * 70ms + 150ms);
}
@keyframes btIn {
  from { opacity: 0; transform: translateX(-18px); }
  to   { opacity: 1; transform: translateX(0); }
}
.bt-nav::before {
  content: '';
  position: absolute; inset: 0; z-index: 0;
  background: linear-gradient(100deg, ${T.cream} 0%, ${T.peach} 100%);
  transform: translateX(-101%);
  transition: transform .45s cubic-bezier(.65, 0, .2, 1);
}
.bt-nav > * { position: relative; z-index: 1; }

/* icon sits in a jharokha (arched window) tile */
.bt-nav .ico {
  display: flex; align-items: center; justify-content: center;
  width: 31px; height: 35px; flex-shrink: 0;
  border-radius: 50% 50% 7px 7px / 60% 60% 7px 7px;
  border: 1px solid rgba(212, 169, 92, .45);
  color: ${T.gold};
  transition: transform .45s cubic-bezier(.34, 1.56, .64, 1), background .3s ease, color .3s ease, border-color .3s ease;
}
.bt-nav .lblwrap { position: relative; display: inline-block; transition: transform .3s ease; }
.bt-nav .brush {
  position: absolute; left: 0; bottom: -4px; width: 100%; height: 7px; overflow: visible;
}
.bt-nav .brush path {
  fill: none; stroke: ${T.goldDeep}; stroke-width: 2; stroke-linecap: round;
  stroke-dasharray: 1; stroke-dashoffset: 1;
  transition: stroke-dashoffset .55s ease .1s;
}

.bt-nav:hover { color: ${T.maroonDeep}; border-color: rgba(212, 169, 92, .6); }
.bt-nav:hover::before { transform: translateX(0); }
.bt-nav:hover .ico {
  transform: translateY(-3px) rotate(-8deg) scale(1.08);
  background: ${T.maroon}; color: ${T.gold}; border-color: ${T.maroon};
}
.bt-nav:hover .lblwrap { transform: translateX(3px); }
.bt-nav:hover .brush path { stroke-dashoffset: 0; }
.bt-nav:active { transform: scale(.97); }

/* active: stays maroon-lifted with a gold arch tile and tick, so hover (cream) reads as a different state */
.bt-nav.active {
  color: ${T.cream};
  background: linear-gradient(100deg, ${T.maroonLift} 0%, rgba(122, 35, 54, .35) 100%);
  border-color: rgba(212, 169, 92, .55);
}
.bt-nav.active .ico { background: ${T.gold}; color: ${T.maroonDeep}; border-color: ${T.gold}; }
.bt-nav.active .brush path { stroke: ${T.gold}; stroke-dashoffset: 0; }
.bt-nav.active:hover { color: ${T.maroonDeep}; }
.bt-nav.active:hover .brush path { stroke: ${T.goldDeep}; }

.bt-nav .tick {
  margin-left: auto; width: 7px; height: 7px; flex-shrink: 0;
  background: ${T.gold}; transform: rotate(45deg) scale(0);
  transition: transform .4s cubic-bezier(.34, 1.56, .64, 1);
}
.bt-nav.active .tick { transform: rotate(45deg) scale(1); }
.bt-nav.active:hover .tick { background: ${T.goldDeep}; }

.bt-side button:focus:not(:focus-visible) { outline: none; }
.bt-side button:focus-visible { outline: 2px solid ${T.gold}; outline-offset: 2px; }

/* gold hairline divider with a small diamond in the middle */
.bt-rule {
  position: relative; border: none; height: 1px; margin: 14px 20px;
  background: linear-gradient(90deg, transparent, rgba(212, 169, 92, .55), transparent);
  overflow: visible;
}
.bt-rule::after {
  content: ''; position: absolute; left: 50%; top: 50%;
  width: 7px; height: 7px; background: ${T.gold};
  transform: translate(-50%, -50%) rotate(45deg);
  box-shadow: 0 0 0 3px ${T.maroonDeep};
}

/* user card: cream silk */
.bt-user {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 11px; margin-top: 8px; border-radius: 17px;
  background: linear-gradient(135deg, ${T.cream}, ${T.peach});
  box-shadow: inset 0 0 0 1px rgba(168, 116, 42, .35);
  transition: transform .3s cubic-bezier(.34, 1.56, .64, 1), box-shadow .3s ease;
}
.bt-user:hover { transform: translateY(-2px); box-shadow: inset 0 0 0 1px ${T.goldDeep}, 0 8px 18px rgba(0,0,0,.3); }
.bt-avatar {
  width: 32px; height: 37px; flex-shrink: 0;
  border-radius: 50% 50% 7px 7px / 60% 60% 7px 7px;
  background: ${T.maroon}; color: ${T.gold};
  border: 1px solid ${T.gold};
  display: flex; align-items: center; justify-content: center;
  font-family: ${T.serif}; font-weight: 700; font-size: 17px;
  transition: transform .45s cubic-bezier(.34, 1.56, .64, 1);
}
.bt-user:hover .bt-avatar { transform: rotate(-8deg) scale(1.08); }
.bt-user .bt-name { color: ${T.maroonDeep}; }
.bt-user .bt-mail { color: rgba(59, 12, 24, .65); }

.bt-logout {
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 30px; height: 30px; border: none; border-radius: 50%; cursor: pointer;
  background: transparent; color: ${T.maroon};
  transition: background .2s ease, color .2s ease;
}
.bt-logout svg { transition: transform .3s ease; }
.bt-logout:hover { background: ${T.maroon}; color: ${T.gold}; }
.bt-logout:hover svg { transform: translateX(3px); }

.bt-close { transition: background .2s ease, transform .3s ease; }
.bt-close:hover { background: rgba(246, 236, 217, 0.14) !important; transform: rotate(90deg); }

@media (max-width: 1023px) {
  .sidebar-close-btn { display: flex !important; }
}
@media (max-height: 700px) {
  .bt-nav { padding-top: 4px; padding-bottom: 4px; font-size: 15.5px; }
  .bt-nav .ico { width: 26px; height: 30px; }
  .bt-logo { height: 80px; }
  .bt-logo img { width: 255px; transform: translate(calc(-50% - 8px), -50%); }
  .bt-rule { margin: 8px 20px; }
}
@media (prefers-reduced-motion: reduce) {
  .bt-side *, .bt-side *::before, .bt-side *::after { transition: none !important; animation: none !important; }
}
`

// Hand-drawn style gold thread under the label.
const Brush = () => (
  <svg className="brush" viewBox="0 0 100 7" preserveAspectRatio="none" aria-hidden="true">
    <path d="M1 4.5 C 22 1.5, 55 6.5, 99 2" pathLength="1" />
  </svg>
)

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

function Sidebar({ onClose }) {
  const location = useLocation()
  const navigate  = useNavigate()
  const { logout, user } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleNav = (path) => {
    navigate(path)
    if (onClose) onClose() // close sidebar on mobile after navigating
  }

  // Moves the glow with the cursor (sets CSS vars directly, no re-render).
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

  const settingsActive = location.pathname === '/settings'

  return (
    <aside
      className="bt-side"
      onMouseMove={handleMouseMove}
      style={{
        width: '240px',
        height: '100vh',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        borderRight: '1px solid rgba(212, 169, 92, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 50,
      }}
    >
      <style>{css}</style>

      {/* ── Logo + mobile close button ─────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 16px',
          marginBottom: '22px',
          justifyContent: 'space-between',
        }}
      >
        <div className="bt-logo" style={{ flex: 1, minWidth: 0 }}>
          <img
            src="https://raw.githubusercontent.com/krithi575/pp_images/main/logo.png"
            alt="LocalTrip AI"
          />
        </div>

        {/* Close button, only visible on mobile */}
        <button
          onClick={onClose}
          className="sidebar-close-btn bt-close"
          aria-label="Close menu"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'none', // hidden on desktop, shown via CSS on mobile
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <X size={18} color={T.text} />
        </button>
      </div>

      {/* ── Nav Items ──────────────────────────────────────────────── */}
      <nav
        style={{
          flex: 1,
          padding: '0 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(4px, 1.1vh, 10px)',
        }}
      >
        {navItems.map(({ label, icon: Icon, path }, i) => {
          const isActive = location.pathname === path
          return (
            <button
              key={path}
              className={`bt-nav${isActive ? ' active' : ''}`}
              style={{ '--i': i }}
              onClick={() => handleNav(path)}
            >
              <span className="ico">
                <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
              </span>
              <span className="lblwrap">
                {label}
                <Brush />
              </span>
              <span className="tick" />
            </button>
          )
        })}
      </nav>

      <hr className="bt-rule" />

      {/* ── Bottom Section ─────────────────────────────────────────── */}
      <div
        style={{
          padding: '0 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {/* Settings */}
        <button
          className={`bt-nav${settingsActive ? ' active' : ''}`}
          style={{ '--i': navItems.length }}
          onClick={() => handleNav('/settings')}
        >
          <span className="ico">
            <Settings size={17} strokeWidth={1.8} />
          </span>
          <span className="lblwrap">
            Settings
            <Brush />
          </span>
          <span className="tick" />
        </button>

        {/* User + Logout */}
        <div className="bt-user">
          <div className="bt-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              className="bt-name"
              style={{
                margin: 0,
                fontFamily: T.serif,
                fontSize: '15.5px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.name || 'Agent'}
            </p>
            <p
              className="bt-mail"
              style={{
                margin: 0,
                fontSize: '11px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.email || ''}
            </p>
          </div>

          <button
            className="bt-logout"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
