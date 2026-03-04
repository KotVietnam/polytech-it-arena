import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminRoute } from './components/AdminRoute'
import { GridCellsOverlay } from './components/GridCellsOverlay'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { AdminPage } from './pages/AdminPage'
import { ArchivePage } from './pages/ArchivePage'
import { CalendarPage } from './pages/CalendarPage'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { CybersecurityPage } from './pages/tracks/CybersecurityPage'
import { DevopsPage } from './pages/tracks/DevopsPage'
import { NetworksPage } from './pages/tracks/NetworksPage'
import { TrackInfoPage } from './pages/tracks/TrackInfoPage'
import { TrackNewsPage } from './pages/tracks/TrackNewsPage'
import { SysadminPage } from './pages/tracks/SysadminPage'

export default function App() {
  return (
    <AuthProvider>
      <GridCellsOverlay />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/register" element={<Navigate to="/home" replace />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/tracks/cybersecurity" element={<CybersecurityPage />} />
            <Route path="/tracks/networks" element={<NetworksPage />} />
            <Route path="/tracks/devops" element={<DevopsPage />} />
            <Route path="/tracks/sysadmin" element={<SysadminPage />} />
            <Route path="/tracks/:trackId/info" element={<TrackInfoPage />} />
            <Route path="/tracks/:trackId/news" element={<TrackNewsPage />} />

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
