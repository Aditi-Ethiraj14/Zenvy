// ============================================================
// AlertsPage.jsx — Worker Alerts with i18n
// ============================================================
import React, { useState, useEffect } from 'react'
import { useAuth } from '../App.jsx'
import { useLang } from '../i18n.jsx'
import { getAlerts, markAlertRead } from '../api.js'

const ALERT_ICONS = {
  rain: '🌧️', flood: '🌊', aqi: '😷', heat: '🌡️',
  admin: '🚨', traffic: '🚗', restriction: '🚧'
}

const SEVERITY_COLORS = {
  critical: 'bg-red-50 border-red-200 text-red-800',
  warning:  'bg-yellow-50 border-yellow-200 text-yellow-800',
}

const SEVERITY_BADGE = {
  critical: 'bg-red-500 text-white',
  warning:  'bg-yellow-500 text-white',
}

export default function AlertsPage() {
  const { user }   = useAuth()
  const { t }      = useLang()
  const [alerts, setAlerts]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAlerts(user.user_id)
      .then(r => setAlerts(r.data || []))
      .finally(() => setLoading(false))
  }, [])

  const handleRead = async (id) => {
    await markAlertRead(id)
    setAlerts(alerts.map(a => a.id === id ? { ...a, is_read: true } : a))
  }

  const handleMarkAllRead = async () => {
    const unread = alerts.filter(a => !a.is_read)
    await Promise.all(unread.map(a => markAlertRead(a.id)))
    setAlerts(alerts.map(a => ({ ...a, is_read: true })))
  }

  const unread = alerts.filter(a => !a.is_read).length

  if (loading) return <div className="text-center py-12 text-gray-400">⏳ {t('loading')}</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🔔 {t('alertsTitle')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unread > 0 ? `${unread} ${t('unread')}` : t('allClear')}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAllRead}
            className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-all">
            Mark all read
          </button>
        )}
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-xl font-bold text-gray-800">{alerts.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-xl font-bold text-blue-600">{unread}</p>
          <p className="text-xs text-gray-500">{t('unread')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-xl font-bold text-red-600">{alerts.filter(a => a.severity === 'critical').length}</p>
          <p className="text-xs text-gray-500">Critical</p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-6xl mb-4">✅</p>
          <p className="text-gray-500 font-medium">{t('allClear')}</p>
          <p className="text-gray-400 text-sm mt-1">You'll be notified when triggers are detected</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(a => {
              // Detect claim decision alerts by title content
              const isApproved = a.alert_type === 'admin' && a.title?.includes('Approved')
              const isRejected = a.alert_type === 'admin' && a.title?.includes('Rejected')
              const isFlagged  = a.alert_type === 'admin' && a.title?.includes('Flagged')
              const isDecision = isApproved || isRejected || isFlagged

              const cardClass = isApproved
                ? 'bg-green-50 border-green-200 text-green-900'
                : isRejected
                ? 'bg-red-50 border-red-200 text-red-900'
                : isFlagged
                ? 'bg-orange-50 border-orange-200 text-orange-900'
                : SEVERITY_COLORS[a.severity] || 'bg-gray-50 border-gray-200'

              const icon = isApproved ? '✅' : isRejected ? '❌' : isFlagged ? '⚠️' : (ALERT_ICONS[a.alert_type] || '🔔')

              return (
                <div key={a.id}
                  className={`rounded-2xl border p-4 transition-all ${cardClass} ${!a.is_read ? 'shadow-sm' : 'opacity-70'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm">{a.title}</p>
                          {!isDecision && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_BADGE[a.severity] || 'bg-gray-200 text-gray-700'}`}>
                              {a.severity}
                            </span>
                          )}
                          {!a.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full inline-block" />}
                        </div>
                        <p className="text-sm mt-1">{a.message}</p>
                        {a.trigger_value != null && (
                          <p className="text-xs mt-1 opacity-70">
                            Measured: <strong>{a.trigger_value}</strong> (Threshold: {a.trigger_threshold})
                          </p>
                        )}
                        <p className="text-xs mt-1.5 opacity-60">{new Date(a.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    {!a.is_read && (
                      <button onClick={() => handleRead(a.id)}
                        className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-white/60 hover:bg-white border border-current transition-all font-medium">
                        {t('markRead')}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

        </div>
      )}
    </div>
  )
}
