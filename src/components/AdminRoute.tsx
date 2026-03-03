import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const AdminRoute = () => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}
