import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import NewLead from './pages/NewLead'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import LeadDetail from './pages/LeadDetail'
import Bookings from './pages/Bookings'
import Itinerary from './pages/Itinerary'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public Routes - no login needed */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          

          {/* Protected Routes - redirects to /login if no token */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
          } />
          <Route path="/leads" element={
            <ProtectedRoute><Layout><Leads /></Layout></ProtectedRoute>
          } />
          <Route path="/leads/new" element={
  <ProtectedRoute><Layout><NewLead /></Layout></ProtectedRoute>
} />
          <Route path="/leads/:id" element={
            <ProtectedRoute><Layout><LeadDetail /></Layout></ProtectedRoute>
          } />
          <Route path="/bookings" element={
            <ProtectedRoute><Layout><Bookings /></Layout></ProtectedRoute>
          } />
          <Route path="/itinerary" element={
            <ProtectedRoute><Layout><Itinerary /></Layout></ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>
          } />
      <Route path="/settings" element={
  <ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>
} />
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Catch all unknown URLs */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App