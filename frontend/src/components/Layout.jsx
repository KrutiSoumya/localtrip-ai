import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar when resizing to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 1024) setSidebarOpen(false) }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      width: '100vw', backgroundColor: '#f9fafb', overflowX: 'hidden',
    }}>

      {/* ── Mobile overlay ──────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.35)',
            zIndex: 45,
          }}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.25s ease',
      }}
        className="sidebar-wrapper"
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, minWidth: 0,
        display: 'flex', flexDirection: 'column',
      }}
        className="main-wrapper"
      >
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}
          className="main-content"
        >
          {children}
        </main>
      </div>

      <style>{`
        /* Desktop: sidebar always visible */
        @media (min-width: 1024px) {
          .sidebar-wrapper {
            position: fixed !important;
            transform: translateX(0) !important;
          }
          .main-wrapper {
            margin-left: 240px;
            width: calc(100vw - 240px);
          }
        }

        /* Mobile: sidebar hidden by default, slides in */
        @media (max-width: 1023px) {
          .sidebar-wrapper {
            transform: translateX(-100%);
          }
          .sidebar-wrapper[style*="translateX(0)"] {
            transform: translateX(0) !important;
          }
          .main-wrapper {
            margin-left: 0 !important;
            width: 100vw;
          }
          .main-content {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  )
}

export default Layout