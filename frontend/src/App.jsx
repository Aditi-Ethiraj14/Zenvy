// ============================================================
// App.jsx — Root Router & Auth Context
// ============================================================

import React, { createContext, useContext, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LangProvider } from './i18n.jsx'

import Login       from './pages/Login.jsx'
import Signup      from './pages/Signup.jsx'
import Dashboard   from './pages/Dashboard.jsx'
import PolicyPage  from './pages/PolicyPage.jsx'
import ClaimsPage  from './pages/ClaimsPage.jsx'
import AlertsPage  from './pages/AlertsPage.jsx'
import PayoutHistory from './pages/PayoutHistory.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import MapView     from './pages/MapView.jsx'
import Layout      from './components/Layout.jsx'
import Landing     from './pages/Landing.jsx'

// ── Auth Context ──────────────────────────────────────────────
export const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Restore session from localStorage on page refresh
    const saved = localStorage.getItem('zenvy_user')
    return saved ? JSON.parse(saved) : null
  })

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('zenvy_user', JSON.stringify(userData))
    localStorage.setItem('zenvy_token', userData.access_token)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('zenvy_user')
    localStorage.removeItem('zenvy_token')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Protected Route ───────────────────────────────────────────
function Protected({ children, adminOnly = false }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/app/dashboard" replace />
  return children
}

// ── App Router ────────────────────────────────────────────────
export default function App() {
  return (
    <LangProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing Route */}
          <Route path="/" element={<Landing />} />
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected worker routes */}
          <Route path="/app" element={<Protected><Layout /></Protected>}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard"     element={<Dashboard />} />
            <Route path="policy"        element={<PolicyPage />} />
            <Route path="claims"        element={<ClaimsPage />} />
            <Route path="alerts"        element={<AlertsPage />} />
            <Route path="payouts"       element={<PayoutHistory />} />
            <Route path="map"           element={<MapView />} />
            <Route path="admin"         element={<Protected adminOnly><AdminDashboard /></Protected>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </LangProvider>
  )
}
