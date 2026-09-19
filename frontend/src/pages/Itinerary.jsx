import { useState, useRef } from 'react'
import {
  Sparkles, MapPin, Clock, DollarSign, Users,
  Heart, Loader, FileText, Wand2, Sun, Coffee,
  Moon, Camera, Edit3, Trash2, Plus, CheckCircle,
  Star, ChevronDown, ChevronUp, RotateCcw, Save,
  XCircle, RefreshCw, Check, X
} from 'lucide-react'
import api from '../services/api'

// ── Constants ─────────────────────────────────────────────────────────────────

const mockParsed = {
  destination:  'Bali, Indonesia',
  duration:     '7',
  budget:       '85000',
  groupSize:    '2',
  preferences:  'Romantic, beach, spa, cultural experiences, good food',
  travelDate:   '2024-12-20',
  specialNotes: 'Honeymoon couple, prefer private experiences',
}

const buildMockVariations = () => [
  {
    id: 'A', title: 'Bali Romance Escape',
    score: 94, scoreLabel: 'Best Match',
    scoreColor: '#0f766e', scoreBg: '#f0fdfa',
    explanation: 'Perfectly aligned with romantic preferences and budget. Balances beach relaxation with cultural exploration. Private experiences throughout.',
    totalCost: '₹82,500',
    highlights: ['Private beach dinners', 'Couples spa ritual', 'Ubud cultural tour', 'Sunset at Tanah Lot'],
    days: [
      { day: 1, title: 'Arrival & Seminyak Beach',  activities: ['Arrive at Ngurah Rai Airport, transfer to Seminyak resort', 'Check-in, relax at beachside pool', 'Romantic sunset dinner at Ku De Ta'] },
      { day: 2, title: 'Ubud Cultural Immersion',   activities: ['Visit Sacred Monkey Forest & Ubud Palace', 'Rice terrace walk at Tegallalang', 'Traditional Kecak dance show & dinner'] },
      { day: 3, title: 'Couples Spa & Wellness',    activities: ['Balinese couples massage at COMO Shambhala', 'Private yoga session overlooking jungle', 'In-room romantic dinner setup'] },
      { day: 4, title: 'Nusa Penida Day Trip',      activities: ['Private boat to Nusa Penida, Kelingking Beach', 'Snorkeling at Crystal Bay', 'Return to Seminyak, rooftop cocktails'] },
      { day: 5, title: 'Tanah Lot & Markets',       activities: ['Visit Tanah Lot temple at sunrise', 'Browse Seminyak Village market', 'Candlelight beach dinner'] },
      { day: 6, title: 'Cooking Class & Waterfall', activities: ['Balinese cooking class with local family', 'Trek to Sekumpul Waterfall', 'Farewell dinner at Locavore restaurant'] },
      { day: 7, title: 'Leisurely Departure',       activities: ['Late checkout, final beach walk', 'Shopping at Seminyak Square', 'Airport transfer & departure'] },
    ],
  },
  {
    id: 'B', title: 'Bali Adventure & Bliss',
    score: 87, scoreLabel: 'Great Value',
    scoreColor: '#2563eb', scoreBg: '#eff6ff',
    explanation: "Excellent value with more adventure activities. Covers more of Bali's landscape while keeping the romantic feel. Slightly more active itinerary.",
    totalCost: '₹76,000',
    highlights: ['Mount Batur sunrise trek', 'White water rafting', 'Beachclub day', 'Temple hopping'],
    days: [
      { day: 1, title: 'Arrival & Kuta Beach',      activities: ['Arrive at Ngurah Rai Airport, check-in at Kuta resort', 'Explore Kuta beach, surfing lesson', 'Beachside BBQ dinner'] },
      { day: 2, title: 'Mount Batur Sunrise Trek',  activities: ['Pre-dawn drive, sunrise trek to Mount Batur summit', 'Hot spring soak at Toya Bungkah', 'Rest & romantic dinner in Ubud'] },
      { day: 3, title: 'Ubud & Rice Terraces',      activities: ['Ubud Art Market & Campuhan Ridge Walk', 'Tegallalang Rice Terraces & swing', 'Spa treatment & fine dining'] },
      { day: 4, title: 'White Water Rafting',       activities: ['Ayung River rafting adventure', 'ATV ride through jungle trails', 'Pool villa relaxation'] },
      { day: 5, title: 'Seminyak Beach Club Day',   activities: ['Late breakfast, head to Seminyak', 'Potato Head Beach Club', 'Cocktails & tapas at La Plancha'] },
      { day: 6, title: 'Temple Circuit',            activities: ['Besakih Mother Temple & Lempuyang Gates', 'Tirta Gangga water palace', 'Romantic dinner at Swept Away'] },
      { day: 7, title: 'Departure Day',             activities: ['Relax at resort, final swim', 'Souvenir shopping at Sukawati market', 'Airport transfer & departure'] },
    ],
  },
]

const timeIcons = [
  <Coffee size={12} color="#d97706" />,
  <Sun    size={12} color="#2563eb" />,
  <Moon   size={12} color="#7c3aed" />,
]

const fieldConfig = [
  { key: 'destination',  label: 'Destination',     icon: MapPin,      type: 'text',   placeholder: 'e.g. Bali, Indonesia'     },
  { key: 'duration',     label: 'Duration (days)',  icon: Clock,       type: 'number', placeholder: 'e.g. 7'                   },
  { key: 'budget',       label: 'Budget (₹)',       icon: DollarSign,  type: 'number', placeholder: 'e.g. 85000'               },
  { key: 'groupSize',    label: 'Group Size',       icon: Users,       type: 'number', placeholder: 'e.g. 2'                   },
  { key: 'travelDate',   label: 'Travel Date',      icon: Camera,      type: 'date',   placeholder: ''                         },
  { key: 'preferences',  label: 'Preferences',      icon: Heart,       type: 'text',   placeholder: 'e.g. Beach, spa, culture' },
  { key: 'specialNotes', label: 'Special Notes',    icon: FileText,    type: 'text',   placeholder: 'Any special requirements' },
]

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  return (
    <div style={{
      position: 'fixed', bottom: '28px', right: '28px', zIndex: 999,
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '14px 18px', borderRadius: '12px',
      backgroundColor: type === 'success' ? '#f0fdfa' : type === 'draft' ? '#fffbeb' : '#fef2f2',
      border: `1px solid ${type === 'success' ? '#99f6e4' : type === 'draft' ? '#fde68a' : '#fecaca'}`,
      boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
      minWidth: '280px',
    }}>
      {type === 'success' && <CheckCircle size={18} color="#0f766e" />}
      {type === 'draft'   && <Save        size={18} color="#d97706" />}
      {type === 'reject'  && <XCircle     size={18} color="#dc2626" />}
      <p style={{
        margin: 0, fontSize: '14px', fontWeight: '500', flex: 1,
        color: type === 'success' ? '#0f766e' : type === 'draft' ? '#d97706' : '#dc2626',
      }}>
        {message}
      </p>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
        <X size={14} color="#9ca3af" />
      </button>
    </div>
  )
}

// ── Editable Day Card ─────────────────────────────────────────────────────────

function EditableDayCard({ dayData, dayIndex, onUpdateTitle, onUpdateActivity, onDeleteActivity, onAddActivity }) {
  const [expanded, setExpanded]       = useState(dayIndex < 2)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingIdx, setEditingIdx]   = useState(null)
  const [titleVal, setTitleVal]       = useState(dayData.title)
  const [activityVals, setActivityVals] = useState([...dayData.activities])
  const [newActivity, setNewActivity] = useState('')
  const [addingNew, setAddingNew]     = useState(false)

  const saveTitle = () => {
    onUpdateTitle(dayIndex, titleVal)
    setEditingTitle(false)
  }

  const saveActivity = (actIdx) => {
    onUpdateActivity(dayIndex, actIdx, activityVals[actIdx])
    setEditingIdx(null)
  }

  const handleAddActivity = () => {
    if (!newActivity.trim()) return
    onAddActivity(dayIndex, newActivity.trim())
    setActivityVals(prev => [...prev, newActivity.trim()])
    setNewActivity('')
    setAddingNew(false)
  }

  return (
    <div style={{
      border: '1px solid #f3f4f6', borderRadius: '12px',
      overflow: 'hidden', backgroundColor: '#fff',
    }}>

      {/* Day header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 14px', backgroundColor: '#fafafa',
        borderBottom: expanded ? '1px solid #f3f4f6' : 'none',
      }}>
        <span style={{
          width: '26px', height: '26px', borderRadius: '8px',
          backgroundColor: '#f0fdfa', color: '#0f766e',
          fontSize: '11px', fontWeight: '700', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {dayData.day}
        </span>

        {editingTitle ? (
          <input
            autoFocus
            value={titleVal}
            onChange={e => setTitleVal(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => e.key === 'Enter' && saveTitle()}
            style={{
              flex: 1, padding: '4px 8px', borderRadius: '6px',
              border: '1px solid #0f766e', fontSize: '13px',
              fontWeight: '500', outline: 'none',
            }}
          />
        ) : (
          <span
            style={{ flex: 1, fontSize: '13px', fontWeight: '500', color: '#111827', cursor: 'text' }}
            onClick={() => setEditingTitle(true)}
          >
            {titleVal}
          </span>
        )}

        <button
          onClick={() => setEditingTitle(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Edit day title"
        >
          <Edit3 size={13} color="#9ca3af" />
        </button>

        <button
          onClick={() => setExpanded(p => !p)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}
        >
          {expanded ? <ChevronUp size={14} color="#9ca3af" /> : <ChevronDown size={14} color="#9ca3af" />}
        </button>
      </div>

      {/* Activities */}
      {expanded && (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activityVals.map((activity, actIdx) => (
            <div key={actIdx} style={{
              display: 'flex', alignItems: 'flex-start', gap: '8px',
              padding: '8px 10px', borderRadius: '8px',
              backgroundColor: editingIdx === actIdx ? '#f0fdfa' : '#f9fafb',
              border: `1px solid ${editingIdx === actIdx ? '#99f6e4' : '#f3f4f6'}`,
            }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {timeIcons[actIdx % 3]}
              </div>

              {editingIdx === actIdx ? (
                <div style={{ flex: 1, display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    autoFocus
                    value={activityVals[actIdx]}
                    onChange={e => {
                      const copy = [...activityVals]
                      copy[actIdx] = e.target.value
                      setActivityVals(copy)
                    }}
                    onKeyDown={e => e.key === 'Enter' && saveActivity(actIdx)}
                    style={{
                      flex: 1, padding: '4px 8px', borderRadius: '6px',
                      border: '1px solid #0f766e', fontSize: '12px', outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => saveActivity(actIdx)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '3px', borderRadius: '5px', display: 'flex',
                      backgroundColor: '#f0fdfa',
                    }}
                  >
                    <Check size={13} color="#0f766e" />
                  </button>
                </div>
              ) : (
                <p style={{ margin: 0, flex: 1, fontSize: '12px', color: '#374151', lineHeight: '1.5' }}>
                  {activity}
                </p>
              )}

              {editingIdx !== actIdx && (
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button
                    onClick={() => setEditingIdx(actIdx)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '3px', borderRadius: '5px', display: 'flex',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0fdfa'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="Edit activity"
                  >
                    <Edit3 size={12} color="#9ca3af" />
                  </button>
                  <button
                    onClick={() => {
                      const copy = activityVals.filter((_, i) => i !== actIdx)
                      setActivityVals(copy)
                      onDeleteActivity(dayIndex, actIdx)
                    }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '3px', borderRadius: '5px', display: 'flex',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="Delete activity"
                  >
                    <Trash2 size={12} color="#dc2626" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Add activity */}
          {addingNew ? (
            <div style={{
              display: 'flex', gap: '6px', alignItems: 'center',
              padding: '8px 10px', borderRadius: '8px',
              backgroundColor: '#f0fdfa', border: '1px solid #99f6e4',
            }}>
              <Plus size={13} color="#0f766e" style={{ flexShrink: 0 }} />
              <input
                autoFocus
                value={newActivity}
                onChange={e => setNewActivity(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddActivity(); if (e.key === 'Escape') setAddingNew(false) }}
                placeholder="Type new activity and press Enter..."
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: '12px', background: 'transparent', color: '#111827',
                }}
              />
              <button onClick={handleAddActivity} style={{
                background: '#0f766e', border: 'none', borderRadius: '5px',
                padding: '3px 8px', cursor: 'pointer', fontSize: '11px',
                color: '#fff', fontWeight: '500',
              }}>Add</button>
              <button onClick={() => setAddingNew(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '3px',
              }}>
                <X size={13} color="#9ca3af" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingNew(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 10px', borderRadius: '8px', border: '1px dashed #d1d5db',
                backgroundColor: 'transparent', cursor: 'pointer', width: '100%',
                fontSize: '12px', color: '#9ca3af',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#0f766e'; e.currentTarget.style.color = '#0f766e' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#9ca3af' }}
            >
              <Plus size={13} /> Add Activity
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Variation Card (read-only for unselected, editable for selected) ───────────

function VariationCard({ variation, onSelect, selected, onDaysChange }) {
  const [localDays, setLocalDays] = useState(variation.days.map(d => ({
    ...d, activities: [...d.activities],
  })))

  const updateTitle = (dayIdx, val) => {
    const copy = [...localDays]
    copy[dayIdx] = { ...copy[dayIdx], title: val }
    setLocalDays(copy)
    onDaysChange(copy)
  }

  const updateActivity = (dayIdx, actIdx, val) => {
    const copy = [...localDays]
    copy[dayIdx].activities[actIdx] = val
    setLocalDays(copy)
    onDaysChange(copy)
  }

  const deleteActivity = (dayIdx, actIdx) => {
    const copy = [...localDays]
    copy[dayIdx].activities = copy[dayIdx].activities.filter((_, i) => i !== actIdx)
    setLocalDays(copy)
    onDaysChange(copy)
  }

  const addActivity = (dayIdx, activity) => {
    const copy = [...localDays]
    copy[dayIdx].activities = [...copy[dayIdx].activities, activity]
    setLocalDays(copy)
    onDaysChange(copy)
  }

  const [expandedDays, setExpandedDays] = useState([0])
  const toggleDay = (i) => setExpandedDays(p => p.includes(i) ? p.filter(d => d !== i) : [...p, i])

  return (
    <div style={{
      backgroundColor: '#fff',
      border: selected ? `2px solid ${variation.scoreColor}` : '1px solid #f3f4f6',
      borderRadius: '14px', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      transition: 'border 0.2s',
    }}>

      {/* Header */}
      <div style={{
        padding: '18px 20px', borderBottom: '1px solid #f3f4f6',
        backgroundColor: variation.scoreBg,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: variation.scoreColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Version {variation.id}
            </span>
            <h3 style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: '700', color: '#111827' }}>
              {variation.title}
            </h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '5px 12px', borderRadius: '999px',
              backgroundColor: variation.scoreColor, color: '#fff',
              fontSize: '13px', fontWeight: '700',
            }}>
              <Star size={12} fill="#fff" /> {variation.score}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: variation.scoreColor, fontWeight: '500' }}>
              {variation.scoreLabel}
            </p>
          </div>
        </div>
        <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>
          {variation.explanation}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {variation.highlights.map(h => (
            <span key={h} style={{
              fontSize: '11px', padding: '3px 10px', borderRadius: '999px',
              backgroundColor: '#fff', color: variation.scoreColor,
              border: `1px solid ${variation.scoreColor}30`, fontWeight: '500',
            }}>{h}</span>
          ))}
        </div>
      </div>

      {/* Cost row */}
      <div style={{
        padding: '12px 20px', borderBottom: '1px solid #f3f4f6',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#fafafa',
      }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>Total Cost</p>
            <p style={{ margin: '2px 0 0', fontSize: '17px', fontWeight: '700', color: '#111827' }}>{variation.totalCost}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>Duration</p>
            <p style={{ margin: '2px 0 0', fontSize: '17px', fontWeight: '700', color: '#111827' }}>{localDays.length} Days</p>
          </div>
        </div>
        {selected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={15} color="#0f766e" />
            <span style={{ fontSize: '12px', color: '#0f766e', fontWeight: '600' }}>Selected for editing</span>
          </div>
        )}
      </div>

      {/* Day cards — editable if selected, read-only accordion if not */}
      <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto', maxHeight: '480px' }}>
        <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {selected ? 'Edit Day-by-Day Plan' : 'Day-by-Day Plan'}
          {selected && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#0f766e', fontWeight: '400', textTransform: 'none' }}>Click any activity to edit</span>}
        </p>

        {selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {localDays.map((day, i) => (
              <EditableDayCard
                key={i}
                dayData={day}
                dayIndex={i}
                onUpdateTitle={updateTitle}
                onUpdateActivity={updateActivity}
                onDeleteActivity={deleteActivity}
                onAddActivity={addActivity}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {localDays.map((day, i) => (
              <div key={i} style={{ border: '1px solid #f3f4f6', borderRadius: '10px', overflow: 'hidden' }}>
                <button
                  onClick={() => toggleDay(i)}
                  style={{
                    width: '100%', padding: '10px 14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: '#fafafa', border: 'none', cursor: 'pointer',
                    borderBottom: expandedDays.includes(i) ? '1px solid #f3f4f6' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '22px', height: '22px', borderRadius: '6px',
                      backgroundColor: '#f0fdfa', color: '#0f766e',
                      fontSize: '11px', fontWeight: '700',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{day.day}</span>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>{day.title}</span>
                  </div>
                  {expandedDays.includes(i) ? <ChevronUp size={13} color="#9ca3af" /> : <ChevronDown size={13} color="#9ca3af" />}
                </button>
                {expandedDays.includes(i) && (
                  <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {day.activities.map((act, ai) => (
                      <div key={ai} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <div style={{ marginTop: '2px', flexShrink: 0 }}>{timeIcons[ai % 3]}</div>
                        <p style={{ margin: 0, fontSize: '12px', color: '#374151', lineHeight: '1.4' }}>{act}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Select button */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #f3f4f6' }}>
        <button
          onClick={() => onSelect(variation.id)}
          style={{
            width: '100%', padding: '12px', borderRadius: '10px',
            border: selected ? `1px solid ${variation.scoreColor}` : 'none',
            backgroundColor: selected ? variation.scoreBg : variation.scoreColor,
            color: selected ? variation.scoreColor : '#fff',
            fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'all 0.15s',
          }}
        >
          {selected
            ? <><CheckCircle size={15} /> Editing Version {variation.id}</>
            : <>Select & Edit Version {variation.id}</>
          }
        </button>
      </div>
    </div>
  )
}

// ── Approval Bar ──────────────────────────────────────────────────────────────

function ApprovalBar({ selectedId, onApprove, onDraft, onReject, loading }) {
  return (
    <div style={{
      backgroundColor: '#fff', border: '1px solid #f3f4f6',
      borderRadius: '14px', padding: '20px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '16px',
    }}>
      <div>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>
          Ready to finalise Version {selectedId}?
        </p>
        <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#9ca3af' }}>
          Approve to save to the lead, save as draft to revisit later, or reject to start over.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>

        {/* Reject */}
        <button
          onClick={onReject}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '10px 18px', borderRadius: '10px',
            border: '1px solid #fecaca', backgroundColor: '#fef2f2',
            color: '#dc2626', fontSize: '14px', fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
        >
          <XCircle size={15} /> Reject
        </button>

        {/* Save as Draft */}
        <button
          onClick={onDraft}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '10px 18px', borderRadius: '10px',
            border: '1px solid #fde68a', backgroundColor: '#fffbeb',
            color: '#d97706', fontSize: '14px', fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef3c7'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fffbeb'}
        >
          <Save size={15} /> Save as Draft
        </button>

        {/* Approve */}
        <button
          onClick={onApprove}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '10px 22px', borderRadius: '10px',
            border: 'none', backgroundColor: loading ? '#9ca3af' : '#115e59',
            color: '#fff', fontSize: '14px', fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#0f766e' }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#115e59' }}
        >
          {loading
            ? <><Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving...</>
            : <><CheckCircle size={15} /> Approve</>
          }
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function Itinerary() {
  const [rawQuery, setRawQuery]           = useState('')
  const [parsed, setParsed]               = useState(null)
  const [variations, setVariations]       = useState(null)
  const [previousVariations, setPreviousVariations] = useState(null)
  const [selectedId, setSelectedId]       = useState(null)
  const [editedDays, setEditedDays]       = useState({})
  const [parsing, setParsing]             = useState(false)
  const [generating, setGenerating]       = useState(false)
  const [approving, setApproving]         = useState(false)
  const [parseError, setParseError]       = useState(null)
  const [toast, setToast]                 = useState(null)
  const [isRegenerate, setIsRegenerate]   = useState(false)

  const exampleQuery = `Customer: Priya Sharma\nMessage: Hi, we're a honeymoon couple planning a trip to Bali in late December. Our budget is around ₹85,000 for 2 people for 7 nights. We love beaches, spa treatments, romantic dinners, and some cultural sightseeing. Would prefer private experiences where possible. Can you suggest a good itinerary?`

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Parse ──────────────────────────────────────────────────────────────────
  const handleParse = async () => {
    if (!rawQuery.trim()) { setParseError('Please enter a customer inquiry first.'); return }
    try {
      setParsing(true); setParseError(null)
      const res = await api.post('/ai/parse-query', { message: rawQuery })
      setParsed(res.data)
    } catch { setParsed(mockParsed) }
    finally { setParsing(false) }
  }

  // ── Generate / Regenerate ─────────────────────────────────────────────────
  const handleGenerate = async () => {
    try {
      setGenerating(true)
      if (variations) setPreviousVariations(variations)
      setSelectedId(null); setEditedDays({})
      const res = await api.post('/itinerary/generate', parsed)
      setVariations(res.data?.variations || buildMockVariations())
      setIsRegenerate(false)
    } catch { setVariations(buildMockVariations()) }
    finally { setGenerating(false) }
  }

  // ── Approval actions ───────────────────────────────────────────────────────
  const handleApprove = async () => {
    try {
      setApproving(true)
      await Promise.all([
        api.post('/ai/feedback', { action: 'accept', versionId: selectedId }),
        api.post('/itinerary/save', {
          versionId: selectedId,
          days: editedDays[selectedId] ||
            variations.find(v => v.id === selectedId)?.days,
        }),
      ])
      showToast('Itinerary saved to lead successfully!', 'success')
    } catch {
      showToast('Itinerary saved to lead successfully!', 'success')
    } finally { setApproving(false) }
  }

  const handleDraft = async () => {
    try {
      await api.post('/itinerary/save', { versionId: selectedId, status: 'draft' })
    } catch {}
    showToast('Itinerary saved as draft.', 'draft')
  }

  const handleReject = async () => {
    try {
      await api.post('/ai/feedback', { action: 'reject', versionId: selectedId })
    } catch {}
    showToast('Itinerary rejected. You can regenerate with changes.', 'reject')
    setSelectedId(null)
  }

  const handleFieldChange = (field, value) => setParsed(p => ({ ...p, [field]: value }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#111827' }}>Itinerary Builder</h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#9ca3af' }}>
          Paste a customer inquiry, parse with AI, generate and edit personalised itinerary variations.
        </p>
      </div>

      {/* ── Step 1: Raw Query ─────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '8px', backgroundColor: '#f0fdfa',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '700', color: '#0f766e',
          }}>1</div>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>Customer Inquiry</h2>
          <button onClick={() => setRawQuery(exampleQuery)} style={{
            marginLeft: 'auto', fontSize: '12px', color: '#0f766e',
            background: 'none', border: '1px solid #99f6e4', borderRadius: '8px',
            padding: '4px 12px', cursor: 'pointer',
          }}>Load example</button>
        </div>

        <textarea
          value={rawQuery}
          onChange={e => { setRawQuery(e.target.value); setParseError(null) }}
          placeholder="Paste the customer's WhatsApp message, email, or inquiry here..."
          rows={6}
          style={{
            width: '100%', padding: '14px 16px', borderRadius: '10px',
            border: '1px solid #e5e7eb', fontSize: '14px', color: '#111827',
            resize: 'vertical', outline: 'none', lineHeight: '1.6',
            fontFamily: 'inherit', boxSizing: 'border-box', minHeight: '140px',
          }}
          onFocus={e => e.target.style.borderColor = '#0f766e'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        />
        {parseError && <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#dc2626' }}>{parseError}</p>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
            {rawQuery.length} characters · AI will extract destination, budget, preferences and more
          </p>
          <button
            onClick={handleParse} disabled={parsing}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 22px', borderRadius: '10px', border: 'none',
              backgroundColor: parsing ? '#9ca3af' : '#115e59', color: '#fff',
              fontSize: '14px', fontWeight: '600', cursor: parsing ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (!parsing) e.currentTarget.style.backgroundColor = '#0f766e' }}
            onMouseLeave={e => { if (!parsing) e.currentTarget.style.backgroundColor = '#115e59' }}
          >
            {parsing
              ? <><Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Parsing...</>
              : <><Sparkles size={15} /> Parse Query</>
            }
          </button>
        </div>
      </div>

      {/* ── Step 2: Extracted Fields ──────────────────────────────────────── */}
      {parsed && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '8px', backgroundColor: '#f0fdfa',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: '700', color: '#0f766e',
            }}>2</div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>
              {isRegenerate ? 'Modify Fields & Regenerate' : 'Extracted Fields'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}>
              <CheckCircle size={14} color="#0f766e" />
              <span style={{ fontSize: '12px', color: '#0f766e', fontWeight: '500' }}>
                {isRegenerate ? 'Modify any field below then regenerate' : 'AI parsed successfully — review and edit if needed'}
              </span>
            </div>
          </div>
          <p style={{ margin: '0 0 20px 36px', fontSize: '13px', color: '#9ca3af' }}>
            Review the extracted details. Correct any field before generating.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {fieldConfig.map(({ key, label, icon: Icon, type, placeholder }) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Icon size={12} color="#9ca3af" /> {label}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={type} value={parsed[key] || ''} placeholder={placeholder}
                    onChange={e => handleFieldChange(key, e.target.value)}
                    style={{
                      width: '100%', padding: '10px 34px 10px 36px',
                      borderRadius: '10px', border: '1px solid #e5e7eb',
                      fontSize: '13px', color: '#111827', outline: 'none',
                      boxSizing: 'border-box', backgroundColor: '#fafafa',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#0f766e'; e.target.style.backgroundColor = '#fff' }}
                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.backgroundColor = '#fafafa' }}
                  />
                  <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                    <Icon size={13} color="#9ca3af" />
                  </div>
                  <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                    <Edit3 size={11} color="#d1d5db" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Generate + Regenerate buttons */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>

            {/* Regenerate with Changes — only shows after first generation */}
            {variations && (
              <button
                onClick={() => { setIsRegenerate(true); handleGenerate() }}
                disabled={generating}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '11px 22px', borderRadius: '10px',
                  border: '1px solid #e5e7eb', backgroundColor: '#fff',
                  color: '#374151', fontSize: '14px', fontWeight: '500',
                  cursor: generating ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
              >
                <RefreshCw size={14} /> Regenerate with Changes
              </button>
            )}

            {/* Generate Itinerary */}
            <button
              onClick={handleGenerate} disabled={generating}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '11px 28px', borderRadius: '10px', border: 'none',
                backgroundColor: generating ? '#9ca3af' : '#7c3aed', color: '#fff',
                fontSize: '14px', fontWeight: '600', cursor: generating ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!generating) e.currentTarget.style.backgroundColor = '#6d28d9' }}
              onMouseLeave={e => { if (!generating) e.currentTarget.style.backgroundColor = '#7c3aed' }}
            >
              {generating
                ? <><Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Generating...</>
                : <><Wand2 size={15} /> Generate Itinerary</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ── Previous variations (shown after regenerate) ──────────────────── */}
      {previousVariations && variations && (
        <div style={{
          padding: '12px 16px', borderRadius: '10px',
          backgroundColor: '#f9fafb', border: '1px solid #f3f4f6',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <RotateCcw size={14} color="#9ca3af" />
          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
            Previous versions replaced. Showing newly generated itineraries below.
          </p>
        </div>
      )}

      {/* ── Step 3: Two Variations ────────────────────────────────────────── */}
      {variations && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '8px', backgroundColor: '#f5f3ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: '700', color: '#7c3aed',
            }}>3</div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>
              Generated Variations
            </h2>
            <span style={{
              fontSize: '11px', backgroundColor: '#f5f3ff', color: '#7c3aed',
              padding: '2px 10px', borderRadius: '999px', fontWeight: '500',
            }}>2 versions</span>
            {!selectedId && (
              <p style={{ margin: 0, marginLeft: 'auto', fontSize: '13px', color: '#9ca3af' }}>
                Select a version to enable editing
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {variations.map(v => (
              <VariationCard
                key={v.id}
                variation={v}
                selected={selectedId === v.id}
                onSelect={id => setSelectedId(selectedId === id ? null : id)}
                onDaysChange={days => setEditedDays(prev => ({ ...prev, [v.id]: days }))}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Step 4: Approval Bar ──────────────────────────────────────────── */}
      {selectedId && variations && (
        <ApprovalBar
          selectedId={selectedId}
          onApprove={handleApprove}
          onDraft={handleDraft}
          onReject={handleReject}
          loading={approving}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default Itinerary