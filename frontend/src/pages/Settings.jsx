import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  User, Phone, Mail, Building2, Plus, Trash2, MapPin, RefreshCw,
  CheckCircle, AlertCircle, Globe, Database, ChevronDown, ChevronRight,
  X, Save, Info
} from 'lucide-react'
import api from '../services/api'

const getLoggedInProfile = () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
    const user = storedUser.user || storedUser.profile || storedUser
    return {
      name: user.name || user.fullName || user.full_name || '',
      email: user.email || '',
      phone: user.phone || user.phoneNumber || user.phone_number || '',
      agencyName: user.agencyName || user.agency_name || user.agency || '',
    }
  } catch (error) {
    console.error('Unable to read logged-in user details:', error)
    return { name: '', email: '', phone: '', agencyName: '' }
  }
}

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: '10px',
  border: '1px solid #e5e7eb', fontSize: '14px', color: '#111827',
  outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff',
}

function Field({ label, icon: Icon, children }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5 }}>
      {Icon && <Icon size={12} color="#9ca3af" />} {label}
    </label>
    {children}
  </div>
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500)
    return () => clearTimeout(timer)
  }, [onClose])
  return <div role="status" style={{
    position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
    display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px',
    borderRadius: 12, background: type === 'success' ? '#f0fdfa' : '#fef2f2',
    border: `1px solid ${type === 'success' ? '#99f6e4' : '#fecaca'}`,
    boxShadow: '0 8px 24px rgba(0,0,0,.10)', minWidth: 260,
  }}>
    {type === 'success' ? <CheckCircle size={16} color="#0f766e" /> : <AlertCircle size={16} color="#dc2626" />}
    <span style={{ fontSize: 13, fontWeight: 500, flex: 1, color: type === 'success' ? '#0f766e' : '#dc2626' }}>{message}</span>
    <button onClick={onClose} aria-label="Dismiss notification" style={{ border: 0, background: 'transparent', cursor: 'pointer' }}><X size={14} /></button>
  </div>
}

const formatMoney = value => {
  const number = Number(value)
  return Number.isFinite(number) ? `₹${number.toLocaleString('en-IN')}` : 'Not specified'
}

const getDestinationKey = destination => destination.name || destination.destination || destination.id
const getDestinationRegion = destination => destination.region || destination.state || destination.country || 'Region not specified'
const asArray = value => Array.isArray(value) ? value : []

function Settings() {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', agencyName: '' })
  const [profileLoading, setProfileLoading] = useState(true)
  const [destinations, setDestinations] = useState([])
  const [destLoading, setDestLoading] = useState(true)
  const [destError, setDestError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [searchDest, setSearchDest] = useState('')
  const [expanded, setExpanded] = useState({})
  const [busyKey, setBusyKey] = useState(null)
  const [toast, setToast] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addingDest, setAddingDest] = useState(false)
  const [newDestinationJson, setNewDestinationJson] = useState('')
  const [jsonError, setJsonError] = useState('')

  const showToast = useCallback((message, type = 'success') => setToast({ message, type }), [])

  const loadDestinations = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setDestLoading(true)
    setDestError('')
    try {
      // This endpoint must read backend/data/destinations.json, not the old Prisma JSON field.
      const response = await api.get('/config/destinations')
      const records = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.destinations)
          ? response.data.destinations
          : null
      if (!records) throw new Error('The destinations API returned an unexpected response.')
      setDestinations(records.map((destination, index) => ({
        ...destination,
        // Existing dataset records without an active flag remain enabled by default.
        active: destination.active !== false,
        _key: String(getDestinationKey(destination) ?? index),
      })))
    } catch (error) {
      console.error('Failed to load the AI destination dataset:', error)
      setDestinations([])
      setDestError(error.response?.data?.message || error.message || 'Unable to load the AI dataset.')
    } finally {
      setDestLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    setProfile(getLoggedInProfile())
    setProfileLoading(false)
    loadDestinations()
  }, [loadDestinations])

  const filteredDestinations = useMemo(() => {
    const query = searchDest.trim().toLowerCase()
    if (!query) return destinations
    return destinations.filter(destination => {
      const searchable = [
        destination.name, destination.region, destination.state, destination.country,
        ...asArray(destination.attractions).map(item => typeof item === 'string' ? item : item?.name),
        ...asArray(destination.activities).map(item => typeof item === 'string' ? item : item?.name),
      ].filter(Boolean).join(' ').toLowerCase()
      return searchable.includes(query)
    })
  }, [destinations, searchDest])

  const activeCount = destinations.filter(destination => destination.active !== false).length
  const inactiveCount = destinations.length - activeCount

  const handleToggleActive = async destination => {
    const name = getDestinationKey(destination)
    const nextActive = destination.active === false
    const key = String(name)
    setBusyKey(key)
    try {
      // Requires PATCH /api/config/destinations/:name/status with { active }.
      const response = await api.patch(`/config/destinations/${encodeURIComponent(name)}/status`, { active: nextActive })
      const updatedRecords = Array.isArray(response.data?.destinations) ? response.data.destinations : null
      if (updatedRecords) {
        setDestinations(updatedRecords.map(item => ({ ...item, active: item.active !== false, _key: String(getDestinationKey(item)) })))
      } else {
        setDestinations(current => current.map(item => getDestinationKey(item) === name ? { ...item, active: nextActive } : item))
      }
      showToast(`${name} ${nextActive ? 'enabled' : 'disabled'} for AI generation.`)
    } catch (error) {
      console.error('Failed to update destination status:', error)
      showToast(error.response?.data?.message || 'Could not update status. Check that the backend status route is installed.', 'error')
    } finally {
      setBusyKey(null)
    }
  }

  const handleDeleteDestination = async destination => {
    const name = getDestinationKey(destination)
    if (!name || !window.confirm(`Permanently remove "${name}" from the AI destination dataset?`)) return
    const key = String(name)
    setBusyKey(key)
    try {
      const response = await api.delete(`/config/destinations/${encodeURIComponent(name)}`)
      const updatedRecords = Array.isArray(response.data?.destinations) ? response.data.destinations : null
      setDestinations(updatedRecords
        ? updatedRecords.map(item => ({ ...item, active: item.active !== false, _key: String(getDestinationKey(item)) }))
        : current => current.filter(item => getDestinationKey(item) !== name))
      showToast(`${name} removed from the AI dataset.`)
    } catch (error) {
      console.error('Failed to delete destination:', error)
      showToast(error.response?.data?.message || 'Could not delete destination.', 'error')
    } finally {
      setBusyKey(null)
    }
  }

  const handleAddDestination = async () => {
    setJsonError('')
    let destination
    try {
      destination = JSON.parse(newDestinationJson)
    } catch {
      setJsonError('Enter valid JSON before adding the destination.')
      return
    }
    if (!destination || typeof destination !== 'object' || Array.isArray(destination) || !String(destination.name || '').trim()) {
      setJsonError('The destination must be a JSON object with a non-empty "name" field.')
      return
    }
    if (!Array.isArray(destination.attractions) || !Array.isArray(destination.activities) || !Number.isFinite(Number(destination.avg_cost_per_day))) {
      setJsonError('Include attractions (array), activities (array), and a numeric avg_cost_per_day. Use the existing destinations.json schema.')
      return
    }
    if (destinations.some(item => String(item.name).toLowerCase() === destination.name.trim().toLowerCase())) {
      setJsonError('A destination with this name already exists.')
      return
    }
    setAddingDest(true)
    try {
      const payload = { ...destination, name: destination.name.trim(), active: true }
      const response = await api.post('/config/destinations', payload)
      const updatedRecords = Array.isArray(response.data?.destinations) ? response.data.destinations : null
      if (updatedRecords) {
        setDestinations(updatedRecords.map(item => ({ ...item, active: item.active !== false, _key: String(getDestinationKey(item)) })))
      } else {
        await loadDestinations(true)
      }
      setNewDestinationJson('')
      setShowAddForm(false)
      showToast(`${payload.name} added to the AI dataset.`)
    } catch (error) {
      console.error('Failed to add destination:', error)
      setJsonError(error.response?.data?.message || 'Could not add destination. The backend must save the complete record to destinations.json.')
    } finally {
      setAddingDest(false)
    }
  }

  const toggleExpanded = key => setExpanded(current => ({ ...current, [key]: !current[key] }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Settings</h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: '#9ca3af' }}>View your account details and manage the AI grounding dataset.</p>
      </div>

      <section style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 14, overflow: 'hidden' }}>
        <header style={{ padding: '18px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 10, background: '#fafafa' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#f0fdfa', display: 'grid', placeItems: 'center' }}><User size={16} color="#0f766e" /></div>
          <div><h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>Agent Profile</h2><p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>Details from the currently logged-in account</p></div>
        </header>
        <div style={{ padding: 24 }}>
          {profileLoading ? <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading profile…</p> : <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 16, background: '#f9fafb', borderRadius: 12, border: '1px solid #f3f4f6' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ccfbf1', display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 700, color: '#0f766e', flexShrink: 0 }}>{profile.name?.charAt(0)?.toUpperCase() || 'A'}</div>
              <div><p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>{profile.name || 'Agent'}</p><p style={{ margin: '2px 0 0', fontSize: 13, color: '#9ca3af' }}>{profile.agencyName || 'Your Agency'}</p></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <Field label="Full Name" icon={User}><input readOnly value={profile.name || 'Not provided'} style={inputStyle} /></Field>
              <Field label="Agency Name" icon={Building2}><input readOnly value={profile.agencyName || 'Not provided'} style={inputStyle} /></Field>
              <Field label="Email" icon={Mail}><input readOnly value={profile.email || 'Not provided'} style={inputStyle} /></Field>
              <Field label="Phone" icon={Phone}><input readOnly value={profile.phone || 'Not provided'} style={inputStyle} /></Field>
            </div>
            <p style={{ margin: '18px 0 0', fontSize: 12, color: '#9ca3af' }}>These details are read from the account used to sign in.</p>
          </>}
        </div>
      </section>

      <section style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 14, overflow: 'hidden' }}>
        <header style={{ padding: '18px 24px', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: '#f5f3ff', display: 'grid', placeItems: 'center' }}><Database size={16} color="#7c3aed" /></div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>Dataset Manager</h2>
              <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>{destinations.length} destinations · {activeCount} active · {inactiveCount} inactive</p>
            </div>
            <button onClick={() => loadDestinations(true)} disabled={refreshing || destLoading} style={{ ...buttonStyle('secondary'), display: 'flex', alignItems: 'center', gap: 6 }}><RefreshCw size={14} /> {refreshing ? 'Refreshing…' : 'Refresh'}</button>
            <button onClick={() => { setShowAddForm(value => !value); setJsonError('') }} style={{ ...buttonStyle('primary'), display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={14} /> {showAddForm ? 'Cancel' : 'Add Destination'}</button>
          </div>
          <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, background: '#f5f3ff', border: '1px solid #ddd6fe', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <Globe size={14} color="#7c3aed" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 12, color: '#6d28d9', lineHeight: 1.5 }}>This manager is intended to read and update the same <strong>backend/data/destinations.json</strong> file used by itinerary generation. Existing records without an active flag are treated as active.</p>
          </div>
        </header>

        {showAddForm && <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Info size={15} color="#7c3aed" /><strong style={{ fontSize: 13, color: '#374151' }}>Add a complete destination record</strong></div>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>Paste a complete destination object using the same schema as destinations.json. This prevents adding a name-only record that the AI cannot use.</p>
          <textarea rows={12} value={newDestinationJson} onChange={event => setNewDestinationJson(event.target.value)} spellCheck={false} placeholder={'{\n  "name": "Example State",\n  "attractions": ["Place 1", "Place 2"],\n  "avg_cost_per_day": 3000,\n  "activities": [{ "name": "Example activity", "cost": 500 }],\n  "accommodation": {},\n  "transport": {},\n  "travel_time_between": {},\n  "pricing_metadata": {}\n}'} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }} />
          {jsonError && <p role="alert" style={{ color: '#dc2626', fontSize: 12, margin: '8px 0 0' }}>{jsonError}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button onClick={() => { setShowAddForm(false); setJsonError('') }} style={buttonStyle('secondary')}>Cancel</button>
            <button onClick={handleAddDestination} disabled={addingDest || !newDestinationJson.trim()} style={{ ...buttonStyle('primary'), display: 'flex', alignItems: 'center', gap: 6, opacity: addingDest || !newDestinationJson.trim() ? .6 : 1 }}><Save size={14} /> {addingDest ? 'Adding…' : 'Add to dataset'}</button>
          </div>
        </div>}

        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '0 14px', height: 40 }}>
            <RefreshCw size={14} color="#9ca3af" />
            <input value={searchDest} onChange={event => setSearchDest(event.target.value)} placeholder="Search states, destinations, attractions or activities…" style={{ flex: 1, border: 0, outline: 0, fontSize: 13, background: 'transparent', color: '#111827' }} />
          </div>
        </div>

        <div style={{ padding: '16px 24px' }}>
          {destLoading ? <div style={{ display: 'grid', gap: 10 }}>{[1, 2, 3, 4].map(index => <div key={index} style={{ height: 62, background: '#f3f4f6', borderRadius: 10 }} />)}</div>
            : destError ? <div style={{ padding: 24, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}><strong style={{ fontSize: 14 }}>Could not load the actual AI dataset</strong><p style={{ fontSize: 12, margin: '6px 0 12px' }}>{destError}</p><button onClick={() => loadDestinations(true)} style={buttonStyle('secondary')}>Retry</button></div>
              : filteredDestinations.length === 0 ? <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}><Database size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: .4 }} /><p style={{ margin: 0, fontSize: 14 }}>{destinations.length === 0 ? 'The AI destination dataset is empty.' : 'No matching destinations found.'}</p></div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredDestinations.map(destination => {
                    const key = destination._key
                    const isActive = destination.active !== false
                    const isExpanded = !!expanded[key]
                    const attractions = asArray(destination.attractions)
                    const activities = asArray(destination.activities)
                    return <article key={key} style={{ border: '1px solid #eef0f3', borderRadius: 11, overflow: 'hidden', background: isActive ? '#fff' : '#fafafa', opacity: isActive ? 1 : .75 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', flexWrap: 'wrap' }}>
                        <button onClick={() => toggleExpanded(key)} aria-label={isExpanded ? 'Collapse destination details' : 'Expand destination details'} style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 2, color: '#6b7280' }}>{isExpanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}</button>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: isActive ? '#f0fdfa' : '#f3f4f6', display: 'grid', placeItems: 'center', flexShrink: 0 }}><MapPin size={16} color={isActive ? '#0f766e' : '#9ca3af'} /></div>
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{destination.name || 'Unnamed destination'}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>{getDestinationRegion(destination)} · {attractions.length} attractions · {activities.length} activities</p>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 105 }}><p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>{formatMoney(destination.avg_cost_per_day)}</p><p style={{ margin: '2px 0 0', fontSize: 10, color: '#9ca3af' }}>average per day</p></div>
                        <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, fontWeight: 600, background: isActive ? '#f0fdfa' : '#f3f4f6', color: isActive ? '#0f766e' : '#6b7280', border: `1px solid ${isActive ? '#99f6e4' : '#e5e7eb'}` }}>{isActive ? 'Active' : 'Inactive'}</span>
                        <button disabled={busyKey === key} onClick={() => handleToggleActive(destination)} style={buttonStyle('secondary')}>{busyKey === key ? 'Saving…' : isActive ? 'Disable' : 'Enable'}</button>
                        <button disabled={busyKey === key} onClick={() => handleDeleteDestination(destination)} title="Remove destination from dataset" style={{ ...buttonStyle('danger'), padding: '8px 10px' }}><Trash2 size={14} /></button>
                      </div>
                      {isExpanded && <div style={{ padding: '14px 18px 18px 56px', borderTop: '1px solid #f3f4f6', background: '#fcfcfd', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                        <DetailList title="Attractions" items={attractions} />
                        <DetailList title="Activities" items={activities} showCost />
                        <div><p style={detailHeading}>Accommodation</p><pre style={detailPre}>{JSON.stringify(destination.accommodation || {}, null, 2)}</pre></div>
                        <div><p style={detailHeading}>Transport</p><pre style={detailPre}>{JSON.stringify(destination.transport || {}, null, 2)}</pre></div>
                        {destination.pricing_metadata && <div><p style={detailHeading}>Pricing metadata</p><pre style={detailPre}>{JSON.stringify(destination.pricing_metadata, null, 2)}</pre></div>}
                      </div>}
                    </article>
                  })}
                </div>}
          {!destLoading && !destError && destinations.length > 0 && <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>{filteredDestinations.length} of {destinations.length} destinations shown</p>
            <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>{activeCount} active in AI dataset</p>
          </div>}
        </div>
      </section>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function DetailList({ title, items, showCost = false }) {
  return <div>
    <p style={detailHeading}>{title} ({items.length})</p>
    {items.length === 0 ? <p style={{ fontSize: 12, color: '#9ca3af' }}>None listed</p> : <ul style={{ margin: 0, paddingLeft: 17, color: '#4b5563', fontSize: 12, lineHeight: 1.8 }}>
      {items.map((item, index) => {
        const label = typeof item === 'string' ? item : item?.name || item?.activity || JSON.stringify(item)
        const cost = typeof item === 'object' && item !== null ? item.cost ?? item.avg_cost : null
        return <li key={`${label}-${index}`}>{label}{showCost && cost != null ? ` — ${formatMoney(cost)}` : ''}</li>
      })}
    </ul>}
  </div>
}

const detailHeading = { margin: '0 0 7px', fontSize: 12, fontWeight: 700, color: '#374151' }
const detailPre = { margin: 0, padding: 10, borderRadius: 8, background: '#f3f4f6', color: '#4b5563', fontSize: 10, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 180, overflow: 'auto' }

function buttonStyle(variant) {
  const common = { borderRadius: 9, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }
  if (variant === 'primary') return { ...common, border: 0, background: '#115e59', color: '#fff' }
  if (variant === 'danger') return { ...common, border: '1px solid #fee2e2', background: '#fff', color: '#dc2626' }
  return { ...common, border: '1px solid #e5e7eb', background: '#fff', color: '#374151' }
}

export default Settings
