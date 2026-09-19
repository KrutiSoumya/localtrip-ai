function MetricCard({ title, value, subtitle, color, icon: Icon, loading }) {

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #f3f4f6',
        borderLeft: `4px solid #e5e7eb`,
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        <div style={{ height: '13px', width: '60%', backgroundColor: '#f3f4f6', borderRadius: '6px' }} />
        <div style={{ height: '28px', width: '40%', backgroundColor: '#f3f4f6', borderRadius: '6px' }} />
        <div style={{ height: '11px', width: '70%', backgroundColor: '#f3f4f6', borderRadius: '6px' }} />
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: '#fff',
      border: '1px solid #f3f4f6',
      borderLeft: `4px solid ${color}`,
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      transition: 'box-shadow 0.15s ease',
      cursor: 'default',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Top row — title + icon */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: '500', color: '#6b7280' }}>
          {title}
        </p>
        {Icon && (
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            backgroundColor: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={16} color={color} />
          </div>
        )}
      </div>

      {/* Value */}
      <p style={{
        margin: 0,
        fontSize: '30px',
        fontWeight: '700',
        color: '#111827',
        lineHeight: 1,
        letterSpacing: '-0.5px',
      }}>
        {value ?? '—'}
      </p>

      {/* Subtitle / trend */}
      {subtitle && (
        <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', lineHeight: 1.4 }}>
          {subtitle}
        </p>
      )}

    </div>
  )
}

export default MetricCard