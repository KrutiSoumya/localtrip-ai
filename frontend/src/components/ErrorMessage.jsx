import { AlertCircle, RefreshCw, X } from 'lucide-react'
import { useState } from 'react'

function ErrorMessage({
  message = 'Something went wrong. Please try again.',
  onRetry = null,
  dismissible = true,
  compact = false,
}) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  if (compact) return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '8px 12px', borderRadius: '8px',
      backgroundColor: '#fef2f2', border: '1px solid #fecaca',
    }}>
      <AlertCircle size={14} color="#dc2626" style={{ flexShrink: 0 }} />
      <p style={{ margin: 0, fontSize: '13px', color: '#dc2626', flex: 1 }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '12px', color: '#dc2626', fontWeight: '500',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          <RefreshCw size={12} /> Retry
        </button>
      )}
      {dismissible && (
        <button onClick={() => setDismissed(true)} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
        }}>
          <X size={13} color="#dc2626" />
        </button>
      )}
    </div>
  )

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', textAlign: 'center',
      backgroundColor: '#fef2f2', border: '1px solid #fecaca',
      borderRadius: '14px',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        backgroundColor: '#fee2e2', display: 'flex',
        alignItems: 'center', justifyContent: 'center', marginBottom: '14px',
      }}>
        <AlertCircle size={24} color="#dc2626" />
      </div>
      <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '600', color: '#991b1b' }}>
        Something went wrong
      </h3>
      <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#dc2626', maxWidth: '320px', lineHeight: '1.5' }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        {onRetry && (
          <button onClick={onRetry} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px', borderRadius: '10px',
            border: 'none', backgroundColor: '#dc2626',
            color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
          }}>
            <RefreshCw size={14} /> Try Again
          </button>
        )}
        {dismissible && (
          <button onClick={() => setDismissed(true)} style={{
            padding: '9px 18px', borderRadius: '10px',
            border: '1px solid #fecaca', backgroundColor: '#fff',
            color: '#dc2626', fontSize: '13px', cursor: 'pointer',
          }}>
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}

export default ErrorMessage