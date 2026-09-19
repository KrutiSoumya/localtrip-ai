import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Map,
  BarChart2,
  Settings,
  LogOut,
  Plane,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { label: 'Dashboard',         icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Leads',             icon: Users,           path: '/leads'     },
  { label: 'Bookings',          icon: Calendar,        path: '/bookings'  },
  { label: 'Itinerary Builder', icon: Map,             path: '/itinerary' },
  { label: 'Analytics',         icon: BarChart2,       path: '/analytics' },
]

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

  return (
    <aside style={{
      width: '240px',
      height: '100vh',
      overflowY: 'auto',
      backgroundColor: '#fff',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 50,
    }}>

      {/* ── Logo + mobile close button ──────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '0 20px',
        marginBottom: '32px',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
      <img
  src="/localtrip-logo.png"
  alt="LocalTrip AI"
  style={{ height: '80px', width: '100%', objectFit: 'contain', objectPosition: 'left' }}
/>

        {/* Close button — only visible on mobile */}
        <button
          onClick={onClose}
          className="sidebar-close-btn"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'none', // hidden on desktop, shown via CSS on mobile
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <X size={18} color="#9ca3af" />
        </button>
      </div>

      {/* ── Nav Items ──────────────────────────────────────────────── */}
      <nav style={{
        flex: 1,
        padding: '0 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        {navItems.map(({ label, icon: Icon, path }) => {
          const isActive = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => handleNav(path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '400',
                backgroundColor: isActive ? '#f0fdfa' : 'transparent',
                color: isActive ? '#0f766e' : '#4b5563',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.backgroundColor = '#f9fafb'
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <Icon
                size={18}
                color={isActive ? '#0f766e' : '#9ca3af'}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              {label}
              {isActive && (
                <div style={{
                  marginLeft: 'auto',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: '#0f766e',
                }} />
              )}
            </button>
          )
        })}
      </nav>

      {/* ── Divider ────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #f3f4f6', margin: '12px 0' }} />

      {/* ── Bottom Section ─────────────────────────────────────────── */}
      <div style={{
        padding: '0 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>

        {/* Settings */}
        <button
          onClick={() => handleNav('/settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            fontSize: '14px',
            fontWeight: '400',
            backgroundColor: location.pathname === '/settings' ? '#f0fdfa' : 'transparent',
            color: location.pathname === '/settings' ? '#0f766e' : '#4b5563',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor =
            location.pathname === '/settings' ? '#f0fdfa' : 'transparent'}
        >
          <Settings size={18} color="#9ca3af" strokeWidth={1.8} />
          Settings
        </button>

        {/* User + Logout */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          marginTop: '4px',
          borderRadius: '10px',
          backgroundColor: '#f9fafb',
        }}>
          {/* Avatar */}
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: '#ccfbf1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '600',
            color: '#0f766e',
            flexShrink: 0,
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>

          {/* Name + Email */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: 0, fontSize: '13px', fontWeight: '500', color: '#111827',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {user?.name || 'Agent'}
            </p>
            <p style={{
              margin: 0, fontSize: '11px', color: '#9ca3af',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {user?.email || ''}
            </p>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <LogOut size={15} color="#9ca3af" />
          </button>
        </div>

      </div>

      {/* ── Responsive styles ───────────────────────────────────────── */}
      <style>{`
        @media (max-width: 1023px) {
          .sidebar-close-btn {
            display: flex !important;
          }
        }
      `}</style>

    </aside>
  )
}

export default Sidebar