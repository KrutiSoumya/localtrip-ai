import axios from 'axios'

// ─── Base Axios Instance ───────────────────────────────────────────────────────

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request Interceptor ───────────────────────────────────────────────────────
// Automatically attaches JWT token to every request if one exists in localStorage
// Note: localStorage is used here for capstone simplicity.
// In production, use httpOnly cookies to prevent XSS vulnerabilities.

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
// Automatically logs out user if backend returns 401 (token expired/invalid)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
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

// ─── Leads ────────────────────────────────────────────────────────────────────

export const getLeads = () =>
  api.get('/leads')

export const getLeadById = (id) =>
  api.get(`/leads/${id}`)

export const createLead = (leadData) =>
  api.post('/leads', leadData)

export const updateLead = (id, leadData) =>
  api.put(`/leads/${id}`, leadData)

export const deleteLead = (id) =>
  api.delete(`/leads/${id}`)

// ─── Itinerary ────────────────────────────────────────────────────────────────

export const generateItinerary = (requirementsData) =>
  api.post('/itinerary/generate', requirementsData)

export const getItineraries = () =>
  api.get('/itinerary')

export const getItineraryById = (id) =>
  api.get(`/itinerary/${id}`)

export const updateItinerary = (id, data) =>
  api.put(`/itinerary/${id}`, data)

export const deleteItinerary = (id) =>
  api.delete(`/itinerary/${id}`)

// ─── Bookings ─────────────────────────────────────────────────────────────────

export const getBookings = () =>
  api.get('/bookings')

export const getBookingById = (id) =>
  api.get(`/bookings/${id}`)

export const createBooking = (bookingData) =>
  api.post('/bookings', bookingData)

export const updateBooking = (id, bookingData) =>
  api.put(`/bookings/${id}`, bookingData)

export const deleteBooking = (id) =>
  api.delete(`/bookings/${id}`)

// ─── Analytics ────────────────────────────────────────────────────────────────

export const getAnalytics = () =>
  api.get('/analytics')

export const getAnalyticsSummary = () =>
  api.get('/analytics/summary')

// ─── Quotations ───────────────────────────────────────────────────────────────

export const generateQuotation = (leadId, data) =>
  api.post(`/quotations/${leadId}/generate`, data)

export const getQuotationByLead = (leadId) =>
  api.get(`/quotations/${leadId}`)

// ─── Follow-ups ───────────────────────────────────────────────────────────────

export const sendFollowUp = (leadId) =>
  api.post(`/followups/${leadId}/send`)

export const getFollowUps = (leadId) =>
  api.get(`/followups/${leadId}`)

// ─── Default export (raw instance for custom calls if needed) ─────────────────

export default api