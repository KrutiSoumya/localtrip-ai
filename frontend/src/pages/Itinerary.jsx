import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Sparkles, MapPin, Clock, DollarSign, Users,
  Heart, Loader, Wand2, Sun, Coffee,
  Moon, Edit3, Trash2, Plus, CheckCircle,
  Star, ChevronDown, ChevronUp, RotateCcw, Save,
  XCircle, RefreshCw, Check, X
} from 'lucide-react'
import api, { getLeadById } from '../services/api'

// ── Constants ─────────────────────────────────────────────────────────────────

const buildFallbackVariation = (parsed) => ({
  id: 'A',
  title: `${parsed?.destination || 'Trip'} Itinerary`,
  score: 0,
  scoreLabel: 'AI Generated',
  scoreColor: '#0f766e',
  scoreBg: '#f0fdfa',
  explanation: `AI-generated itinerary for ${parsed?.destination || 'the selected destination'}.`,
  totalCost: parsed?.budget_total
    ? `₹${parsed.budget_total}`
    : 'Not specified',
  highlights: Array.isArray(parsed?.interests)
    ? parsed.interests
    : typeof parsed?.interests === 'string'
      ? parsed.interests.split(',').map(i => i.trim()).filter(Boolean)
      : [],
  days: [],
})

const timeIcons = [
  <Coffee size={12} color="#d97706" />,
  <Sun size={12} color="#2563eb" />,
  <Moon size={12} color="#7c3aed" />,
]

const fieldConfig = [
  {
    key: 'destination',
    label: 'Destination',
    icon: MapPin,
    type: 'text',
    placeholder: 'e.g. Goa, India',
  },
  {
    key: 'duration_days',
    label: 'Duration (days)',
    icon: Clock,
    type: 'number',
    placeholder: 'e.g. 5',
  },
  {
    key: 'budget_total',
    label: 'Budget (₹)',
    icon: DollarSign,
    type: 'number',
    placeholder: 'e.g. 50000',
  },
  {
    key: 'group_size',
    label: 'Group Size',
    icon: Users,
    type: 'number',
    placeholder: 'e.g. 2',
  },
  {
    key: 'group_type',
    label: 'Group Type',
    icon: Users,
    type: 'text',
    placeholder: 'e.g. couple',
  },
  {
    key: 'interests',
    label: 'Interests',
    icon: Heart,
    type: 'text',
    placeholder: 'e.g. beach, food',
  },
]

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 18px',
        borderRadius: '12px',
        backgroundColor:
          type === 'success'
            ? '#f0fdfa'
            : type === 'draft'
              ? '#fffbeb'
              : '#fef2f2',
        border: `1px solid ${
          type === 'success'
            ? '#99f6e4'
            : type === 'draft'
              ? '#fde68a'
              : '#fecaca'
        }`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
        minWidth: '280px',
      }}
    >
      {type === 'success' && <CheckCircle size={18} color="#0f766e" />}
      {type === 'draft' && <Save size={18} color="#d97706" />}
      {type === 'reject' && <XCircle size={18} color="#dc2626" />}

      <p
        style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: '500',
          flex: 1,
          color:
            type === 'success'
              ? '#0f766e'
              : type === 'draft'
                ? '#d97706'
                : '#dc2626',
        }}
      >
        {message}
      </p>

      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px',
        }}
      >
        <X size={14} color="#9ca3af" />
      </button>
    </div>
  )
}

// ── Editable Day Card ─────────────────────────────────────────────────────────

function EditableDayCard({
  dayData,
  dayIndex,
  onUpdateTitle,
  onUpdateActivity,
  onDeleteActivity,
  onAddActivity,
}) {
  const [expanded, setExpanded] = useState(dayIndex < 2)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingIdx, setEditingIdx] = useState(null)
  const [titleVal, setTitleVal] = useState(dayData.title)
  const [activityVals, setActivityVals] = useState([
    ...dayData.activities,
  ])
  const [newActivity, setNewActivity] = useState('')
  const [addingNew, setAddingNew] = useState(false)

  const saveTitle = () => {
    onUpdateTitle(dayIndex, titleVal)
    setEditingTitle(false)
  }

  const saveActivity = (actIdx) => {
    onUpdateActivity(
      dayIndex,
      actIdx,
      activityVals[actIdx]
    )
    setEditingIdx(null)
  }

  const handleAddActivity = () => {
    if (!newActivity.trim()) return

    onAddActivity(dayIndex, newActivity.trim())

    setActivityVals(prev => [
      ...prev,
      newActivity.trim(),
    ])

    setNewActivity('')
    setAddingNew(false)
  }

  return (
    <div
      style={{
        border: '1px solid #f3f4f6',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#fff',
      }}
    >
      {/* Day header */}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 14px',
          backgroundColor: '#fafafa',
          borderBottom: expanded
            ? '1px solid #f3f4f6'
            : 'none',
        }}
      >
        <span
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '8px',
            backgroundColor: '#f0fdfa',
            color: '#0f766e',
            fontSize: '11px',
            fontWeight: '700',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {dayData.day}
        </span>

        {editingTitle ? (
          <input
            autoFocus
            value={titleVal}
            onChange={e => setTitleVal(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e =>
              e.key === 'Enter' && saveTitle()
            }
            style={{
              flex: 1,
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid #0f766e',
              fontSize: '13px',
              fontWeight: '500',
              outline: 'none',
            }}
          />
        ) : (
          <span
            style={{
              flex: 1,
              fontSize: '13px',
              fontWeight: '500',
              color: '#111827',
              cursor: 'text',
            }}
            onClick={() => setEditingTitle(true)}
          >
            {titleVal}
          </span>
        )}

        <button
          onClick={() => setEditingTitle(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
          }}
          title="Edit day title"
        >
          <Edit3 size={13} color="#9ca3af" />
        </button>

        <button
          onClick={() => setExpanded(p => !p)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
          }}
        >
          {expanded ? (
            <ChevronUp size={14} color="#9ca3af" />
          ) : (
            <ChevronDown size={14} color="#9ca3af" />
          )}
        </button>
      </div>

      {/* Activities */}

      {expanded && (
        <div
          style={{
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {activityVals.map((activity, actIdx) => (
            <div
              key={actIdx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '8px',
                backgroundColor:
                  editingIdx === actIdx
                    ? '#f0fdfa'
                    : '#f9fafb',
                border: `1px solid ${
                  editingIdx === actIdx
                    ? '#99f6e4'
                    : '#f3f4f6'
                }`,
              }}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '6px',
                  flexShrink: 0,
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {timeIcons[actIdx % 3]}
              </div>

              {editingIdx === actIdx ? (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'center',
                  }}
                >
                  <input
                    autoFocus
                    value={activityVals[actIdx]}
                    onChange={e => {
                      const copy = [...activityVals]
                      copy[actIdx] = e.target.value
                      setActivityVals(copy)
                    }}
                    onKeyDown={e =>
                      e.key === 'Enter' &&
                      saveActivity(actIdx)
                    }
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #0f766e',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />

                  <button
                    onClick={() => saveActivity(actIdx)}
                    style={{
                      border: 'none',
                      cursor: 'pointer',
                      padding: '3px',
                      borderRadius: '5px',
                      display: 'flex',
                      backgroundColor: '#f0fdfa',
                    }}
                  >
                    <Check
                      size={13}
                      color="#0f766e"
                    />
                  </button>
                </div>
              ) : (
                <p
                  style={{
                    margin: 0,
                    flex: 1,
                    fontSize: '12px',
                    color: '#374151',
                    lineHeight: '1.5',
                  }}
                >
                  {activity}
                </p>
              )}

              {editingIdx !== actIdx && (
                <div
                  style={{
                    display: 'flex',
                    gap: '4px',
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={() =>
                      setEditingIdx(actIdx)
                    }
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '3px',
                      borderRadius: '5px',
                      display: 'flex',
                    }}
                  >
                    <Edit3
                      size={12}
                      color="#9ca3af"
                    />
                  </button>

                  <button
                    onClick={() => {
                      const copy =
                        activityVals.filter(
                          (_, i) => i !== actIdx
                        )

                      setActivityVals(copy)

                      onDeleteActivity(
                        dayIndex,
                        actIdx
                      )
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '3px',
                      borderRadius: '5px',
                      display: 'flex',
                    }}
                  >
                    <Trash2
                      size={12}
                      color="#dc2626"
                    />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Add activity */}

          {addingNew ? (
            <div
              style={{
                display: 'flex',
                gap: '6px',
                alignItems: 'center',
                padding: '8px 10px',
                borderRadius: '8px',
                backgroundColor: '#f0fdfa',
                border: '1px solid #99f6e4',
              }}
            >
              <Plus
                size={13}
                color="#0f766e"
              />

              <input
                autoFocus
                value={newActivity}
                onChange={e =>
                  setNewActivity(e.target.value)
                }
                onKeyDown={e => {
                  if (e.key === 'Enter')
                    handleAddActivity()

                  if (e.key === 'Escape')
                    setAddingNew(false)
                }}
                placeholder="Type new activity and press Enter..."
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '12px',
                  background: 'transparent',
                }}
              />

              <button
                onClick={handleAddActivity}
                style={{
                  background: '#0f766e',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '3px 8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: '#fff',
                  fontWeight: '500',
                }}
              >
                Add
              </button>

              <button
                onClick={() => setAddingNew(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <X size={13} color="#9ca3af" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingNew(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 10px',
                borderRadius: '8px',
                border: '1px dashed #d1d5db',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                width: '100%',
                fontSize: '12px',
                color: '#9ca3af',
              }}
            >
              <Plus size={13} />
              Add Activity
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Variation Card ────────────────────────────────────────────────────────────

function VariationCard({
  variation,
  onSelect,
  selected,
  onDaysChange,
}) {
  const [localDays, setLocalDays] = useState(
    variation.days.map(d => ({
      ...d,
      activities: [...d.activities],
    }))
  )

  const updateTitle = (dayIdx, val) => {
    const copy = [...localDays]

    copy[dayIdx] = {
      ...copy[dayIdx],
      title: val,
    }

    setLocalDays(copy)
    onDaysChange(copy)
  }

  const updateActivity = (
    dayIdx,
    actIdx,
    val
  ) => {
    const copy = [...localDays]

    copy[dayIdx].activities[actIdx] = val

    setLocalDays(copy)
    onDaysChange(copy)
  }

  const deleteActivity = (
    dayIdx,
    actIdx
  ) => {
    const copy = [...localDays]

    copy[dayIdx].activities =
      copy[dayIdx].activities.filter(
        (_, i) => i !== actIdx
      )

    setLocalDays(copy)
    onDaysChange(copy)
  }

  const addActivity = (
    dayIdx,
    activity
  ) => {
    const copy = [...localDays]

    copy[dayIdx].activities = [
      ...copy[dayIdx].activities,
      activity,
    ]

    setLocalDays(copy)
    onDaysChange(copy)
  }

  const [expandedDays, setExpandedDays] =
    useState([0])

  const toggleDay = i => {
    setExpandedDays(p =>
      p.includes(i)
        ? p.filter(d => d !== i)
        : [...p, i]
    )
  }

  return (
    <div
      style={{
        backgroundColor: '#fff',
        border: selected
          ? `2px solid ${variation.scoreColor}`
          : '1px solid #f3f4f6',
        borderRadius: '14px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}

      <div
        style={{
          padding: '18px 20px',
          borderBottom: '1px solid #f3f4f6',
          backgroundColor: variation.scoreBg,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '10px',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                color: variation.scoreColor,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Version {variation.id}
            </span>

            <h3
              style={{
                margin: '4px 0 0',
                fontSize: '16px',
                fontWeight: '700',
                color: '#111827',
              }}
            >
              {variation.title}
            </h3>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '999px',
                backgroundColor:
                  variation.scoreColor,
                color: '#fff',
                fontSize: '13px',
                fontWeight: '700',
              }}
            >
              <Star size={12} fill="#fff" />
              {variation.score}
            </div>

            <p
              style={{
                margin: '4px 0 0',
                fontSize: '11px',
                color: variation.scoreColor,
                fontWeight: '500',
              }}
            >
              {variation.scoreLabel}
            </p>
          </div>
        </div>

        <p
          style={{
            margin: '0 0 12px',
            fontSize: '13px',
            color: '#374151',
            lineHeight: '1.5',
          }}
        >
          {variation.explanation}
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
          }}
        >
          {variation.highlights.map(
            (h, index) => (
              <span
                key={`${h}-${index}`}
                style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  backgroundColor: '#fff',
                  color: variation.scoreColor,
                  border: `1px solid ${variation.scoreColor}30`,
                  fontWeight: '500',
                }}
              >
                {h}
              </span>
            )
          )}
        </div>
      </div>

      {/* Cost row */}

      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#fafafa',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '20px',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '11px',
                color: '#9ca3af',
              }}
            >
              Total Cost
            </p>

            <p
              style={{
                margin: '2px 0 0',
                fontSize: '17px',
                fontWeight: '700',
                color: '#111827',
              }}
            >
              {variation.totalCost}
            </p>
          </div>

          <div>
            <p
              style={{
                margin: 0,
                fontSize: '11px',
                color: '#9ca3af',
              }}
            >
              Duration
            </p>

            <p
              style={{
                margin: '2px 0 0',
                fontSize: '17px',
                fontWeight: '700',
                color: '#111827',
              }}
            >
              {localDays.length} Days
            </p>
          </div>
        </div>

        {selected && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle
              size={15}
              color="#0f766e"
            />

            <span
              style={{
                fontSize: '12px',
                color: '#0f766e',
                fontWeight: '600',
              }}
            >
              Selected for editing
            </span>
          </div>
        )}
      </div>

      {/* Day-by-day */}

      <div
        style={{
          padding: '16px 20px',
          flex: 1,
          overflowY: 'auto',
          maxHeight: '480px',
        }}
      >
        <p
          style={{
            margin: '0 0 12px',
            fontSize: '12px',
            fontWeight: '600',
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {selected
            ? 'Edit Day-by-Day Plan'
            : 'Day-by-Day Plan'}

          {selected && (
            <span
              style={{
                marginLeft: '8px',
                fontSize: '11px',
                color: '#0f766e',
                fontWeight: '400',
                textTransform: 'none',
              }}
            >
              Click any activity to edit
            </span>
          )}
        </p>

        {selected ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {localDays.map((day, i) => (
              <EditableDayCard
                key={i}
                dayData={day}
                dayIndex={i}
                onUpdateTitle={updateTitle}
                onUpdateActivity={
                  updateActivity
                }
                onDeleteActivity={
                  deleteActivity
                }
                onAddActivity={addActivity}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {localDays.map((day, i) => (
              <div
                key={i}
                style={{
                  border: '1px solid #f3f4f6',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() =>
                    toggleDay(i)
                  }
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent:
                      'space-between',
                    backgroundColor: '#fafafa',
                    border: 'none',
                    cursor: 'pointer',
                    borderBottom:
                      expandedDays.includes(i)
                        ? '1px solid #f3f4f6'
                        : 'none',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        backgroundColor:
                          '#f0fdfa',
                        color: '#0f766e',
                        fontSize: '11px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent:
                          'center',
                      }}
                    >
                      {day.day}
                    </span>

                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#111827',
                      }}
                    >
                      {day.title}
                    </span>
                  </div>

                  {expandedDays.includes(i) ? (
                    <ChevronUp
                      size={13}
                      color="#9ca3af"
                    />
                  ) : (
                    <ChevronDown
                      size={13}
                      color="#9ca3af"
                    />
                  )}
                </button>

                {expandedDays.includes(i) && (
                  <div
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    {day.activities.map(
                      (act, ai) => (
                        <div
                          key={ai}
                          style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems:
                              'flex-start',
                          }}
                        >
                          <div
                            style={{
                              marginTop: '2px',
                              flexShrink: 0,
                            }}
                          >
                            {
                              timeIcons[
                                ai % 3
                              ]
                            }
                          </div>

                          <p
                            style={{
                              margin: 0,
                              fontSize: '12px',
                              color: '#374151',
                              lineHeight: '1.4',
                            }}
                          >
                            {act}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Select */}

      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid #f3f4f6',
        }}
      >
        <button
          onClick={() =>
            onSelect(variation.id)
          }
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            border: selected
              ? `1px solid ${variation.scoreColor}`
              : 'none',
            backgroundColor: selected
              ? variation.scoreBg
              : variation.scoreColor,
            color: selected
              ? variation.scoreColor
              : '#fff',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {selected ? (
            <>
              <CheckCircle size={15} />
              Editing Version {variation.id}
            </>
          ) : (
            <>
              Select & Edit Version{' '}
              {variation.id}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Approval Bar ──────────────────────────────────────────────────────────────

function ApprovalBar({ selectedId, onApprove, onDraft, onReject, loading, leadSelected }) {
  return (
    <div
      style={{
        backgroundColor: '#fff',
        border: '1px solid #f3f4f6',
        borderRadius: '14px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: '600',
            color: '#111827',
          }}
        >
          Ready to finalise Version{' '}
          {selectedId}?
        </p>

        <p
          style={{
            margin: '3px 0 0',
            fontSize: '13px',
            color: '#9ca3af',
          }}
        >
          Approve to save to the lead, save
          as draft to revisit later, or reject
          to start over.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onReject}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: '1px solid #fecaca',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            fontSize: '14px',
            fontWeight: '500',
            cursor: loading
              ? 'not-allowed'
              : 'pointer',
          }}
        >
          <XCircle size={15} />
          Reject
        </button>

        <button
          onClick={onDraft}
          disabled={loading || !leadSelected}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '10px 18px', borderRadius: '10px',
            border: '1px solid #fde68a', backgroundColor: '#fffbeb',
            color: '#d97706', fontSize: '14px', fontWeight: '500',
            opacity: loading || !leadSelected ? 0.55 : 1,
            cursor: loading || !leadSelected ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => { if (!loading && leadSelected) e.currentTarget.style.backgroundColor = '#fef3c7' }}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fffbeb'}
        >
          <Save size={15} />
          Save as Draft
        </button>

        <button
          onClick={onApprove}
          disabled={loading || !leadSelected}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '10px 22px', borderRadius: '10px',
            border: 'none', backgroundColor: loading || !leadSelected ? '#9ca3af' : '#115e59',
            color: '#fff', fontSize: '14px', fontWeight: '600',
            opacity: !leadSelected ? 0.75 : 1,
            cursor: loading || !leadSelected ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => { if (!loading && leadSelected) e.currentTarget.style.backgroundColor = '#0f766e' }}
          onMouseLeave={e => { if (!loading && leadSelected) e.currentTarget.style.backgroundColor = '#115e59' }}
        >
          {loading ? (
            <>
              <Loader
                size={14}
                style={{
                  animation:
                    'spin 0.8s linear infinite',
                }}
              />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle size={15} />
              Approve
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function Itinerary() {
  // Lead context — read from /itinerary?leadId=...
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const leadId   = params.get('leadId')
  const [lead, setLead] = useState(null)
  const [leads, setLeads] = useState([])
  const [selectedLeadId, setSelectedLeadId] = useState(leadId || '')
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [leadError, setLeadError] = useState('')

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
  const [generationError, setGenerationError] = useState(null)
  const [toast, setToast]                 = useState(null)
  const [isRegenerate, setIsRegenerate]   = useState(false)


  const exampleQuery = `Customer: Priya Sharma\nMessage: Hi, we're a honeymoon couple planning a trip to Bali in late December. Our budget is around ₹85,000 for 2 people for 7 nights. We love beaches, spa treatments, romantic dinners, and some cultural sightseeing. Would prefer private experiences where possible. Can you suggest a good itinerary?`

  // Load leads for sidebar access, where the user must select a customer.
  useEffect(() => {
    let cancelled = false
    const loadLeads = async () => {
      setLeadsLoading(true)
      setLeadError('')
      try {
        const res = await api.get('/leads')
        const data = Array.isArray(res.data) ? res.data : (res.data?.leads || res.data?.data || [])
        if (!cancelled) {
          setLeads(Array.isArray(data) ? data : [])
          if (leadId) {
            const matched = data.find(item => String(item.id) === String(leadId))
            if (matched) setLead(matched)
          }
        }
      } catch {
        if (!cancelled) setLeadError('Could not load customers. Please refresh and try again.')
      } finally {
        if (!cancelled) setLeadsLoading(false)
      }
    }
    loadLeads()
    return () => { cancelled = true }
  }, [leadId])

  // Load a lead passed through the URL and prefill its inquiry.
  useEffect(() => {
    if (!leadId) return
    setSelectedLeadId(String(leadId))
    getLeadById(leadId)
      .then(res => {
        setLead(res.data)
        setRawQuery(res.data.inquiry_text || res.data.inquiryMessage || '')
      })
      .catch(() => {
        setLeadError('Could not load the selected customer.')
      })
  }, [leadId])

  const handleLeadChange = async (value) => {
    setSelectedLeadId(value)
    setLeadError('')
    setParsed(null)
    setVariations(null)
    setSelectedId(null)
    if (!value) {
      setLead(null)
      setRawQuery('')
      return
    }
    const matchingLead = leads.find(item => String(item.id) === String(value))
    setLead(matchingLead || null)
    if (matchingLead) {
      setRawQuery(matchingLead.inquiry_text || matchingLead.inquiryMessage || matchingLead.message || '')
    }
    try {
      const res = await getLeadById(value)
      setLead(res.data)
      setRawQuery(res.data.inquiry_text || res.data.inquiryMessage || res.data.message || matchingLead?.inquiry_text || '')
    } catch {
      if (!matchingLead) setLeadError('Could not load the selected customer details.')
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })

    setTimeout(
      () => setToast(null),
      4000
    )
  }

  // ── Parse ──────────────────────────────────────────────────────────────────

  const handleParse = async () => {
    if (!rawQuery.trim()) {
      setParseError(
        'Please enter a customer inquiry first.'
      )
      return
    }

    try {
      setParsing(true)
      setParseError(null)

      const res = await api.post(
        '/ai/parse-query',
        {
          message: rawQuery,
        }
      )

      setParsed(res.data)
    } catch (error) {
      console.error(
        'Parse query failed:',
        error
      )

      setParsed(null)

      setParseError(
        'Unable to parse the customer inquiry. Please check that the backend is running.'
      )
    } finally {
      setParsing(false)
    }
  }

  // ── Generate ───────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
  try {
    setGenerating(true)
    setGenerationError(null)

    if (variations) {
      setPreviousVariations(variations)
    }

    setSelectedId(null)
    setEditedDays({})

    const res = await api.post('/trip/generate', parsed)

    const options = res.data.options || []

    setVariations(
      options.map(option => ({
        id: option.id,
        title: option.title,
        score: option.type === 'budget' ? 88 : 92,
        scoreLabel:
          option.type === 'budget'
            ? 'Budget Focused'
            : 'Experience Focused',
        scoreColor:
          option.type === 'budget'
            ? '#0369a1'
            : '#7c3aed',
        scoreBg:
          option.type === 'budget'
            ? '#eff6ff'
            : '#f5f3ff',
        explanation: option.description,
        totalCost: `₹${option.itinerary.days
          .reduce(
            (sum, day) => sum + Number(day.estimated_cost || 0),
            0
          )
          .toLocaleString('en-IN')}`,
        highlights: parsed.interests
          ? (
              Array.isArray(parsed.interests)
                ? parsed.interests
                : parsed.interests
                    .split(',')
                    .map(i => i.trim())
            )
          : [],
        days: option.itinerary.days.map(day => ({
          day: day.day,
          title:
            day.activities?.[0]?.name ||
            `Day ${day.day}`,
          activities:
            day.activities?.map(activity =>
              `${activity.name} — ${activity.location}`
            ) || [],
        })),
      }))
    )

    setIsRegenerate(false)

  } catch (error) {
    console.error('Itinerary generation failed:', error)
    setVariations([])
    setGenerationError('Unable to generate itinerary options. Please check that the backend is running and try again.')
  } finally {
    setGenerating(false)
  }
}

  // ── Approval actions ───────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!selectedLeadId) {
      showToast('Please select a customer before approving an itinerary.', 'error')
      return
    }

    const finalDays =
      editedDays[selectedId] ||
      variations?.find(v => v.id === selectedId)?.days

    if (!finalDays?.length) {
      showToast('Select a valid itinerary before approving.', 'error')
      return
    }

    try {
      setApproving(true)

      // Save the approved itinerary against the selected lead first.
      await api.post('/itinerary/save', {
        leadId: selectedLeadId,
        days: finalDays,
        status: 'approved',
      })

      // Record acceptance after the itinerary save succeeds.
      await api.post('/ai/feedback', {
        action: 'accept',
        versionId: selectedId,
      })

      navigate(`/leads/${selectedLeadId}`, { state: { saved: true } })
    } catch {
      showToast('Could not approve the itinerary. Please try again.', 'error')
    } finally {
      setApproving(false)
    }
  }

  const handleDraft = async () => {
    if (!selectedLeadId) {
      showToast('Please select a customer before saving a draft.', 'error')
      return
    }

    const finalDays =
      editedDays[selectedId] ||
      variations?.find(v => v.id === selectedId)?.days

    if (!finalDays?.length) {
      showToast('Select a valid itinerary before saving a draft.', 'error')
      return
    }

    try {
      setApproving(true)
      await api.post('/itinerary/save', {
        leadId: selectedLeadId,
        days: finalDays,
        status: 'draft',
      })

      navigate(`/leads/${selectedLeadId}`, { state: { saved: true } })
    } catch {
      showToast('Could not save the draft. Please try again.', 'error')
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async () => {
    try {
      await api.post('/ai/feedback', { action: 'reject', versionId: selectedId })
    } catch {}
    showToast('Itinerary rejected. You can regenerate with changes.', 'reject')
    setSelectedId(null)
  }

  const handleFieldChange = (
    field,
    value
  ) => {
    setParsed(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  // Resolve the selected customer immediately from the list, even while details are loading.
  const selectedLead = lead || leads.find(item => String(item.id) === String(selectedLeadId)) || null
  const selectedLeadName = selectedLead
    ? (selectedLead.name || selectedLead.customer_name || selectedLead.customerName || `Lead #${selectedLead.id}`)
    : null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* Header */}

      <div>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#111827' }}>
          {selectedLeadName ? `Building itinerary for ${selectedLeadName}` : 'Itinerary Builder'}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
          {selectedLead
            ? `Customer inquiry and itinerary options for Lead #${selectedLead.id}`
            : 'Select a customer, then parse their inquiry and generate personalised itinerary variations.'}
        </p>
      </div>

      {/* Customer selection is needed when opening the builder without a lead in the URL. */}
      {!leadId && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '20px 24px' }}>
          <label htmlFor="customer-select" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Select customer</label>
          <select
            id="customer-select"
            value={selectedLeadId}
            onChange={e => handleLeadChange(e.target.value)}
            disabled={leadsLoading}
            style={{ width: '100%', maxWidth: '520px', padding: '11px 12px', border: '1px solid #d1d5db', borderRadius: '9px', backgroundColor: '#fff', color: '#111827', fontSize: '14px' }}
          >
            <option value="">{leadsLoading ? 'Loading customers...' : 'Choose a customer'}</option>
            {leads.map(item => (
              <option key={item.id} value={String(item.id)}>
                {item.name || item.customer_name || item.customerName || `Lead #${item.id}`} (Lead #{item.id})
              </option>
            ))}
          </select>
          {leadError && <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#dc2626' }}>{leadError}</p>}
          {!leadsLoading && !leadError && leads.length === 0 && (
            <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#6b7280' }}>No customers found. Add a lead before saving an itinerary.</p>
          )}
        </div>
      )}

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
          onChange={e => {
            setRawQuery(e.target.value)
            setParseError(null)
          }}
          placeholder="Paste the customer's WhatsApp message, email, or inquiry here..."
          rows={6}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: '10px',
            border:
              '1px solid #e5e7eb',
            fontSize: '14px',
            color: '#111827',
            resize: 'vertical',
            outline: 'none',
            lineHeight: '1.6',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            minHeight: '140px',
          }}
        />

        {parseError && (
          <p
            style={{
              margin: '8px 0 0',
              fontSize: '13px',
              color: '#dc2626',
            }}
          >
            {parseError}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            marginTop: '14px',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              color: '#9ca3af',
            }}
          >
            {rawQuery.length} characters ·
            AI will extract destination,
            budget, preferences and more
          </p>

          <button
            onClick={handleParse}
            disabled={parsing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor:
                parsing
                  ? '#9ca3af'
                  : '#115e59',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: parsing
                ? 'not-allowed'
                : 'pointer',
            }}
          >
            {parsing ? (
              <>
                <Loader
                  size={15}
                  style={{
                    animation:
                      'spin 0.8s linear infinite',
                  }}
                />
                Parsing...
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Parse Query
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step 2 */}

      {parsed && (
        <div
          style={{
            backgroundColor: '#fff',
            border:
              '1px solid #f3f4f6',
            borderRadius: '14px',
            padding: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '6px',
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                backgroundColor:
                  '#f0fdfa',
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'center',
                fontSize: '12px',
                fontWeight: '700',
                color: '#0f766e',
              }}
            >
              2
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: '600',
                color: '#111827',
              }}
            >
              {isRegenerate
                ? 'Modify Fields & Regenerate'
                : 'Extracted Fields'}
            </h2>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginLeft: 'auto',
              }}
            >
              <CheckCircle
                size={14}
                color="#0f766e"
              />

              <span
                style={{
                  fontSize: '12px',
                  color: '#0f766e',
                  fontWeight: '500',
                }}
              >
                AI parsed successfully —
                review and edit if needed
              </span>
            </div>
          </div>

          <p
            style={{
              margin:
                '0 0 20px 36px',
              fontSize: '13px',
              color: '#9ca3af',
            }}
          >
            Review the extracted
            details. Correct any field
            before generating.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                '1fr 1fr',
              gap: '14px',
            }}
          >
            {fieldConfig.map(
              ({
                key,
                label,
                icon: Icon,
                type,
                placeholder,
              }) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    flexDirection:
                      'column',
                    gap: '6px',
                  }}
                >
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems:
                        'center',
                      gap: '5px',
                    }}
                  >
                    <Icon
                      size={12}
                      color="#9ca3af"
                    />
                    {label}
                  </label>

                  <div
                    style={{
                      position:
                        'relative',
                    }}
                  >
                    <input
                      type={type}
                      value={
                        parsed[key] ??
                        ''
                      }
                      placeholder={
                        placeholder
                      }
                      onChange={e =>
                        handleFieldChange(
                          key,
                          e.target.value
                        )
                      }
                      style={{
                        width: '100%',
                        padding:
                          '10px 34px 10px 36px',
                        borderRadius:
                          '10px',
                        border:
                          '1px solid #e5e7eb',
                        fontSize: '13px',
                        color:
                          '#111827',
                        outline:
                          'none',
                        boxSizing:
                          'border-box',
                        backgroundColor:
                          '#fafafa',
                      }}
                    />

                    <div
                      style={{
                        position:
                          'absolute',
                        left: '12px',
                        top: '50%',
                        transform:
                          'translateY(-50%)',
                      }}
                    >
                      <Icon
                        size={13}
                        color="#9ca3af"
                      />
                    </div>

                    <div
                      style={{
                        position:
                          'absolute',
                        right: '10px',
                        top: '50%',
                        transform:
                          'translateY(-50%)',
                      }}
                    >
                      <Edit3
                        size={11}
                        color="#d1d5db"
                      />
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Errors */}

          {generationError && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor:
                  '#fef2f2',
                border:
                  '1px solid #fecaca',
                color: '#dc2626',
                fontSize: '13px',
              }}
            >
              {generationError}
            </div>
          )}

          {/* Buttons */}

          <div
            style={{
              marginTop: '20px',
              display: 'flex',
              justifyContent:
                'flex-end',
              gap: '10px',
            }}
          >
            {variations && (
              <button
                onClick={() => {
                  setIsRegenerate(true)
                  handleGenerate()
                }}
                disabled={generating}
                style={{
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: '8px',
                  padding:
                    '11px 22px',
                  borderRadius:
                    '10px',
                  border:
                    '1px solid #e5e7eb',
                  backgroundColor:
                    '#fff',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor:
                    generating
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                <RefreshCw size={14} />
                Regenerate with
                Changes
              </button>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                display: 'flex',
                alignItems:
                  'center',
                gap: '8px',
                padding:
                  '11px 28px',
                borderRadius:
                  '10px',
                border: 'none',
                backgroundColor:
                  generating
                    ? '#9ca3af'
                    : '#7c3aed',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                cursor:
                  generating
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {generating ? (
                <>
                  <Loader
                    size={15}
                    style={{
                      animation:
                        'spin 0.8s linear infinite',
                    }}
                  />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 size={15} />
                  Generate
                  Itinerary
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Previous */}

      {previousVariations &&
        variations && (
          <div
            style={{
              padding:
                '12px 16px',
              borderRadius: '10px',
              backgroundColor:
                '#f9fafb',
              border:
                '1px solid #f3f4f6',
              display: 'flex',
              alignItems:
                'center',
              gap: '8px',
            }}
          >
            <RotateCcw
              size={14}
              color="#9ca3af"
            />

            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: '#6b7280',
              }}
            >
              Previous version
              replaced. Showing the
              newly generated
              itinerary below.
            </p>
          </div>
        )}

      {/* Step 3 */}

      {variations && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems:
                'center',
              gap: '10px',
              marginBottom:
                '16px',
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                backgroundColor:
                  '#f5f3ff',
                display: 'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                fontSize: '12px',
                fontWeight: '700',
                color: '#7c3aed',
              }}
            >
              3
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: '600',
                color: '#111827',
              }}
            >
              Generated
              Itinerary
            </h2>

            <span
              style={{
                fontSize: '11px',
                backgroundColor:
                  '#f5f3ff',
                color: '#7c3aed',
                padding:
                  '2px 10px',
                borderRadius:
                  '999px',
                fontWeight: '500',
              }}
            >
              {variations.length}{' '}
              {variations.length ===
              1
                ? 'version'
                : 'versions'}
            </span>

            {!selectedId && (
              <p
                style={{
                  margin: 0,
                  marginLeft:
                    'auto',
                  fontSize:
                    '13px',
                  color:
                    '#9ca3af',
                }}
              >
                Select a version
                to enable
                editing
              </p>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                variations.length ===
                1
                  ? 'minmax(0, 1fr)'
                  : '1fr 1fr',
              gap: '16px',
            }}
          >
            {variations.map(
              variation => (
                <VariationCard
                  key={
                    variation.id
                  }
                  variation={
                    variation
                  }
                  selected={
                    selectedId ===
                    variation.id
                  }
                  onSelect={id =>
                    setSelectedId(
                      selectedId ===
                        id
                        ? null
                        : id
                    )
                  }
                  onDaysChange={
                    days =>
                      setEditedDays(
                        prev => ({
                          ...prev,
                          [variation.id]:
                            days,
                        })
                      )
                  }
                />
              )
            )}
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
          leadSelected={Boolean(selectedLeadId)}
        />
      )}

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

export default Itinerary
