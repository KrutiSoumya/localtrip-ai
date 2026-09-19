function LoadingSpinner({ message = 'Loading...', size = 'md', fullPage = false }) {
  const sizes = { sm: 20, md: 32, lg: 48 }
  const px = sizes[size] || 32

  const spinner = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: px, height: px, borderRadius: '50%',
        border: `${size === 'sm' ? 2 : 3}px solid #e5e7eb`,
        borderTopColor: '#0f766e',
        animation: 'spin 0.7s linear infinite',
      }} />
      {message && (
        <p style={{ margin: 0, fontSize: size === 'sm' ? '12px' : '14px', color: '#9ca3af' }}>
          {message}
        </p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (fullPage) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh',
    }}>
      {spinner}
    </div>
  )

  return spinner
}

export default LoadingSpinner