import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth()

  // While checking auth state, show nothing (or a spinner)
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    )
  }

  // If no token found, redirect to login
  //if (!isLoggedIn) {
    //return <Navigate to="/login" replace />
  //}

  return children
}

export default ProtectedRoute