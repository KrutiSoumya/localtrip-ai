import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  User, Phone, Mail, Building2, Plus, Trash2, MapPin, RefreshCw,
  CheckCircle, AlertCircle, Globe, Database, ChevronDown, ChevronRight,
  X, Save, Info
} from 'lucide-react'
import api from '../services/api'

// ── UI-only styles ────────────────────────────────────────────────────────────
// Palette: royal blue, marigold, maroon, cream. Flat colour blocks separated by thin gaps.

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Jost:wght@400;500;600;700&display=swap');

.st-root {
  --blue: #0B3283;
  --blue-deep: #082463;
  --gold: #E9A21B;
  --gold-soft: #F7DDA0;
  --maroon: #7B0D12;
  --cream: #F7EEE3;
  --paper: #FFFBF5;
  --ink: #14213D;
  --muted: #5B6785;
  --line: rgba(20, 33, 61, 0.14);
  --display: 'Cormorant Garamond', Georgia, serif;
  --body: 'Jost', system-ui, sans-serif;
  font-family: var(--body);
  font-size: 14px;
  font-variant-numeric: lining-nums;
  color: var(--ink);
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  isolation: isolate;
}
.st-root *, .st-root *::before, .st-root *::after { box-sizing: border-box; }
.st-root button { font-family: inherit; }
.st-root :focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

/* Hero */
.st-hero {
  position: relative; overflow: hidden;
  background: var(--blue); color: var(--cream);
  border-radius: 8px; padding: 26px 28px 28px;
}
.st-hero h1 { position: relative; z-index: 2; margin: 0; font-family: var(--display); font-weight: 600; font-size: clamp(34px, 5vw, 50px); line-height: 1; }
.st-hero p { position: relative; z-index: 2; margin: 8px 0 0; font-size: 14px; font-weight: 400; opacity: 0.85; max-width: 38em; }
.st-diamond { display: inline-block; width: 0.3em; height: 0.3em; background: var(--gold); margin-left: 0.14em; vertical-align: 0.62em; transform: rotate(45deg); animation: st-turn 6s ease-in-out infinite; }
.st-pattern-wrap {
  position: absolute; right: 0; top: 0; bottom: 0; width: 36%; overflow: hidden; z-index: 1;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 70%);
  mask-image: linear-gradient(90deg, transparent, #000 70%);
}
.st-pattern {
  position: absolute; inset: 0 0 0 0; width: calc(100% + 28px); opacity: 0.32;
  background-image:
    linear-gradient(135deg, var(--gold) 25%, transparent 25%),
    linear-gradient(225deg, var(--gold) 25%, transparent 25%),
    linear-gradient(45deg, var(--gold) 25%, transparent 25%),
    linear-gradient(315deg, var(--gold) 25%, transparent 25%);
  background-size: 28px 28px;
  background-position: 14px 0, 14px 0, 0 0, 0 0;
  animation: st-pan 3s linear infinite;
}

/* Section titles */
.st-sec { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.st-sec h2 { margin: 0; font-family: var(--display); font-weight: 600; font-size: 25px; color: var(--blue); display: flex; align-items: center; gap: 9px; }
.st-bullet { width: 9px; height: 9px; background: var(--gold); transform: rotate(45deg); flex-shrink: 0; }
.st-sec p { margin: 0; font-size: 13px; color: var(--muted); }
.st-sec .st-actions { margin-left: auto; display: flex; gap: 8px; flex-wrap: wrap; }

/* Buttons */
.st-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 7px 14px; border-radius: 6px; cursor: pointer;
  font-size: 13px; font-weight: 600;
  border: 1.5px solid var(--blue); background: transparent; color: var(--blue);
  transition: transform 0.12s ease, background 0.2s, color 0.2s, box-shadow 0.15s;
}
.st-btn:hover:not(:disabled) { transform: translateY(-1px); background: var(--blue); color: var(--cream); }
.st-btn:active:not(:disabled) { transform: translateY(0); }
.st-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.st-btn.primary { background: var(--blue); color: var(--cream); }
.st-btn.primary:hover:not(:disabled) { background: var(--blue-deep); }
.st-btn.gold { background: var(--gold); border-color: var(--gold); color: var(--ink); }
.st-btn.gold:hover:not(:disabled) { background: var(--ink); border-color: var(--ink); color: var(--gold); }
.st-btn.danger { border-color: var(--maroon); color: var(--maroon); padding: 7px 10px; }
.st-btn.danger:hover:not(:disabled) { background: var(--maroon); color: var(--cream); }
.st-spin { animation: st-spin 0.8s linear infinite; }

/* Profile blocks */
.st-profile { display: grid; grid-template-columns: 250px 1fr; gap: 3px; }
.st-id { background: var(--maroon); color: var(--cream); border-radius: 8px 0 0 8px; padding: 20px; display: flex; flex-direction: column; justify-content: center; gap: 12px; }
.st-avatar { width: 52px; height: 52px; border-radius: 50%; background: var(--gold); color: var(--maroon); display: grid; place-items: center; font-family: var(--display); font-weight: 700; font-size: 26px; animation: st-pop 0.5s cubic-bezier(.2,1.3,.4,1) both; }
.st-id strong { display: block; font-family: var(--display); font-weight: 600; font-size: 24px; line-height: 1.1; }
.st-id span { font-size: 13px; color: var(--gold-soft); }
.st-fields-panel { background: var(--paper); border: 1px solid var(--line); border-left: 0; border-radius: 0 8px 8px 0; padding: 18px 20px; }
.st-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px 16px; }
.st-field { display: flex; flex-direction: column; gap: 4px; }
.st-field label { font-size: 12px; font-weight: 600; color: var(--blue); display: flex; align-items: center; gap: 5px; }
.st-input { width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--line); background: var(--cream); color: var(--ink); font-family: inherit; font-size: 14px; outline: none; }
.st-hint { margin: 12px 0 0; font-size: 12px; color: var(--muted); }

/* Stat tiles */
.st-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; }
.st-tile { padding: 16px 20px 14px; color: var(--cream); animation: st-pop 0.5s cubic-bezier(.2,1.2,.4,1) both; }
.st-tile:nth-child(1) { background: var(--blue); border-radius: 8px 0 0 8px; }
.st-tile:nth-child(2) { background: var(--gold); color: var(--ink); animation-delay: 0.08s; }
.st-tile:nth-child(3) { background: var(--maroon); border-radius: 0 8px 8px 0; animation-delay: 0.16s; }
.st-tile b { display: block; font-family: var(--display); font-weight: 600; font-size: clamp(34px, 4vw, 44px); line-height: 1; }
.st-tile:nth-child(1) b, .st-tile:nth-child(3) b { color: var(--gold); }
.st-tile span { display: block; margin-top: 8px; padding-top: 8px; border-top: 1px solid currentColor; border-top-color: rgba(247,238,227,0.35); font-size: 13px; font-weight: 500; }
.st-tile:nth-child(2) span { border-top-color: rgba(20,33,61,0.3); }

/* Dataset panel */
.st-panel { background: var(--paper); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
.st-note { margin: 14px 16px 0; padding: 10px 12px; border-left: 3px solid var(--gold); background: var(--cream); display: flex; align-items: flex-start; gap: 8px; border-radius: 0 6px 6px 0; }
.st-note p { margin: 0; font-size: 13px; line-height: 1.5; color: var(--ink); }
.st-add { margin: 14px 16px 0; padding: 14px; background: var(--cream); border-radius: 8px; animation: st-open 0.3s ease both; }
.st-add strong { font-size: 14px; color: var(--ink); }
.st-add p { margin: 6px 0 10px; font-size: 13px; color: var(--muted); line-height: 1.5; }
.st-textarea { width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid var(--line); background: var(--paper); color: var(--ink); font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; resize: vertical; outline: none; }
.st-textarea:focus, .st-search:focus-within { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(233,162,27,0.3); }
.st-error-inline { margin: 8px 0 0; font-size: 13px; font-weight: 600; color: var(--maroon); }
.st-add-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; }
.st-search { margin: 14px 16px 0; display: flex; align-items: center; gap: 8px; height: 38px; padding: 0 12px; border-radius: 6px; border: 1px solid var(--line); background: var(--paper); }
.st-search input { flex: 1; border: 0; outline: 0; background: transparent; font-family: inherit; font-size: 14px; color: var(--ink); }
.st-list { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 8px; }

/* Destination rows */
.st-row { border: 1px solid var(--line); border-radius: 8px; background: #fff; overflow: hidden; transition: box-shadow 0.2s, border-color 0.2s; animation: st-pop 0.4s ease both; }
.st-row:hover { border-color: var(--gold); box-shadow: 0 0 0 1px var(--gold); }
.st-row.off { background: var(--cream); opacity: 0.8; }
.st-row-head { display: flex; align-items: center; gap: 10px; padding: 9px 12px; flex-wrap: wrap; }
.st-chev { border: 0; background: transparent; cursor: pointer; padding: 2px; color: var(--muted); display: inline-flex; }
.st-pin { width: 32px; height: 32px; border-radius: 6px; background: var(--blue); display: grid; place-items: center; flex-shrink: 0; }
.st-row.off .st-pin { background: rgba(20,33,61,0.18); }
.st-name { flex: 1; min-width: 160px; }
.st-name p { margin: 0; font-family: var(--display); font-weight: 700; font-size: 19px; line-height: 1.1; color: var(--ink); }
.st-name small { display: block; margin-top: 2px; font-size: 12px; color: var(--muted); }
.st-cost { text-align: right; min-width: 96px; }
.st-cost b { display: block; font-family: var(--display); font-weight: 700; font-size: 19px; line-height: 1.1; color: var(--blue); }
.st-cost small { font-size: 12px; color: var(--muted); }
.st-chip { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 999px; background: var(--gold-soft); color: var(--ink); }
.st-chip i { width: 6px; height: 6px; background: var(--gold); transform: rotate(45deg); display: inline-block; }
.st-chip.off { background: transparent; border: 1px solid var(--line); color: var(--muted); }
.st-chip.off i { background: var(--muted); }
.st-details { padding: 14px 16px 16px 56px; border-top: 1px solid var(--line); background: var(--paper); display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; animation: st-open 0.3s ease both; }
.st-dh { margin: 0 0 6px; font-size: 13px; font-weight: 700; color: var(--blue); }
.st-dl { margin: 0; padding-left: 17px; color: var(--ink); font-size: 13px; line-height: 1.75; }
.st-none { margin: 0; font-size: 13px; color: var(--muted); }
.st-pre { margin: 0; padding: 10px; border-radius: 6px; background: var(--cream); color: var(--ink); font-size: 11px; white-space: pre-wrap; overflow-wrap: anywhere; max-height: 180px; overflow: auto; }
.st-foot { margin-top: 4px; padding-top: 12px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.st-foot p { margin: 0; font-size: 12px; color: var(--muted); }

/* States */
.st-skel { height: 54px; border-radius: 8px; background: linear-gradient(90deg, var(--cream) 0%, #fff 50%, var(--cream) 100%); background-size: 200% 100%; animation: st-shimmer 1.4s ease-in-out infinite; }
.st-fail { padding: 18px; border-radius: 8px; background: var(--maroon); color: var(--cream); }
.st-fail strong { font-size: 15px; }
.st-fail p { margin: 6px 0 12px; font-size: 13px; }
.st-fail .st-btn { border-color: var(--cream); color: var(--cream); }
.st-fail .st-btn:hover:not(:disabled) { background: var(--cream); color: var(--maroon); }
.st-empty { text-align: center; padding: 28px; color: var(--muted); }
.st-empty p { margin: 0; font-size: 14px; }

/* Toast */
.st-toast { position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; align-items: center; gap: 10px; min-width: 240px; max-width: 360px; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; box-shadow: 0 8px 20px rgba(20,33,61,0.25); animation: st-toast-in 0.4s cubic-bezier(.2,1.3,.4,1) both; }
.st-toast.success { background: var(--blue); color: var(--cream); }
.st-toast.error { background: var(--maroon); color: var(--cream); }
.st-toast span { flex: 1; }
.st-toast button { border: 0; background: transparent; cursor: pointer; color: inherit; display: flex; }

@keyframes st-turn { 0%, 100% { transform: rotate(45deg) scale(1); } 50% { transform: rotate(225deg) scale(1.15); } }
@keyframes st-pan { to { transform: translateX(-28px); } }
@keyframes st-spin { to { transform: rotate(360deg); } }
@keyframes st-pop { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes st-open { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
@keyframes st-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
@keyframes st-toast-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }

@media (max-width: 760px) {
  .st-profile { grid-template-columns: minmax(0, 1fr); }
  .st-id { border-radius: 8px 8px 0 0; flex-direction: row; align-items: center; }
  .st-fields-panel { border-left: 1px solid var(--line); border-top: 0; border-radius: 0 0 8px 8px; }
  .st-stats { grid-template-columns: minmax(0, 1fr); }
  .st-tile:nth-child(1) { border-radius: 8px 8px 0 0; }
  .st-tile:nth-child(3) { border-radius: 0 0 8px 8px; }
  .st-details { padding-left: 16px; }
  .st-hero { padding: 20px 18px 22px; }
}
@media (prefers-reduced-motion: reduce) {
  .st-root *, .st-root *::before, .st-root *::after, .st-toast { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
}
`

// ── Logic helpers (unchanged) ─────────────────────────────────────────────────

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

function Field({ label, icon: Icon, children }) {
  return <div className="st-field">
    <label>
      {Icon && <Icon size={12} color="#0B3283" />} {label}
    </label>
    {children}
  </div>
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500)
    return () => clearTimeout(timer)
  }, [onClose])
  return <div role="status" className={`st-toast ${type === 'success' ? 'success' : 'error'}`}>
    {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
    <span>{message}</span>
    <button onClick={onClose} aria-label="Dismiss notification"><X size={14} /></button>
  </div>
}

// Display only: counts a stat tile up from its previous value.
function CountUp({ value }) {
  const [shown, setShown] = useState(0)
  const prev = useRef(0)

  useEffect(() => {
    const target = Number(value) || 0
    const from = prev.current
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || from === target) {
      setShown(target)
      prev.current = target
      return
    }
    let raf
    const start = performance.now()
    const duration = 800
    const tick = now => {
      const p = Math.min(1, (now - start) / duration)
      setShown(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
      else prev.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return <>{shown}</>
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
    <div className="st-root">
      <style>{css}</style>

      {/* Cream backdrop */}
      <div
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none', backgroundColor: '#F7EEE3' }}
      />

      {/* Hero */}
      <header className="st-hero">
        <div className="st-pattern-wrap" aria-hidden="true"><div className="st-pattern" /></div>
        <h1>Settings<span className="st-diamond" aria-hidden="true" /></h1>
        <p>View your account details and manage the AI grounding dataset.</p>
      </header>

      {/* Agent profile */}
      <div className="st-sec">
        <h2><span className="st-bullet" />Agent profile</h2>
        <p>Details from the currently logged-in account</p>
      </div>

      {profileLoading ? <p className="st-hint">Loading profile…</p> : (
        <div className="st-profile">
          <div className="st-id">
            <div className="st-avatar">{profile.name?.charAt(0)?.toUpperCase() || 'A'}</div>
            <div>
              <strong>{profile.name || 'Agent'}</strong>
              <span>{profile.agencyName || 'Your Agency'}</span>
            </div>
          </div>

          <div className="st-fields-panel">
            <div className="st-fields">
              <Field label="Full Name" icon={User}><input readOnly value={profile.name || 'Not provided'} className="st-input" /></Field>
              <Field label="Agency Name" icon={Building2}><input readOnly value={profile.agencyName || 'Not provided'} className="st-input" /></Field>
              <Field label="Email" icon={Mail}><input readOnly value={profile.email || 'Not provided'} className="st-input" /></Field>
              <Field label="Phone" icon={Phone}><input readOnly value={profile.phone || 'Not provided'} className="st-input" /></Field>
            </div>
            <p className="st-hint">These details are read from the account used to sign in.</p>
          </div>
        </div>
      )}

      {/* Dataset manager */}
      <div className="st-sec" style={{ marginTop: 6 }}>
        <h2><span className="st-bullet" />Dataset manager</h2>
        <div className="st-actions">
          <button onClick={() => loadDestinations(true)} disabled={refreshing || destLoading} className="st-btn">
            <RefreshCw size={14} className={refreshing ? 'st-spin' : ''} /> {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button onClick={() => { setShowAddForm(value => !value); setJsonError('') }} className="st-btn gold">
            <Plus size={14} /> {showAddForm ? 'Cancel' : 'Add Destination'}
          </button>
        </div>
      </div>

      <div className="st-stats">
        <div className="st-tile">
          <b>{destLoading ? '—' : <CountUp value={destinations.length} />}</b>
          <span>Destinations</span>
        </div>
        <div className="st-tile">
          <b>{destLoading ? '—' : <CountUp value={activeCount} />}</b>
          <span>Active in AI dataset</span>
        </div>
        <div className="st-tile">
          <b>{destLoading ? '—' : <CountUp value={inactiveCount} />}</b>
          <span>Inactive</span>
        </div>
      </div>

      <section className="st-panel">
        <div className="st-note">
          <Globe size={14} color="#E9A21B" style={{ flexShrink: 0, marginTop: 2 }} />
          <p>This manager is intended to read and update the same <strong>backend/data/destinations.json</strong> file used by itinerary generation. Existing records without an active flag are treated as active.</p>
        </div>

        {showAddForm && <div className="st-add">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Info size={15} color="#0B3283" /><strong>Add a complete destination record</strong></div>
          <p>Paste a complete destination object using the same schema as destinations.json. This prevents adding a name-only record that the AI cannot use.</p>
          <textarea className="st-textarea" rows={12} value={newDestinationJson} onChange={event => setNewDestinationJson(event.target.value)} spellCheck={false} placeholder={'{\n  "name": "Example State",\n  "attractions": ["Place 1", "Place 2"],\n  "avg_cost_per_day": 3000,\n  "activities": [{ "name": "Example activity", "cost": 500 }],\n  "accommodation": {},\n  "transport": {},\n  "travel_time_between": {},\n  "pricing_metadata": {}\n}'} />
          {jsonError && <p role="alert" className="st-error-inline">{jsonError}</p>}
          <div className="st-add-actions">
            <button onClick={() => { setShowAddForm(false); setJsonError('') }} className="st-btn">Cancel</button>
            <button onClick={handleAddDestination} disabled={addingDest || !newDestinationJson.trim()} className="st-btn primary"><Save size={14} /> {addingDest ? 'Adding…' : 'Add to dataset'}</button>
          </div>
        </div>}

        <div className="st-search">
          <RefreshCw size={14} color="#5B6785" />
          <input value={searchDest} onChange={event => setSearchDest(event.target.value)} placeholder="Search states, destinations, attractions or activities…" />
        </div>

        <div className="st-list">
          {destLoading ? <div style={{ display: 'grid', gap: 8 }}>{[1, 2, 3, 4].map(index => <div key={index} className="st-skel" />)}</div>
            : destError ? <div className="st-fail"><strong>Could not load the actual AI dataset</strong><p>{destError}</p><button onClick={() => loadDestinations(true)} className="st-btn">Retry</button></div>
              : filteredDestinations.length === 0 ? <div className="st-empty"><Database size={26} style={{ margin: '0 auto 8px', display: 'block', opacity: .4 }} /><p>{destinations.length === 0 ? 'The AI destination dataset is empty.' : 'No matching destinations found.'}</p></div>
                : <>
                  {filteredDestinations.map(destination => {
                    const key = destination._key
                    const isActive = destination.active !== false
                    const isExpanded = !!expanded[key]
                    const attractions = asArray(destination.attractions)
                    const activities = asArray(destination.activities)
                    return <article key={key} className={`st-row ${isActive ? '' : 'off'}`}>
                      <div className="st-row-head">
                        <button className="st-chev" onClick={() => toggleExpanded(key)} aria-label={isExpanded ? 'Collapse destination details' : 'Expand destination details'}>{isExpanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}</button>
                        <div className="st-pin"><MapPin size={15} color={isActive ? '#E9A21B' : '#F7EEE3'} /></div>
                        <div className="st-name">
                          <p>{destination.name || 'Unnamed destination'}</p>
                          <small>{getDestinationRegion(destination)} · {attractions.length} attractions · {activities.length} activities</small>
                        </div>
                        <div className="st-cost"><b>{formatMoney(destination.avg_cost_per_day)}</b><small>average per day</small></div>
                        <span className={`st-chip ${isActive ? '' : 'off'}`}><i />{isActive ? 'Active' : 'Inactive'}</span>
                        <button disabled={busyKey === key} onClick={() => handleToggleActive(destination)} className="st-btn">{busyKey === key ? 'Saving…' : isActive ? 'Disable' : 'Enable'}</button>
                        <button disabled={busyKey === key} onClick={() => handleDeleteDestination(destination)} title="Remove destination from dataset" aria-label="Remove destination from dataset" className="st-btn danger"><Trash2 size={14} /></button>
                      </div>
                      {isExpanded && <div className="st-details">
                        <DetailList title="Attractions" items={attractions} />
                        <DetailList title="Activities" items={activities} showCost />
                        <div><p className="st-dh">Accommodation</p><pre className="st-pre">{JSON.stringify(destination.accommodation || {}, null, 2)}</pre></div>
                        <div><p className="st-dh">Transport</p><pre className="st-pre">{JSON.stringify(destination.transport || {}, null, 2)}</pre></div>
                        {destination.pricing_metadata && <div><p className="st-dh">Pricing metadata</p><pre className="st-pre">{JSON.stringify(destination.pricing_metadata, null, 2)}</pre></div>}
                      </div>}
                    </article>
                  })}
                </>}
          {!destLoading && !destError && destinations.length > 0 && <div className="st-foot">
            <p>{filteredDestinations.length} of {destinations.length} destinations shown</p>
            <p>{activeCount} active in AI dataset</p>
          </div>}
        </div>
      </section>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

function DetailList({ title, items, showCost = false }) {
  return <div>
    <p className="st-dh">{title} ({items.length})</p>
    {items.length === 0 ? <p className="st-none">None listed</p> : <ul className="st-dl">
      {items.map((item, index) => {
        const label = typeof item === 'string' ? item : item?.name || item?.activity || JSON.stringify(item)
        const cost = typeof item === 'object' && item !== null ? item.cost ?? item.avg_cost : null
        return <li key={`${label}-${index}`}>{label}{showCost && cost != null ? ` — ${formatMoney(cost)}` : ''}</li>
      })}
    </ul>}
  </div>
}

export default Settings