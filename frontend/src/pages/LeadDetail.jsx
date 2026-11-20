import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft, User, Phone, Mail, MapPin, DollarSign,
  Calendar, Users, CheckCircle, FileText,
  Map, ThumbsUp, Sparkles, ChevronRight, X, Download
} from 'lucide-react'
import { getLeadById, getItinerariesByLead } from '../services/api'
import api from '../services/api'

// ── Mock fallback ─────────────────────────────────────────────────────────────

const mockLead = {
  id: 1,
  name: 'Priya Sharma',
  phone: '+91 98765 43210',
  email: 'priya.sharma@email.com',
  destination: 'Bali, Indonesia',
  budget: '₹85,000',
  travelDate: '2024-12-20',
  groupSize: 2,
  score: 'Hot',
  status: 'Quoted',
  lastContact: '2 hours ago',
  inquiryMessage: 'Looking for a romantic honeymoon package in Bali. Prefer beachside resort, candlelight dinner, and spa. Flexible on dates but prefer late December.',
  scoreExplanation: 'High budget, quick responses, and clear intent make this a high-priority lead. Customer has been actively engaging and is ready to book.',
  statusHistory: [
    { status: 'New',       date: 'Dec 1, 2024',  note: 'Lead created via WhatsApp inquiry'         },
    { status: 'Contacted', date: 'Dec 2, 2024',  note: 'Initial call made, discussed requirements' },
    { status: 'Quoted',    date: 'Dec 4, 2024',  note: 'Sent Bali honeymoon package quotation'     },
  ],
  itinerary: {
    id: 'ITN-001',
    title: 'Bali Honeymoon — 6 Nights 7 Days',
    status: 'Pending Approval',
    days: 7,
    createdAt: 'Dec 4, 2024',
  },
  quotation: {
    id: 'QT-2024-001',
    amount: '₹82,500',
    status: 'Sent',
    validUntil: 'Dec 15, 2024',
    items: ['6N Beachside Resort', 'Airport Transfers', 'Candlelight Dinner', 'Spa Session', 'Sightseeing Tours'],
  },
  followUps: [
    { date: 'Dec 6, 2024',  type: 'Call',  status: 'Done',    note: 'Confirmed interest, asked for minor changes' },
    { date: 'Dec 8, 2024',  type: 'Email', status: 'Done',    note: 'Sent revised itinerary with spa upgrade'     },
    { date: 'Dec 10, 2024', type: 'Call',  status: 'Pending', note: 'Final confirmation call'                     },
    { date: 'Dec 12, 2024', type: 'Email', status: 'Pending', note: 'Send booking confirmation'                   },
  ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const scoreMeta = {
  Hot:  { bg: '#F3E5E5', color: '#8A3541', dot: '#9B4650' },
  Warm: { bg: '#F6EBD5', color: '#A8793E', dot: '#C6A46A' },
  Cold: { bg: '#F1E8DC', color: '#641F32', dot: '#A8793E' },
}

const statusColors = {
  New:         { bg: '#EDE3D5', color: '#725D52' },
  Contacted:   { bg: '#F1E8DC', color: '#641F32' },
  Quoted:      { bg: '#F6EBD5', color: '#A8793E' },
  Negotiating: { bg: '#F0E7DD', color: '#8B6242' },
  Confirmed:   { bg: '#F1EADF', color: '#641F32' },
  Closed:      { bg: '#F3E5E5', color: '#8A3541' },
}

const Card = ({ children, style = {} }) => (
  <div style={{
    backgroundColor: '#FFFCF7', border: '1px solid #EDE3D5',
    borderRadius: '14px', padding: '20px', ...style,
  }}>
    {children}
  </div>
)

const SectionTitle = ({ icon: Icon, title, color = '#641F32' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
    <Icon size={16} color={color} />
    <h2 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#35231F' }}>{title}</h2>
  </div>
)

// ── Quotation Generator ───────────────────────────────────────────────────────

const mockQuotation = {
  itineraryId: 'ITN-001',
  destination: 'Bali, Indonesia',
  duration: 7,
  groupSize: 2,
  currency: '₹',
  items: [
    { category: 'Accommodation', description: '6N Beachside Resort (Seminyak)',    unitCost: 12000, units: 6, total: 72000 },
    { category: 'Transport',     description: 'Airport transfers + private car',    unitCost: 8000,  units: 1, total: 8000  },
    { category: 'Activities',    description: 'Spa, Nusa Penida tour, Kecak show', unitCost: 6500,  units: 1, total: 6500  },
    { category: 'Meals',         description: 'Daily breakfast + 3 special dinners',unitCost: 2200, units: 7, total: 15400 },
    { category: 'Visa & Misc',   description: 'Travel insurance + misc expenses',  unitCost: 3500,  units: 1, total: 3500  },
  ],
  subtotal:     105400,
  marginPct:    15,
  marginAmount: 15810,
  finalPrice:   121210,
  anomalies: [
    { type: 'warning', field: 'Transport',     message: 'Transport cost (₹8,000) is 2× higher than average for this destination. Please review before sending.' },
    { type: 'info',    field: 'Accommodation', message: 'Accommodation rate is within the expected range for Seminyak in December.' },
  ],
}

const categoryMeta = {
  'Accommodation': { color: '#641F32', bg: '#F1EADF' },
  'Transport':     { color: '#641F32', bg: '#F1E8DC' },
  'Activities':    { color: '#8B6242', bg: '#F0E7DD' },
  'Meals':         { color: '#A8793E', bg: '#F6EBD5' },
  'Visa & Misc':   { color: '#725D52', bg: '#F5EEE3' },
}

const selectStyle = {
  display: 'block', width: '100%', marginTop: '6px', padding: '9px 10px',
  border: '1px solid #D8C7B2', borderRadius: '8px', backgroundColor: '#FFFCF7',
  color: '#35231F', fontSize: '13px', boxSizing: 'border-box',
}

function QuotationGenerator({ leadId, itineraryId, groupSize = 1 }) {
  const [quote, setQuote]         = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [margin, setMargin]       = useState(15)
  const [dismissed, setDismissed] = useState([])
  const [sent, setSent]           = useState(false)
  const [sending, setSending]     = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [accommodationType, setAccommodationType] = useState('standard')
  const [transportType, setTransportType] = useState('private_sedan')
  const [airportTransferType, setAirportTransferType] = useState('airport_transfer_sedan')
  const [airportTransfers, setAirportTransfers] = useState(2)
  const [vehicleCount, setVehicleCount] = useState(1)

  const recalc = (items, pct) => {
    const sub  = items.reduce((sum, i) => sum + i.total, 0)
    const mAmt = Math.round(sub * pct / 100)
    return { subtotal: sub, marginAmount: mAmt, finalPrice: sub + mAmt }
  }

  
  const handleGenerate = async () => {
    try {
      setLoading(true)
      setError(null)
      setQuote(null)
      setSent(false)
      setDismissed([])

      const numericLeadId = Number(leadId)
      const numericItineraryId = Number(itineraryId)

      if (!Number.isInteger(numericLeadId) || numericLeadId <= 0) {
        throw new Error('A valid lead ID is required.')
      }

      if (!Number.isInteger(numericItineraryId) || numericItineraryId <= 0) {
        throw new Error('No saved itinerary is linked to this lead. Save an itinerary first.')
      }

      // Load the saved itinerary so the quote is based on its actual days and costs.
      const itineraryRes = await api.get(`/itinerary/${numericItineraryId}`)
      const saved = itineraryRes.data?.itinerary || itineraryRes.data?.data || itineraryRes.data

      if (!saved || !Array.isArray(saved.days) || saved.days.length === 0) {
        throw new Error('The saved itinerary has no days to quote.')
      }

      // The backend quotation router is mounted at POST /api/quotations.
      const res = await api.post('/quotations', {
        lead_id: numericLeadId,
        itineraryId: numericItineraryId,
        itinerary: {
          destination: (
              saved.destination ||
              saved.destination_name ||
              saved.lead?.destination ||
              ''
          ).trim().replace(/^kerela$/i, 'Kerala'),
          duration_days: saved.days.length,
          nights: Math.max(saved.days.length - 1, 0),
          days: saved.days,
          accommodation_type: accommodationType,
          transport_type: transportType,
          airport_transfer_type: airportTransferType,
          airport_transfers: Number(airportTransfers),
          vehicle_count: Number(vehicleCount),
        },
        margin: Number(margin),
        group_size: Number(groupSize) > 0
          ? Number(groupSize)
          : Number(saved.lead?.group_size || saved.lead?.groupSize || 1),
        currency: 'INR',
      })

      const pricing = res.data?.pricing
      const breakdown = pricing?.breakdown

      if (!pricing || !breakdown) {
        throw new Error('The server response did not include quotation pricing details.')
      }

      // Build itemised rows from the dataset-backed pricing_details returned by quotationService.
      // Do not silently replace missing prices with zero: a missing detail is an integration error.
      const details = pricing.pricing_details || pricing.pricingDetails
      if (!details) {
        throw new Error('The server returned category totals but no itemised pricing_details. Check quotationController response mapping.')
      }

      const items = []
      const activityRows = Array.isArray(details.activities) ? details.activities : []
      activityRows.forEach((activity) => {
        items.push({
          category: 'Activities',
          description: `Day ${activity.day}: ${activity.name}`,
          unitCost: Number(activity.unit_price ?? activity.unit_cost ?? 0),
          units: Number(activity.quantity ?? 1),
          total: Number(activity.total ?? 0),
        })
      })

      const accommodation = details.accommodation
      if (accommodation) {
        items.push({
          category: 'Accommodation',
          description: `${accommodation.label || accommodation.type} — ${accommodation.rooms} room(s) × ${accommodation.nights} night(s)`,
          unitCost: Number(accommodation.unit_price ?? accommodation.rate ?? 0),
          units: Number(accommodation.rooms ?? 1) * Number(accommodation.nights ?? 0),
          total: Number(accommodation.total ?? 0),
        })
      }

      const transport = details.transport
      if (transport) {
        const transportUnits = Number(transport.quantity ?? 1) * Number(transport.days ?? 1)
        items.push({
          category: 'Transport',
          description: `${transport.label || transport.type} — ${transport.quantity ?? 1} × ${transport.days ?? 1} day(s)`,
          unitCost: Number(transport.unit_price ?? transport.rate ?? 0),
          units: transportUnits,
          total: Number(transport.total ?? 0),
        })
      }

      const transfers = details.airport_transfers
      if (transfers && Number(transfers.total) > 0) {
        items.push({
          category: 'Transport',
          description: `Airport transfer: ${transfers.label || transfers.type} — ${transfers.quantity} transfer(s)`,
          unitCost: Number(transfers.unit_price ?? 0),
          units: Number(transfers.quantity ?? 0),
          total: Number(transfers.total ?? 0),
        })
      }

      if (items.length === 0) {
        throw new Error('The quotation contains no priced activities, accommodation, transport or transfers. Check the itinerary and destination dataset.')
      }

      const anomalyCheck = res.data?.anomaly_check
      const anomalies = (anomalyCheck?.is_anomaly || anomalyCheck?.detected)
        ? (anomalyCheck.anomalies || []).map((item) => ({
            type: 'warning',
            field: item.component === 'total' ? 'Total itinerary cost' : item.component,
            message: anomalyCheck.message,
          }))
        : (anomalyCheck?.message
            ? [{ type: 'info', field: 'Pricing', message: anomalyCheck.message }]
            : [])

      const subtotal = Number(breakdown.base_total ?? items.reduce((sum, item) => sum + item.total, 0))
      const marginAmount = Number(breakdown.margin_amount ?? pricing.margin_applied ?? 0)
      const appliedMargin = Number(pricing.margin_applied ?? margin)
      const finalPrice = Number(pricing.group_total ?? subtotal + marginAmount)
      const destination = saved.destination || saved.destination_name || saved.lead?.destination || 'Destination not set'

      setQuote({
        id: res.data?.quotation?.id ?? res.data?.quotation?.quotation_id ?? res.data?.id ?? res.data?.quotationId,
        itineraryId: numericItineraryId,
        destination,
        duration: saved.days.length,
        groupSize: Number(groupSize) > 0 ? Number(groupSize) : Number(saved.lead?.group_size || saved.lead?.groupSize || 1),
        pricingDetails: details,
        currency: '₹',
        items,
        subtotal,
        marginPct: appliedMargin,
        marginAmount,
        finalPrice,
        anomalies,
      })
      setMargin(appliedMargin)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to generate quotation.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleMarginChange = (val) => {
    const pct = Math.max(0, Math.min(50, Number(val)))
    setMargin(pct)
    if (!quote) return
    const updated = recalc(quote.items, pct)
    setQuote(prev => ({ ...prev, marginPct: pct, ...updated }))
  }


  const handleSend = async () => {
    try {
      setSending(true)
      await api.post('/quotation/send', { leadId, quote })
      setSent(true)
    } catch { setSent(true) }
    finally { setSending(false) }
  }

  // Download the saved quotation as a PDF from the backend.
  const handleDownloadPDF = async () => {
    const quotationId = Number(quote?.id)

    if (!Number.isInteger(quotationId) || quotationId <= 0) {
      setError('The quotation was generated, but the server did not return its saved quotation ID. Please regenerate the quotation and try again.')
      return
    }

    try {
      setDownloadingPdf(true)
      setError(null)

      const response = await api.post(
        '/pdf/quotation',
        { quotation_id: quotationId },
        { responseType: 'arraybuffer' }
      )

      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `quotation-${quotationId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch (err) {
      setError(
        err.response?.status === 404
          ? 'Quotation PDF endpoint was not found. Check that POST /api/pdf/quotation is registered in the backend.'
          : 'Could not download the quotation PDF. Check the backend terminal and try again.'
      )
      console.error('Quotation PDF download failed:', err)
    } finally {
      setDownloadingPdf(false)
    }
  }

  const warnings = (quote?.anomalies || []).filter(a => !dismissed.includes(a.field) && a.type === 'warning')
  const infos    = (quote?.anomalies || []).filter(a => !dismissed.includes(a.field) && a.type === 'info')
  const fmt      = (n) => `₹${Number(n).toLocaleString('en-IN')}`

  return (
    <div style={{
      backgroundColor: '#FFFCF7', border: '1px solid #EDE3D5',
      borderRadius: '14px', overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        padding: '18px 24px', borderBottom: '1px solid #EDE3D5',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={17} color="#641F32" />
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#35231F' }}>
            Quotation Generator
          </h2>
          {quote && (
            <span style={{
              fontSize: '11px', padding: '2px 10px', borderRadius: '999px',
              backgroundColor: '#F1E8DC', color: '#641F32', fontWeight: '500',
            }}>
              {quote.destination}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {quote && (
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 14px', borderRadius: '10px', border: 'none',
                backgroundColor: downloadingPdf ? '#A18D7D' : '#4B2630',
                color: '#FFFCF7', fontSize: '13px', fontWeight: '600',
                cursor: downloadingPdf ? 'not-allowed' : 'pointer',
                opacity: downloadingPdf ? 0.8 : 1,
              }}
            >
              <Download size={14} />
              {downloadingPdf ? 'Preparing PDF...' : 'Download Quotation PDF'}
            </button>
          )}

          {quote && !sent && (
            <button
              onClick={handleSend} disabled={sending}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '10px', border: 'none',
                backgroundColor: sending ? '#A18D7D' : '#641F32',
                color: '#FFFCF7', fontSize: '13px', fontWeight: '600',
                cursor: sending ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!sending) e.currentTarget.style.backgroundColor = '#4B2630' }}
              onMouseLeave={e => { if (!sending) e.currentTarget.style.backgroundColor = '#641F32' }}
            >
              {sending
                ? <><div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid rgba(255,252,247,0.35)', borderTopColor: '#FFFCF7', animation: 'spin 0.6s linear infinite' }} /> Sending...</>
                : <>📤 Send to Customer</>
              }
            </button>
          )}

          {sent && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '10px',
              backgroundColor: '#F1EADF', border: '1px solid #D8C6A7',
            }}>
              <CheckCircle size={14} color="#641F32" />
              <span style={{ fontSize: '13px', color: '#641F32', fontWeight: '500' }}>Quote sent!</span>
            </div>
          )}

          <button
            onClick={handleGenerate} disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 18px', borderRadius: '10px', border: 'none',
              backgroundColor: loading ? '#A18D7D' : '#641F32',
              color: '#FFFCF7', fontSize: '13px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#641F32' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#641F32' }}
          >
            {loading
              ? <><div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid rgba(255,252,247,0.35)', borderTopColor: '#FFFCF7', animation: 'spin 0.6s linear infinite' }} /> Generating...</>
              : <>{quote ? '🔄 Regenerate' : '✨ Generate Quotation'}</>
            }
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ margin: '16px 24px 0', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#F3E5E5', border: '1px solid #D9B9B7' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#8A3541' }}>{error}</p>
        </div>
      )}
          {/* Quotation preferences: these selections are sent to the pricing service. */}
          <div style={{ padding: '16px', border: '1px solid #E6D9C8', borderRadius: '12px', backgroundColor: '#F7F0E6' }}>
            <p style={{ margin: '0 0 5px', fontSize: '13px', fontWeight: '600', color: '#35231F' }}>Quotation Preferences</p>
            <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#725D52' }}>Choose the dataset rates used to calculate this quotation.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
              <label style={{ fontSize: '12px', color: '#5B463D' }}>Accommodation
                <select value={accommodationType} onChange={e => setAccommodationType(e.target.value)} style={selectStyle}>
                  <option value="budget">Budget</option><option value="standard">Standard</option><option value="premium">Premium</option><option value="luxury">Luxury</option>
                </select>
              </label>
              <label style={{ fontSize: '12px', color: '#5B463D' }}>Daily transport
                <select value={transportType} onChange={e => setTransportType(e.target.value)} style={selectStyle}>
                  <option value="public_transport">Public transport</option><option value="shared_transfer">Shared transfer</option><option value="private_sedan">Private sedan</option><option value="private_suv">Private SUV</option><option value="tempo_traveller">Tempo traveller</option>
                </select>
              </label>
              <label style={{ fontSize: '12px', color: '#5B463D' }}>Airport transfer
                <select value={airportTransferType} onChange={e => setAirportTransferType(e.target.value)} style={selectStyle}>
                  <option value="airport_transfer_sedan">Sedan</option><option value="airport_transfer_suv">SUV</option>
                </select>
              </label>
              <label style={{ fontSize: '12px', color: '#5B463D' }}>Airport transfers
                <input type="number" min="0" value={airportTransfers} onChange={e => setAirportTransfers(Math.max(0, Number(e.target.value)))} style={selectStyle} />
              </label>
              <label style={{ fontSize: '12px', color: '#5B463D' }}>Number of vehicles
                <input type="number" min="1" value={vehicleCount} onChange={e => setVehicleCount(Math.max(1, Number(e.target.value)))} style={selectStyle} />
              </label>
            </div>
          </div>


      {/* Loading */}
      {loading && (
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            border: '3px solid #E6D9C8', borderTopColor: '#641F32',
            animation: 'spin 0.7s linear infinite', margin: '0 auto 12px',
          }} />
          <p style={{ margin: 0, fontSize: '14px', color: '#A18D7D' }}>Generating itemised quotation...</p>
        </div>
      )}

      {/* Empty state */}
      {!quote && !loading && (
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            backgroundColor: '#F1E8DC', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 14px',
          }}>
            <FileText size={24} color="#641F32" />
          </div>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: '500', color: '#4A342D' }}>
            No quotation generated yet
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#A18D7D' }}>
            Click "Generate Quotation" to create an itemised quote from the approved itinerary.
          </p>
        </div>
      )}

      {/* Quote content */}
      {quote && !loading && (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Warning anomalies */}
          {warnings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {warnings.map(a => (
                <div key={a.field} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '12px 14px', borderRadius: '10px',
                  backgroundColor: '#F6EBD5', border: '1px solid #D8BD8B',
                }}>
                  <span style={{ fontSize: '16px', flexShrink: 0, lineHeight: 1.4 }}>⚠️</span>
                  <p style={{ margin: 0, fontSize: '13px', color: '#76512F', lineHeight: '1.5', flex: 1 }}>
                    <strong>{a.field}:</strong> {a.message}
                  </p>
                  <button onClick={() => setDismissed(p => [...p, a.field])} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', flexShrink: 0,
                  }}>
                    <X size={14} color="#A18D7D" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Info anomalies */}
          {infos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {infos.map(a => (
                <div key={a.field} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '10px 14px', borderRadius: '10px',
                  backgroundColor: '#F1EADF', border: '1px solid #D8C6A7',
                }}>
                  <span style={{ fontSize: '14px', flexShrink: 0, lineHeight: 1.5 }}>✅</span>
                  <p style={{ margin: 0, fontSize: '13px', color: '#641F32', lineHeight: '1.5', flex: 1 }}>
                    <strong>{a.field}:</strong> {a.message}
                  </p>
                  <button onClick={() => setDismissed(p => [...p, a.field])} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', marginLeft: 'auto', flexShrink: 0,
                  }}>
                    <X size={13} color="#A18D7D" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Trip meta */}
          <div style={{
            display: 'flex', gap: '24px', padding: '14px 16px',
            backgroundColor: '#F5EEE3', borderRadius: '10px',
            border: '1px solid #EDE3D5', flexWrap: 'wrap',
          }}>
            {[
              { label: 'Destination', value: quote.destination },
              { label: 'Duration', value: `${quote.duration} days` },
              { label: 'Group Size', value: `${quote.groupSize} pax` },
              { label: 'Itinerary', value: quote.itineraryId },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ margin: 0, fontSize: '11px', color: '#A18D7D', fontWeight: '500' }}>{label}</p>
                <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: '600', color: '#35231F' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Itemised table */}
          <div>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#4A342D' }}>
              Itemised Breakdown
            </p>
            <div style={{ border: '1px solid #EDE3D5', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F7F0E6', borderBottom: '1px solid #EDE3D5' }}>
                    {['Category', 'Description', 'Unit Cost', 'Units', 'Total'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px',
                        textAlign: h === 'Category' || h === 'Description' ? 'left' : 'right',
                        fontSize: '11px', fontWeight: '600', color: '#725D52',
                        textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item, idx) => {
                    const meta = categoryMeta[item.category] || categoryMeta['Visa & Misc']
                    return (
                      <tr key={idx}
                        style={{ borderBottom: idx < quote.items.length - 1 ? '1px solid #F5EEE3' : 'none' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F0E6'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: '600', padding: '3px 10px',
                            borderRadius: '999px', backgroundColor: meta.bg, color: meta.color,
                          }}>
                            {item.category}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: '#4A342D' }}>
                          {item.description}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13px', color: '#4A342D', whiteSpace: 'nowrap' }}>
                          {fmt(item.unitCost)}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13px', color: '#4A342D' }}>
                          {Number(item.units).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#35231F', whiteSpace: 'nowrap' }}>
                          {fmt(item.total)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Margin + Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* Margin slider */}
            <div style={{ padding: '18px', borderRadius: '12px', border: '1px solid #EDE3D5', backgroundColor: '#F7F0E6' }}>
              <p style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: '600', color: '#4A342D' }}>Margin Adjustment</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <input
                  type="range" min="0" max="50" step="1" value={margin}
                  onChange={e => handleMarginChange(e.target.value)}
                  style={{ flex: 1, accentColor: '#641F32' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number" min="0" max="50" value={margin}
                    onChange={e => handleMarginChange(e.target.value)}
                    style={{
                      width: '52px', padding: '5px 8px', borderRadius: '8px',
                      border: '1px solid #E6D9C8', fontSize: '14px',
                      fontWeight: '600', color: '#35231F', textAlign: 'center', outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = '#641F32'}
                    onBlur={e => e.target.style.borderColor = '#E6D9C8'}
                  />
                  <span style={{ fontSize: '14px', color: '#725D52' }}>%</span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#A18D7D' }}>Drag or type to adjust your agency margin (0–50%)</p>
            </div>

            {/* Price summary */}
            <div style={{ padding: '18px', borderRadius: '12px', border: '1px solid #EDE3D5', backgroundColor: '#FFFCF7' }}>
              <p style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: '600', color: '#4A342D' }}>Price Summary</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#725D52' }}>Subtotal</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#4A342D' }}>{fmt(quote.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#725D52' }}>Margin ({margin}%)</span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#A8793E' }}>+ {fmt(quote.marginAmount)}</span>
                </div>
                <div style={{ borderTop: '1px solid #EDE3D5', paddingTop: '10px', marginTop: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#35231F' }}>Final Price</span>
                    <span style={{ fontSize: '22px', fontWeight: '700', color: '#641F32' }}>{fmt(quote.finalPrice)}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#A18D7D', textAlign: 'right' }}>
                    Per group · {quote.groupSize} pax · {quote.duration} days
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// ── Main LeadDetail Page ──────────────────────────────────────────────────────

function LeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [approved, setApproved] = useState(false)

  useEffect(() => {
    let cancelled = false

    const fetch = async () => {
      try {
        const res = await getLeadById(id)
        let leadData = res.data

        // Fetch itineraries separately so the newest saved itinerary is shown
        // even if the lead endpoint does not include the relation.
        try {
          const itineraryRes = await getItinerariesByLead(id)
          const itineraries = Array.isArray(itineraryRes.data)
            ? itineraryRes.data
            : (itineraryRes.data?.itineraries || itineraryRes.data?.data || [])
          const latest = Array.isArray(itineraries) ? itineraries[0] : null

          leadData = {
            ...leadData,
            itinerary: latest
              ? {
                  ...latest,
                  days: Array.isArray(latest.days) ? latest.days.length : (latest.days || 0),
                  createdAt: latest.createdAt
                    ? new Date(latest.createdAt).toLocaleDateString()
                    : '',
                  status: latest.status || 'approved',
                }
              : null,
          }
        } catch (itineraryError) {
          console.error('Could not load linked itineraries:', itineraryError)
        }

        if (!cancelled) setLead(leadData)
      } catch (error) {
        if (!cancelled) setLead(mockLead)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    setLoading(true)
    fetch()

    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        border: '3px solid #E6D9C8', borderTopColor: '#641F32',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!lead) return (
    <div style={{ textAlign: 'center', padding: '60px' }}>
      <p style={{ color: '#725D52' }}>Lead not found.</p>
    </div>
  )

  const score = scoreMeta[lead.score] || scoreMeta.Cold
  const statusColor = statusColors[lead.status] || statusColors.New

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {location.state?.saved && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '13px 16px',
            borderRadius: '10px',
            border: '1px solid #D8C6A7',
            backgroundColor: '#F1EADF',
            color: '#641F32',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          <CheckCircle size={18} />
          Itinerary saved successfully for this lead.
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/leads')} style={{
            width: '34px', height: '34px', borderRadius: '10px',
            border: '1px solid #E6D9C8', backgroundColor: '#FFFCF7',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <ArrowLeft size={16} color="#725D52" />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#35231F' }}>
              {lead.name}
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#A18D7D' }}>
              Lead #{lead.id} · Last contact {lead.lastContact}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '5px 12px', borderRadius: '999px',
            backgroundColor: score.bg, color: score.color, fontSize: '13px', fontWeight: '600',
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: score.dot }} />
            {lead.score} Lead
          </span>
          <span style={{
            padding: '5px 12px', borderRadius: '999px',
            backgroundColor: statusColor.bg, color: statusColor.color,
            fontSize: '13px', fontWeight: '500',
          }}>
            {lead.status}
          </span>
          <button
            onClick={() => navigate(`/itinerary?leadId=${lead.id}`)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '10px', border: 'none',
              backgroundColor: '#641F32', color: '#FFFCF7',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#641F32'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#641F32'}
          >
            <Map size={14} /> Build Itinerary
          </button>
        </div>
      </div>

      {/* ── Row 1: Customer Info + Score Explanation ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Customer Info */}
        <Card>
          <SectionTitle icon={User} title="Customer Information" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: Phone, label: 'Phone', value: lead.phone },
              { icon: Mail, label: 'Email', value: lead.email },
              { icon: MapPin, label: 'Destination', value: lead.destination },
              { icon: DollarSign, label: 'Budget', value: lead.budget },
              { icon: Calendar, label: 'Travel Date', value: lead.travelDate },
              { icon: Users, label: 'Group Size', value: `${lead.groupSize} ${lead.groupSize === 1 ? 'person' : 'people'}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  backgroundColor: '#F1EADF', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={13} color="#641F32" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#A18D7D', fontWeight: '500' }}>{label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#35231F', fontWeight: '500' }}>{value}</p>
                </div>
              </div>
            ))}
            {lead.inquiryMessage && (
              <div style={{ marginTop: '4px', padding: '12px', borderRadius: '10px', backgroundColor: '#F5EEE3', border: '1px solid #EDE3D5' }}>
                <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#A18D7D', fontWeight: '500' }}>Inquiry Message</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#4A342D', lineHeight: '1.5' }}>{lead.inquiryMessage}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Score + Approval */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card>
            <SectionTitle icon={Sparkles} title="AI Score Explanation" color="#8B6242" />
            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: score.bg, marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '22px', fontWeight: '700', color: score.color }}>{lead.score}</span>
                <span style={{ fontSize: '13px', color: score.color, fontWeight: '500' }}>Priority</span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#4A342D', lineHeight: '1.5' }}>{lead.scoreExplanation}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Response Speed', value: 85 },
                { label: 'Budget Match', value: 92 },
                { label: 'Intent Clarity', value: 78 },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#725D52' }}>{label}</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#35231F' }}>{value}%</span>
                  </div>
                  <div style={{ height: '5px', backgroundColor: '#EDE3D5', borderRadius: '999px' }}>
                    <div style={{ height: '100%', borderRadius: '999px', backgroundColor: score.dot, width: `${value}%`, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ backgroundColor: approved ? '#F1EADF' : '#FFFCF7' }}>
            <SectionTitle icon={ThumbsUp} title="Itinerary Approval" color="#641F32" />
            {approved ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} color="#641F32" />
                <p style={{ margin: 0, fontSize: '14px', color: '#641F32', fontWeight: '500' }}>
                  Itinerary approved successfully!
                </p>
              </div>
            ) : (
              <>
                <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#725D52' }}>
                  Review and approve the linked itinerary to move this lead to Confirmed.
                </p>
                <button
                  onClick={() => setApproved(true)}
                  style={{
                    width: '100%', padding: '11px', borderRadius: '10px', border: 'none',
                    backgroundColor: '#641F32', color: '#FFFCF7',
                    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#641F32'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#641F32'}
                >
                  <ThumbsUp size={15} /> Approve Itinerary
                </button>
              </>
            )}
          </Card>
        </div>
      </div>
      {/* ── Row 3: Linked Itinerary + Linked Quotation ───────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Card>
          <SectionTitle icon={Map} title="Linked Itinerary" />
          {lead.itinerary ? (
            <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#F5EEE3', border: '1px solid #EDE3D5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#35231F' }}>{lead.itinerary.title}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#A18D7D' }}>
                    {lead.itinerary.days} days · Created {lead.itinerary.createdAt}
                  </p>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', backgroundColor: '#F6EBD5', color: '#A8793E', fontWeight: '500' }}>
                  {lead.itinerary.status}
                </span>
              </div>
              <button
                onClick={() => navigate(`/itinerary?itineraryId=${lead.itinerary.id}`)}
                style={{
                  marginTop: '12px', width: '100%', padding: '8px', borderRadius: '8px',
                  border: '1px solid #E6D9C8', backgroundColor: '#FFFCF7', fontSize: '13px',
                  color: '#4A342D', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                View Itinerary <ChevronRight size={13} />
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: '#A18D7D' }}>
              <Map size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '13px' }}>No itinerary yet</p>
              <button
                onClick={() => navigate(`/itinerary?leadId=${lead.id}`)}
                style={{
                  marginTop: '12px', padding: '8px 16px', borderRadius: '8px', border: 'none',
                  backgroundColor: '#641F32', color: '#FFFCF7', fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                }}
              >
                Build Itinerary <ChevronRight size={13} />
              </button>
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle icon={FileText} title="Linked Quotation" color="#641F32" />
          {lead.quotation ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#35231F' }}>{lead.quotation.amount}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#A18D7D' }}>Valid until {lead.quotation.validUntil}</p>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', backgroundColor: '#F1E8DC', color: '#641F32', fontWeight: '500' }}>
                  {lead.quotation.status}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {lead.quotation.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#4A342D' }}>
                    <CheckCircle size={13} color="#641F32" /> {item}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: '#A18D7D' }}>
              <FileText size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '13px' }}>No quotation generated yet</p>
            </div>
          )}
        </Card>
      </div>

      {/* ── Row 4: Quotation Generator ────────────────────────────────────── */}
      <QuotationGenerator leadId={lead.id} itineraryId={lead.itinerary?.id} groupSize={lead.group_size ?? lead.groupSize ?? 1} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default LeadDetail