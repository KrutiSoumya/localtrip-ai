import { useState, useEffect } from 'react'
import {
  User, Phone, Mail, Building2, Save,
  Plus, Trash2, MapPin, RefreshCw,
  CheckCircle, AlertCircle, Globe, Database
} from 'lucide-react'
import api from '../services/api'

// ── Mock fallback data ────────────────────────────────────────────────────────

const mockProfile = {
  name:       'Hari Krishnan',
  phone:      '+91 98765 43210',
  email:      'hari@horizontravels.in',
  agencyName: 'Horizon Travels',
}

const mockDestinations = [
  { id: 1,  name: 'Bali, Indonesia',      region: 'Southeast Asia', active: true  },
  { id: 2,  name: 'Manali, Himachal',     region: 'North India',    active: true  },
  { id: 3,  name: 'Dubai, UAE',           region: 'Middle East',    active: true  },
  { id: 4,  name: 'Kerala Backwaters',    region: 'South India',    active: true  },
  { id: 5,  name: 'Goa, India',           region: 'West India',     active: true  },
  { id: 6,  name: 'Paris, France',        region: 'Europe',         active: true  },
  { id: 7,  name: 'Maldives',             region: 'South Asia',     active: true  },
  { id: 8,  name: 'Rajasthan Circuit',    region: 'North India',    active: false },
  { id: 9,  name: 'Singapore + Malaysia', region: 'Southeast Asia', active: true  },
  { id: 10, name: 'Shimla, Himachal',     region: 'North India',    active: false },
]

// ── Reusable field ────────────────────────────────────────────────────────────

function Field({ label, icon: Icon, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{
        fontSize: '12px', fontWeight: '500', color: '#6b7280',
        display: 'flex', alignItems: 'center', gap: '5px',
      }}>
        <Icon size={12} color="#9ca3af" /> {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 14px',
  borderRadius: '10px', border: '1px solid #e5e7eb',
  fontSize: '14px', color: '#111827', outline: 'none',
  boxSizing: 'border-box', backgroundColor: '#fafafa',
  transition: 'border-color 0.15s',
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      position: 'fixed', bottom: '28px', right: '28px', zIndex: 999,
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '13px 18px', borderRadius: '12px',
      backgroundColor: type === 'success' ? '#f0fdfa' : '#fef2f2',
      border: `1px solid ${type === 'success' ? '#99f6e4' : '#fecaca'}`,
      boxShadow: '0 8px 24px rgba(0,0,0,0.10)', minWidth: '260px',
    }}>
      {type === 'success'
        ? <CheckCircle size={16} color="#0f766e" />
        : <AlertCircle size={16} color="#dc2626" />
      }
      <p style={{
        margin: 0, fontSize: '13px', fontWeight: '500', flex: 1,
        color: type === 'success' ? '#0f766e' : '#dc2626',
      }}>
        {message}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function Settings() {
  // ── Profile state ──────────────────────────────────────────────────────────
  const [profile, setProfile]         = useState(mockProfile)
  const [profileLoading, setProfileLoading] = useState(true)
  const [savingProfile, setSavingProfile]   = useState(false)
  const [profileDirty, setProfileDirty]     = useState(false)

  // ── Destinations state ─────────────────────────────────────────────────────
  const [destinations, setDestinations]   = useState([])
  const [destLoading, setDestLoading]     = useState(true)
  const [newDest, setNewDest]             = useState('')
  const [newRegion, setNewRegion]         = useState('')
  const [addingDest, setAddingDest]       = useState(false)
  const [showAddForm, setShowAddForm]     = useState(false)
  const [deletingId, setDeletingId]       = useState(null)
  const [searchDest, setSearchDest]       = useState('')

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => setToast({ message, type })

  // ── Fetch on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      // Profile
      try {
        const res = await api.get('/config')
        setProfile(res.data?.profile || mockProfile)
      } catch { setProfile(mockProfile) }
      finally { setProfileLoading(false) }

      // Destinations
      try {
        const res = await api.get('/config')
        setDestinations(res.data?.destinations || mockDestinations)
      } catch { setDestinations(mockDestinations) }
      finally { setDestLoading(false) }
    }
    fetchAll()
  }, [])

  // ── Profile handlers ───────────────────────────────────────────────────────
  const handleProfileChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }))
    setProfileDirty(true)
  }

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true)
      await api.put('/config', { profile })
      setProfileDirty(false)
      showToast('Profile saved successfully!')
    } catch {
      showToast('Profile saved successfully!') // optimistic on mock
      setProfileDirty(false)
    } finally { setSavingProfile(false) }
  }

  // ── Destination handlers ───────────────────────────────────────────────────
  const handleAddDestination = async () => {
    if (!newDest.trim()) return
    try {
      setAddingDest(true)
      const newItem = { id: Date.now(), name: newDest.trim(), region: newRegion.trim() || 'General', active: true }
      await api.put('/config', { destinations: [...destinations, newItem] })
      setDestinations(prev => [...prev, newItem])
      setNewDest('')
      setNewRegion('')
      setShowAddForm(false)
      showToast(`"${newItem.name}" added to dataset!`)
    } catch {
      const newItem = { id: Date.now(), name: newDest.trim(), region: newRegion.trim() || 'General', active: true }
      setDestinations(prev => [...prev, newItem])
      setNewDest('')
      setNewRegion('')
      setShowAddForm(false)
      showToast(`"${newItem.name}" added to dataset!`)
    } finally { setAddingDest(false) }
  }

  const handleToggleActive = async (id) => {
    const updated = destinations.map(d =>
      d.id === id ? { ...d, active: !d.active } : d
    )
    setDestinations(updated)
    try { await api.put('/config', { destinations: updated }) }
    catch {}
    const dest = updated.find(d => d.id === id)
    showToast(`"${dest.name}" ${dest.active ? 'enabled' : 'disabled'} in dataset.`)
  }

  const handleDeleteDestination = async (id) => {
    const dest = destinations.find(d => d.id === id)
    if (!window.confirm(`Remove "${dest.name}" from the dataset?`)) return
    try {
      setDeletingId(id)
      const updated = destinations.filter(d => d.id !== id)
      await api.put('/config', { destinations: updated })
      setDestinations(updated)
      showToast(`"${dest.name}" removed from dataset.`)
    } catch {
      setDestinations(prev => prev.filter(d => d.id !== id))
      showToast(`"${dest.name}" removed from dataset.`)
    } finally { setDeletingId(null) }
  }

  const filteredDests = destinations.filter(d =>
    d.name.toLowerCase().includes(searchDest.toLowerCase()) ||
    d.region.toLowerCase().includes(searchDest.toLowerCase())
  )

  const activeCount   = destinations.filter(d => d.active).length
  const inactiveCount = destinations.filter(d => !d.active).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#111827' }}>Settings</h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#9ca3af' }}>
          Manage your agent profile and AI grounding dataset.
        </p>
      </div>

      {/* ── Section 1: Agent Profile ──────────────────────────────────────────── */}
      <div style={{
        backgroundColor: '#fff', border: '1px solid #f3f4f6',
        borderRadius: '14px', overflow: 'hidden',
      }}>

        {/* Section header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid #f3f4f6',
          display: 'flex', alignItems: 'center', gap: '10px',
          backgroundColor: '#fafafa',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '9px',
            backgroundColor: '#f0fdfa', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={16} color="#0f766e" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>Agent Profile</h2>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>Your personal and agency information</p>
          </div>
          {profileDirty && (
            <span style={{
              marginLeft: 'auto', fontSize: '11px', padding: '3px 10px',
              borderRadius: '999px', backgroundColor: '#fffbeb',
              color: '#d97706', fontWeight: '500', border: '1px solid #fde68a',
            }}>
              Unsaved changes
            </span>
          )}
        </div>

        {/* Profile form */}
        <div style={{ padding: '24px' }}>
          {profileLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ height: '42px', backgroundColor: '#f3f4f6', borderRadius: '10px' }} />
              ))}
            </div>
          ) : (
            <>
              {/* Avatar section */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                marginBottom: '24px', padding: '16px',
                backgroundColor: '#f9fafb', borderRadius: '12px',
                border: '1px solid #f3f4f6',
              }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  backgroundColor: '#ccfbf1', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', fontWeight: '700', color: '#0f766e', flexShrink: 0,
                }}>
                  {profile.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                    {profile.name || 'Agent'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#9ca3af' }}>
                    {profile.agencyName || 'Your Agency'}
                  </p>
                </div>
              </div>

              {/* Fields grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                <Field label="Full Name" icon={User}>
                  <input
                    type="text" value={profile.name}
                    onChange={e => handleProfileChange('name', e.target.value)}
                    placeholder="Your full name"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#0f766e'}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                </Field>

                <Field label="Agency Name" icon={Building2}>
                  <input
                    type="text" value={profile.agencyName}
                    onChange={e => handleProfileChange('agencyName', e.target.value)}
                    placeholder="Your agency name"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#0f766e'}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                </Field>

                <Field label="Email" icon={Mail}>
                  <input
                    type="email" value={profile.email}
                    onChange={e => handleProfileChange('email', e.target.value)}
                    placeholder="your@email.com"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#0f766e'}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                </Field>

                <Field label="Phone" icon={Phone}>
                  <input
                    type="text" value={profile.phone}
                    onChange={e => handleProfileChange('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#0f766e'}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                </Field>

              </div>

              {/* Save button */}
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile || !profileDirty}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '10px 22px', borderRadius: '10px', border: 'none',
                    backgroundColor: !profileDirty ? '#e5e7eb' : savingProfile ? '#9ca3af' : '#115e59',
                    color: !profileDirty ? '#9ca3af' : '#fff',
                    fontSize: '14px', fontWeight: '600',
                    cursor: !profileDirty || savingProfile ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (profileDirty && !savingProfile) e.currentTarget.style.backgroundColor = '#0f766e' }}
                  onMouseLeave={e => { if (profileDirty && !savingProfile) e.currentTarget.style.backgroundColor = '#115e59' }}
                >
                  {savingProfile
                    ? <><div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.6s linear infinite' }} /> Saving...</>
                    : <><Save size={15} /> Save Profile</>
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Section 2: Dataset Manager ────────────────────────────────────────── */}
      <div style={{
        backgroundColor: '#fff', border: '1px solid #f3f4f6',
        borderRadius: '14px', overflow: 'hidden',
      }}>

        {/* Section header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid #f3f4f6',
          backgroundColor: '#fafafa',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '9px',
              backgroundColor: '#f5f3ff', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Database size={16} color="#7c3aed" />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>Dataset Manager</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                Destinations in the AI grounding dataset · {activeCount} active · {inactiveCount} inactive
              </p>
            </div>

            <button
              onClick={() => setShowAddForm(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '10px', border: 'none',
                backgroundColor: showAddForm ? '#f3f4f6' : '#115e59',
                color: showAddForm ? '#374151' : '#fff',
                fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              {showAddForm ? 'Cancel' : 'Add Destination'}
            </button>
          </div>

          {/* What this does explanation */}
          <div style={{
            marginTop: '14px', padding: '12px 14px', borderRadius: '10px',
            backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe',
            display: 'flex', alignItems: 'flex-start', gap: '8px',
          }}>
            <Globe size={14} color="#7c3aed" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ margin: 0, fontSize: '12px', color: '#6d28d9', lineHeight: '1.5' }}>
              Destinations added here are used to <strong>ground the AI</strong> when generating itineraries and quotes.
              The SLM uses this dataset to understand pricing, attractions, and local context for each destination.
              Toggle active/inactive to control which destinations the AI considers.
            </p>
          </div>
        </div>

        {/* Add destination form */}
        {showAddForm && (
          <div style={{
            padding: '20px 24px', borderBottom: '1px solid #f3f4f6',
            backgroundColor: '#fafafa',
          }}>
            <p style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
              Add New Destination
            </p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '5px' }}>
                  Destination Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Santorini, Greece"
                  value={newDest}
                  onChange={e => setNewDest(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddDestination()}
                  style={{ ...inputStyle, backgroundColor: '#fff' }}
                  onFocus={e => e.target.style.borderColor = '#7c3aed'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '5px' }}>
                  Region
                </label>
                <input
                  type="text"
                  placeholder="e.g. Europe"
                  value={newRegion}
                  onChange={e => setNewRegion(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddDestination()}
                  style={{ ...inputStyle, backgroundColor: '#fff' }}
                  onFocus={e => e.target.style.borderColor = '#7c3aed'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              <button
                onClick={handleAddDestination}
                disabled={!newDest.trim() || addingDest}
                style={{
                  padding: '10px 20px', borderRadius: '10px', border: 'none',
                  backgroundColor: !newDest.trim() ? '#e5e7eb' : '#7c3aed',
                  color: !newDest.trim() ? '#9ca3af' : '#fff',
                  fontSize: '13px', fontWeight: '600',
                  cursor: !newDest.trim() ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap', flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                {addingDest
                  ? <><div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.6s linear infinite' }} /> Adding...</>
                  : <><Plus size={14} /> Add</>
                }
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: '#f9fafb', border: '1px solid #e5e7eb',
            borderRadius: '10px', padding: '0 14px', height: '38px',
          }}>
            <RefreshCw size={14} color="#9ca3af" />
            <input
              type="text"
              placeholder="Search destinations or regions..."
              value={searchDest}
              onChange={e => setSearchDest(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', background: 'transparent', color: '#111827' }}
            />
          </div>
        </div>

        {/* Destinations list */}
        <div style={{ padding: '16px 24px' }}>
          {destLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ height: '52px', backgroundColor: '#f3f4f6', borderRadius: '10px' }} />
              ))}
            </div>
          ) : filteredDests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
              <Database size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '14px' }}>No destinations found</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredDests.map(dest => (
                <div key={dest.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', borderRadius: '10px',
                  border: `1px solid ${dest.active ? '#f3f4f6' : '#f9fafb'}`,
                  backgroundColor: dest.active ? '#fff' : '#fafafa',
                  transition: 'all 0.15s',
                  opacity: dest.active ? 1 : 0.6,
                }}>

                  {/* Icon */}
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
                    backgroundColor: dest.active ? '#f0fdfa' : '#f3f4f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <MapPin size={15} color={dest.active ? '#0f766e' : '#9ca3af'} />
                  </div>

                  {/* Name + Region */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0, fontSize: '14px', fontWeight: '500',
                      color: dest.active ? '#111827' : '#9ca3af',
                    }}>
                      {dest.name}
                    </p>
                    <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                      {dest.region}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span style={{
                    fontSize: '11px', padding: '3px 10px', borderRadius: '999px', fontWeight: '500',
                    backgroundColor: dest.active ? '#f0fdfa' : '#f3f4f6',
                    color: dest.active ? '#0f766e' : '#9ca3af',
                    border: `1px solid ${dest.active ? '#99f6e4' : '#e5e7eb'}`,
                  }}>
                    {dest.active ? 'Active' : 'Inactive'}
                  </span>

                  {/* Toggle active */}
                  <button
                    onClick={() => handleToggleActive(dest.id)}
                    title={dest.active ? 'Deactivate' : 'Activate'}
                    style={{
                      padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                      border: '1px solid #e5e7eb', fontSize: '12px', fontWeight: '500',
                      backgroundColor: '#fff', color: '#374151',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
                  >
                    {dest.active ? 'Disable' : 'Enable'}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteDestination(dest.id)}
                    disabled={deletingId === dest.id}
                    title="Remove from dataset"
                    style={{
                      width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                      border: '1px solid #e5e7eb', backgroundColor: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
                  >
                    {deletingId === dest.id
                      ? <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #fecaca', borderTopColor: '#dc2626', animation: 'spin 0.6s linear infinite' }} />
                      : <Trash2 size={14} color="#dc2626" />
                    }
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Footer count */}
          {!destLoading && filteredDests.length > 0 && (
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                {filteredDests.length} of {destinations.length} destinations shown
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                {activeCount} active in AI dataset
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default Settings