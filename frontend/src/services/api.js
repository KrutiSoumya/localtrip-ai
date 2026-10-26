import axios from 'axios'

// ─── Base Axios Instance ───────────────────────────────────────────────────────

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request Interceptor ───────────────────────────────────────────────────────

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

// ─── Response Interceptor ─────────────────────────────────────────────────────

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

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const loginUser = (credentials) =>
  api.post('/auth/login', credentials)

export const registerUser = (userData) =>
  api.post('/auth/register', userData)

// ─── Leads ─────────────────────────────────────────────────────────────────────

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

// ─── Itinerary ────────────────────────────────────────────────────────────────

// Generate itinerary through the actual backend AI route
export const generateItinerary = (requirementsData) =>
  api.post('/trip/generate', requirementsData)

// Create/save a new itinerary
export const saveItinerary = (data) =>
  api.post('/itinerary', data)

// Get all itineraries for a lead
export const getItinerariesByLead = (leadId) =>
  api.get(`/itinerary/lead/${leadId}`)

// Update an existing itinerary
export const updateItinerary = (id, data) =>
  api.patch(`/itinerary/${id}`, data)

// Update a single itinerary day
export const updateItineraryDay = (dayId, data) =>
  api.patch(`/itinerary/day/${dayId}`, data)

// ─── Bookings ─────────────────────────────────────────────────────────────────

// Get upcoming bookings
export const getBookings = () =>
  api.get('/bookings/upcoming')

// Create booking
export const createBooking = (bookingData) =>
  api.post('/bookings', bookingData)

// Update booking payment status
export const updateBookingPayment = (id, paymentStatus) =>
  api.patch(`/bookings/${id}/payment`, {
    paymentStatus,
  })

// ─── Analytics ────────────────────────────────────────────────────────────────

export const getAnalytics = () =>
  api.get('/analytics')

export const getAnalyticsSummary = () =>
  api.get('/analytics/summary')

// ─── Quotations ───────────────────────────────────────────────────────────────

// Create quotation
export const generateQuotation = (data) =>
  api.post('/quotations', data)

// Get all quotations belonging to a lead
export const getQuotationByLead = (leadId) =>
  api.get(`/quotations/lead/${leadId}`)

// ─── Follow-ups ───────────────────────────────────────────────────────────────

// Send/fetch follow-up through the existing lead follow-up route
export const sendFollowUp = (leadId) =>
  api.get(`/leads/follow-up/${leadId}`)

// ─── Default Export ────────────────────────────────────────────────────────────

export default api