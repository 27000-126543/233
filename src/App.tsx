import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import MainLayout from '@/layouts/MainLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import RealTimeMonitor from '@/pages/RealTimeMonitor'
import EarlyWarning from '@/pages/EarlyWarning'
import HolidayPlan from '@/pages/HolidayPlan'
import TollAudit from '@/pages/TollAudit'
import Reports from '@/pages/Reports'

function App() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)

  if (!isLoggedIn) {
    return <Login />
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/monitor" element={<RealTimeMonitor />} />
        <Route path="/warning" element={<EarlyWarning />} />
        <Route path="/holiday" element={<HolidayPlan />} />
        <Route path="/audit" element={<TollAudit />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </MainLayout>
  )
}

export default App
