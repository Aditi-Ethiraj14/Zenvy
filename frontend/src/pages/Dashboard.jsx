// ============================================================
// Dashboard.jsx — Worker Home Dashboard with i18n + Flow Status
// ============================================================

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../App.jsx'
import { useLang } from '../i18n.jsx'
import { getWeatherRisk, getActivePolicy, getAlerts, getClaimsHistory } from '../api.js'
import RiskBadge from '../components/RiskBadge.jsx'
import StatCard from '../components/StatCard.jsx'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const ROLE_TIPS = {
  food_delivery:     ['Stay hydrated during heat alerts', 'Use rain gear — ₹25/week covers you!', 'Avoid flooded streets'],
  grocery_delivery:  ['AQI above 300 triggers payout', 'Plan routes before monsoon', 'File claims within 7 days'],
  ecommerce_delivery:['Traffic disruptions are covered', 'Check AQI before long routes', 'Multiple deliveries = higher income protection'],
}

// End-to-end onboarding flow progress bar
function FlowProgress({ hasPolicy, hasClaims, hasPayout }) {
  const steps = [
    { label: 'Signed Up', done: true, icon: '👤', path: null },
    { label: 'Buy Policy', done: hasPolicy, icon: '📋', path: '/app/policy' },
    { label: 'Trigger Fires', done: hasClaims, icon: '⚡', path: null },
    { label: 'Claim Paid', done: hasPayout, icon: '💸', path: '/app/payouts' },
  ]
  const nextStep = steps.find(s => !s.done)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 text-sm">🔄 Your Progress</h3>
        {nextStep?.path && (
          <Link to={nextStep.path} className="text-xs text-blue-600 font-medium hover:underline">
            Next: {nextStep.label} →
          </Link>
        )}
      </div>
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all ${
                s.done ? 'bg-green-100 text-green-700 ring-2 ring-green-300' : 'bg-gray-100 text-gray-400'
              }`}>
                {s.done ? '✅' : s.icon}
              </div>
              <p className="text-xs text-center text-gray-500 w-16 leading-tight">{s.label}</p>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mb-5 ${steps[i+1].done ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { t }    = useLang()

  const [weather, setWeather]   = useState(null)
  const [policy, setPolicy]     = useState(null)
  const [alerts, setAlerts]     = useState([])
  const [claims, setClaims]     = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [wRes, aRes, cRes] = await Promise.all([
        getWeatherRisk(user.city || 'Mumbai', user.role),
        getAlerts(user.user_id),
        getClaimsHistory(user.user_id),
      ])
      setWeather(wRes.data)
      setAlerts(aRes.data || [])
      setClaims(cRes.data || [])

      try {
        const pRes = await getActivePolicy(user.user_id)
        setPolicy(pRes.data)
      } catch { setPolicy(null) }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const roleEmoji   = { food_delivery: '🍔', grocery_delivery: '🛒', ecommerce_delivery: '📦' }
  const tips        = ROLE_TIPS[user?.role] || ROLE_TIPS.food_delivery
  const unreadAlerts = alerts.filter(a => !a.is_read).length
  const paidClaims  = claims.filter(c => c.status === 'paid')
  const totalPaid   = paidClaims.reduce((s, c) => s + c.payout_amount, 0)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-4xl animate-bounce">⚡</div>
        <p className="text-gray-500 mt-2">{t('loading')}</p>
      </div>
    </div>
  )

  const risk   = weather?.risk
  const riskPct = risk ? Math.round(risk.risk_score * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {t('goodDay')}, {user?.name?.split(' ')[0]}! {roleEmoji[user?.role]}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {user?.city} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        {unreadAlerts > 0 && (
          <Link to="/app/alerts" className="relative">
            <span className="text-2xl">🔔</span>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unreadAlerts}
            </span>
          </Link>
        )}
      </div>

      {/* End-to-end flow progress */}
      <FlowProgress
        hasPolicy={!!policy}
        hasClaims={claims.length > 0}
        hasPayout={paidClaims.length > 0}
      />

      {/* Risk Score Hero Card */}
      <div className={`rounded-2xl p-6 text-white relative overflow-hidden ${
        !risk            ? 'bg-gray-600' :
        riskPct < 25     ? 'bg-gradient-to-r from-green-500 to-green-700' :
        riskPct < 50     ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
        riskPct < 75     ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                           'bg-gradient-to-r from-red-600 to-red-900'
      }`}>
        <div className="relative z-10">
          <p className="text-white/80 text-sm font-medium">{t('riskScore')}</p>
          <div className="flex items-end gap-4 mt-2">
            <p className="text-6xl font-black">{riskPct}%</p>
            <div className="mb-2">{risk && <RiskBadge level={risk.risk_level} />}</div>
          </div>
          {risk && (
            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-white/70">{t('weeklyPremium')}</p>
                <p className="font-bold text-lg">₹{risk.weekly_premium}</p>
              </div>
              <div>
                <p className="text-white/70">{t('rain')}</p>
                <p className="font-bold text-lg">{weather?.weather?.rainfall_mm?.toFixed(1)}mm</p>
              </div>
              <div>
                <p className="text-white/70">{t('aqi')}</p>
                <p className="font-bold text-lg">{weather?.weather?.aqi?.toFixed(0)}</p>
              </div>
            </div>
          )}
        </div>
        <div className="absolute right-4 top-4 text-6xl opacity-20">🧠</div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📋" label={t('policyStatus')}
          value={policy ? '✅ Active' : '❌ None'}
          sub={policy ? `₹${policy.weekly_premium}/wk` : 'Buy now to get covered'}
          color={policy ? 'green' : 'orange'} />
        <StatCard icon="💸" label="Protected Earnings"
          value={`₹${totalPaid.toFixed(0)}`}
          sub={`${paidClaims.length} payouts received`} color="green" />
        <StatCard icon="🌡️" label={t('temperature')}
          value={`${weather?.weather?.temperature?.toFixed(0) || '--'}°C`}
          sub="Real-time" color="blue" />
        <StatCard icon="🔔" label={t('alertsTitle')}
          value={unreadAlerts} sub={`${alerts.length} total`} color={unreadAlerts > 0 ? 'red' : 'green'} />
      </div>

      {/* Policy + CTA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!policy ? (
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white h-full flex flex-col justify-center">
            <h3 className="text-xl font-bold">⚡ {t('getProtected')}</h3>
            <p className="text-blue-100 mt-1 text-sm mb-4">
              Current risk: <strong>{risk?.risk_level?.toUpperCase()}</strong> —
              Weekly premium as low as <strong>₹{risk?.weekly_premium || 10}</strong>
            </p>
            <Link to="/app/policy"
              className="inline-block bg-white text-blue-700 font-bold px-6 py-2.5 rounded-xl hover:bg-blue-50 transition-all shadow-md">
              {t('buyPolicy')} →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">📋 {t('activePolicy')}</h3>
              <RiskBadge level={policy.risk_level} score={policy.risk_score} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm flex-1">
              <div><p className="text-gray-500">Premium</p><p className="font-bold text-lg">₹{policy.weekly_premium}/wk</p></div>
              <div><p className="text-gray-500">Coverage</p><p className="font-bold text-lg">₹{policy.coverage_amount?.toLocaleString()}</p></div>
              <div><p className="text-gray-500">Status</p><p className="font-bold text-lg text-green-600">✅ Active</p></div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link to="/app/claims" className="text-sm text-blue-600 font-bold hover:underline">
                File a Claim →
              </Link>
            </div>
          </div>
        )}

        {/* Short-term forecast */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full">
          <h3 className="font-bold text-gray-800 mb-3">🔮 {t('forecast')}</h3>
          <div className="space-y-3">
            {[1, 2, 3].map(day => {
              const v = riskPct + (day * (riskPct > 50 ? -5 : 5))
              const capV = Math.min(100, Math.max(0, v))
              const level = capV < 25 ? 'low' : capV < 50 ? 'medium' : capV < 75 ? 'high' : 'critical'
              const d = new Date(); d.setDate(d.getDate() + day)
              return (
                <div key={day} className="flex justify-between items-center text-sm p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="text-gray-600 font-medium">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <RiskBadge level={level} score={capV / 100} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* AI Alert */}
      {risk?.alert_message && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 text-sm font-medium">{risk.alert_message}</p>
        </div>
      )}

      {/* Recent claim payouts */}
      {paidClaims.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800">💸 Recent Payouts</h3>
            <Link to="/app/payouts" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {paidClaims.slice(0, 3).map(c => (
              <div key={c.id} className="flex justify-between items-center text-sm bg-green-50 rounded-xl px-4 py-2.5">
                <div>
                  <p className="font-medium text-gray-800">{c.trigger_event?.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</p>
                </div>
                <p className="font-bold text-green-700">+₹{c.payout_amount.toFixed(0)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800">🔔 Recent Alerts</h3>
            <Link to="/app/alerts" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 3).map(a => (
              <div key={a.id} className={`px-4 py-3 rounded-xl text-sm border ${
                a.severity === 'critical' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
              } ${!a.is_read ? 'font-medium' : 'opacity-70'}`}>
                <p className="text-gray-800">{a.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Tips */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-3">💡 {t('tipsForYou')}</h3>
        <ul className="space-y-2">
          {tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-blue-500 mt-0.5">✓</span> {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
