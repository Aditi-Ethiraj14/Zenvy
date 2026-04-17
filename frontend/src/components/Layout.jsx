// ============================================================
// Layout.jsx — App Shell with Sidebar, Notification Bell & Lang Switch
// ============================================================

import React, { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../App.jsx'
import { getAlerts, markAlertRead } from '../api.js'
import { useLang, LANGUAGES, STRINGS } from '../i18n.jsx'

const ROLE_CONFIG = {
  food_delivery:     { label: 'Food Delivery',       emoji: '🍔', color: 'text-orange-600' },
  grocery_delivery:  { label: 'Grocery Delivery',    emoji: '🛒', color: 'text-green-600' },
  ecommerce_delivery:{ label: 'E-commerce Delivery', emoji: '📦', color: 'text-purple-600' },
  admin:             { label: 'Admin',                emoji: '🛠️', color: 'text-gray-600' },
}

function getWorkerNav(t) {
  return [
    { path: '/app/dashboard', icon: '🏠', labelKey: 'dashboard' },
    { path: '/app/policy',    icon: '📋', labelKey: 'myPolicy' },
    { path: '/app/claims',    icon: '📝', labelKey: 'fileClaim' },
    { path: '/app/alerts',    icon: '🔔', labelKey: 'alerts' },
    { path: '/app/payouts',   icon: '💸', labelKey: 'payouts' },
    { path: '/app/map',       icon: '🗺️', labelKey: 'riskMap' },
  ]
}

function getAdminNav(t) {
  return [
    { path: '/app/admin', icon: '📊', labelKey: 'adminDashboard' },
    { path: '/app/map',   icon: '🗺️', labelKey: 'riskMap' },
  ]
}

const ALERT_ICONS = { rain: '🌧️', flood: '🌊', aqi: '😷', heat: '🌡️', admin: '🚨', traffic: '🚗', restriction: '🚧' }

export default function Layout() {
  const { user, logout } = useAuth()
  const { t, lang, setLang } = useLang()
  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen]     = useState(false)
  const [alerts, setAlerts]               = useState([])
  const [notifOpen, setNotifOpen]         = useState(false)
  const [langOpen, setLangOpen]           = useState(false)
  const notifRef = useRef(null)
  const langRef  = useRef(null)

  const unreadAlerts = alerts.filter(a => !a.is_read).length

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (langRef.current  && !langRef.current.contains(e.target))  setLangOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Poll alerts for workers only
  useEffect(() => {
    if (!user || user.role === 'admin') return
    const fetchAlerts = async () => {
      try {
        const res = await getAlerts(user.user_id)
        setAlerts(res.data || [])
      } catch {}
    }
    fetchAlerts()
    const iv = setInterval(fetchAlerts, 15000)
    return () => clearInterval(iv)
  }, [user])

  const handleMarkRead = async (id, e) => {
    e.stopPropagation()
    try {
      await markAlertRead(id)
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a))
    } catch {}
  }

  const roleConf = ROLE_CONFIG[user?.role] || ROLE_CONFIG.food_delivery
  const navItems = user?.role === 'admin' ? getAdminNav(t) : getWorkerNav(t)

  const handleLogout = () => { logout(); navigate('/login') }

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
      isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:shadow-none lg:border-r lg:border-gray-200 flex flex-col`}>

        {/* Logo */}
        <div className="p-6 border-b border-gray-100 shrink-0">
          <h1 className="text-2xl font-bold text-blue-700">⚡ ZENVY</h1>
          <p className="text-xs text-gray-500 mt-1">Income Insurance for Gig Workers</p>
        </div>

        {/* User Badge */}
        <div className="p-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">
              {roleConf.emoji}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 text-sm truncate">{user?.name}</p>
              <p className={`text-xs font-medium ${roleConf.color}`}>{roleConf.label}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} className={navLinkClass}
              onClick={() => setSidebarOpen(false)}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span>{t(item.labelKey)}</span>
                </div>
                {item.labelKey === 'alerts' && unreadAlerts > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadAlerts}
                  </span>
                )}
              </div>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100 shrink-0">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all">
            <span>🚪</span><span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main content ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Header Bar (always visible) */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          {/* Left: hamburger (mobile) + logo (mobile) */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
              <div className="w-5 h-0.5 bg-gray-600 mb-1" />
              <div className="w-5 h-0.5 bg-gray-600 mb-1" />
              <div className="w-5 h-0.5 bg-gray-600" />
            </button>
            <h1 className="lg:hidden text-lg font-bold text-blue-700">⚡ ZENVY</h1>
            {/* Desktop breadcrumb area */}
            <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500">
              <span className="font-semibold text-gray-800">⚡ ZENVY</span>
              <span className="text-gray-300">/</span>
              <span>{user?.city}</span>
            </div>
          </div>

          {/* Right: Language + Notification bell */}
          <div className="flex items-center gap-2">

            {/* Language Switcher */}
            <div className="relative" ref={langRef}>
              <button
                id="lang-switcher-btn"
                onClick={() => setLangOpen(o => !o)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all border border-gray-200"
              >
                <span>{LANGUAGES[lang]?.flag}</span>
                <span className="hidden sm:inline">{LANGUAGES[lang]?.label}</span>
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  {Object.entries(LANGUAGES).map(([code, { label, flag }]) => (
                    <button key={code} onClick={() => { setLang(code); setLangOpen(false) }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${lang === code ? 'font-bold text-blue-600 bg-blue-50' : 'text-gray-700'}`}>
                      <span className="text-lg">{flag}</span>
                      <span>{label}</span>
                      {lang === code && <span className="ml-auto text-blue-500">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell (workers only) */}
            {user?.role !== 'admin' && (
              <div className="relative" ref={notifRef}>
                <button
                  id="notification-bell-btn"
                  onClick={() => setNotifOpen(o => !o)}
                  className="relative p-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-all border border-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadAlerts > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center leading-none">
                      {unreadAlerts > 9 ? '9+' : unreadAlerts}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Panel */}
                {notifOpen && (
                  <div className="absolute right-0 mt-1 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <h3 className="font-bold text-gray-800 text-sm">{t('alertsTitle')}</h3>
                      <div className="flex items-center gap-2">
                        {unreadAlerts > 0 && (
                          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                            {unreadAlerts} {t('unread')}
                          </span>
                        )}
                        <Link
                          to="/app/alerts"
                          onClick={() => setNotifOpen(false)}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          View all
                        </Link>
                      </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                      {alerts.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          <p className="text-2xl mb-2">✅</p>
                          <p>{t('allClear')}</p>
                        </div>
                      ) : (
                        alerts.slice(0, 8).map(a => (
                          <div key={a.id}
                            className={`px-4 py-3 hover:bg-gray-50 transition-colors ${!a.is_read ? 'bg-blue-50/40' : ''}`}>
                            <div className="flex items-start gap-2">
                              <span className="text-lg mt-0.5 shrink-0">{ALERT_ICONS[a.alert_type] || '⚠️'}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className={`text-xs font-semibold truncate ${!a.is_read ? 'text-gray-900' : 'text-gray-500'}`}>
                                    {a.title}
                                  </p>
                                  {!a.is_read && (
                                    <button
                                      onClick={(e) => handleMarkRead(a.id, e)}
                                      className="shrink-0 text-xs text-blue-500 hover:text-blue-700 font-medium"
                                    >
                                      {t('markRead')}
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 truncate mt-0.5">{a.message}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {new Date(a.created_at).toLocaleString()}
                                </p>
                              </div>
                              {!a.is_read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {alerts.length > 0 && (
                      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                        <Link
                          to="/app/alerts"
                          onClick={() => setNotifOpen(false)}
                          className="block w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View all {alerts.length} alerts →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Admin notification count (no bell popup for admin — they see the admin dashboard) */}
            {user?.role === 'admin' && (
              <span className="text-xs text-gray-500 px-3 py-2 border border-gray-200 rounded-xl">
                🛠️ Admin Mode
              </span>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
