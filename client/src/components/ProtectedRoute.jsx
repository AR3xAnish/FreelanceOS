import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  // During verification check, render a clean loading indicator
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-gray-400 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Verifying session...</span>
        </div>
      </div>
    )
  }

  // Redirect to login if user is not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Render nested routes
  return <Outlet />
}
