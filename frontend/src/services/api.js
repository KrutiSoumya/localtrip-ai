
import axios from 'axios'

// ─── Base Axios Instance ──────────────────────────────────────────────────────

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request Interceptor ─────────────────────────────────────────────────────

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor ────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

// ─── Auth ────────────────────────────────────────────────────────────────────

export const loginUser = (credentials) =>
  api.post('/auth/login', credentials)

export const registerUser = (userData) =>
  api.post('/auth/register', userData)

// ─── Leads ───────────────────────────────────────────────────────────────────

export const getLeads = () =>
  api.get('/leads')

export const getLeadById = (id) =>
  api.get(`/leads/${id}`)

export const createLead = (leadData) =>
  api.post('/leads', leadData)

export const updateLead = (id, leadData) =>
  api.patch(`/leads/${id}/status`, leadData)

export const deleteLead = (id) =>
  api.delete(`/leads/${id}`)

// ─── Itinerary Generation ────────────────────────────────────────────────────

// Generate an itinerary using the backend AI route
export const generateItinerary = (requirementsData) =>
  api.post('/ai/generate-itinerary', requirementsData)

// ─── Itinerary Save / Read / Update ──────────────────────────────────────────

// Save a new itinerary linked to a lead.
//
// Expected data:
// {
//   leadId: number,
//   title: string,
//   summary?: string,
//   days: [
//     {
//       day_number: number,
//       title?: string,
//       activities: string,
//       meals?: string,
//       hotel?: string,
//       transport?: string
//     }
//   ]
// }
//
// The payload matches the current itineraryController.js and schema.prisma.

export const saveItinerary = (data) =>
  api.post('/itinerary/save', data)


// Get all saved itineraries linked to a particular lead
export const getItinerariesByLead = (leadId) =>
  api.get(`/itinerary/lead/${leadId}`)

// Update an existing itinerary
export const updateItinerary = (id, data) =>
  api.patch(`/itinerary/${id}`, data)

// Update a single itinerary day
export const updateItineraryDay = (dayId, data) =>
  api.patch(`/itinerary/day/${dayId}`, data)

// ─── Bookings ────────────────────────────────────────────────────────────────

// Get all bookings
export const getAllBookings = () =>
  api.get('/bookings')

// Get upcoming bookings
export const getBookings = () =>
  api.get('/bookings/upcoming')

// Create a booking
export const createBooking = (bookingData) =>
  api.post('/bookings', bookingData)

export const getInvoicesDueToday = () => api.get('/invoices/due-today')
export const generateInvoice = (bookingId) => api.post('/invoices/generate', { booking_id: bookingId })
export const updateInvoiceAdjustments = (id, adjustments) => api.put(`/invoices/${id}/adjustments`, { adjustments })
export const sendInvoice = (id) => api.post(`/invoices/${id}/send`)
export const markInvoicePaid = (id, payment) => api.patch(`/invoices/${id}/mark-paid`, payment)
export const getPublicInvoice = (token) => api.get(`/invoices/public/${token}`)
export const updateBookingStatus = (id, status) => api.patch(`/bookings/${id}/status`, { status })

// ─── Analytics ───────────────────────────────────────────────────────────────

export const getAnalytics = () =>
  api.get('/analytics')

export const getAnalyticsSummary = () =>
  api.get('/analytics/summary')

// ─── Quotations ──────────────────────────────────────────────────────────────

// Generate a quotation
export const generateQuotation = (data) =>
  api.post('/quotations', data)

// Get quotations linked to a lead
export const getQuotationByLead = (leadId) =>
  api.get(`/quotations/lead/${leadId}`)

// ─── Follow-ups ──────────────────────────────────────────────────────────────

// Send/fetch follow-up through the existing lead follow-up route
export const sendFollowUp = (leadId) =>
  api.get(`/leads/follow-up/${leadId}`)

// ─── Default Export ──────────────────────────────────────────────────────────

export default api
