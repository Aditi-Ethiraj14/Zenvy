// ============================================================
// AdminDashboard.jsx — Full Admin Control Panel (Enhanced)
// ============================================================

import React, { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  ComposedChart, Area
} from 'recharts'
import {
  getAdminStats, getAllUsers, getAllClaims,
  getFraudAlerts, getAdminRiskTrend, triggerEvent, reviewClaim, getAdminNotifications
} from '../api.js'
import StatCard from '../components/StatCard.jsx'
import RiskBadge from '../components/RiskBadge.jsx'

const ROLE_COLORS = {
  food_delivery: '#f97316',
  grocery_delivery: '#22c55e',
  ecommerce_delivery: '#a855f7',
  admin: '#64748b'
}

const TRIGGER_TYPES = [
  { value: 'rain_15mm', label: '🌧️ Rain (≥15mm)' },
  { value: 'flood_40mm', label: '🌊 Flood (≥40mm)' },
  { value: 'aqi_300', label: '😷 AQI (≥300)' },
  { value: 'heat_43', label: '🌡️ Heat (≥43°C)' },
  { value: 'traffic_80', label: '🚗 Severe Traffic Disruption' },
  { value: 'zone_restriction_1', label: '🚧 Zone Restriction Active' },
  { value: 'admin', label: '🚨 Custom Admin Event' },
]

const FRAUD_REASONS = {
  high_frequency: '⚡ High claim frequency for user',
  gps_mismatch:  '📍 GPS location inconsistency',
  weather_mismatch: '🌦️ Weather data inconsistency',
  duplicate: '🔁 Duplicate claim pattern',
  anomaly: '🤖 ML anomaly score threshold exceeded',
}

function getFraudReason(score) {
  if (score > 0.85) return FRAUD_REASONS.high_frequency
  if (score > 0.75) return FRAUD_REASONS.gps_mismatch
  if (score > 0.65) return FRAUD_REASONS.weather_mismatch
  if (score > 0.55) return FRAUD_REASONS.duplicate
  return FRAUD_REASONS.anomaly
}

// Group daily snapshots into weekly averages
function groupByWeek(snapshots) {
  if (!snapshots || snapshots.length === 0) return []
  const weeks = {}
  snapshots.forEach(s => {
    const d = new Date(s.date)
    // Get week start (Monday)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const weekStart = new Date(d.setDate(diff))
    const key = weekStart.toISOString().slice(0, 10)
    if (!weeks[key]) {
      weeks[key] = { date: key, risk_scores: [], rainfall_mm: 0, aqi: 0, count: 0 }
    }
    weeks[key].risk_scores.push(s.risk_score)
    weeks[key].rainfall_mm += s.rainfall_mm || 0
    weeks[key].aqi += s.aqi || 0
    weeks[key].count += 1
  })
  return Object.values(weeks).map(w => ({
    date: w.date,
    risk_score: parseFloat((w.risk_scores.reduce((a,b) => a+b, 0) / w.risk_scores.length).toFixed(3)),
    rainfall_mm: parseFloat((w.rainfall_mm / w.count).toFixed(1)),
    aqi: parseFloat((w.aqi / w.count).toFixed(0)),
  })).sort((a,b) => a.date.localeCompare(b.date))
}

export default function AdminDashboard() {
  const [stats, setStats]         = useState(null)
  const [users, setUsers]         = useState([])
  const [claims, setClaims]       = useState([])
  const [fraud, setFraud]         = useState([])
  const [trend, setTrend]         = useState([])
  const [notifications, setNotif] = useState([])
  const [tab, setTab]             = useState('overview')
  const [loading, setLoading]     = useState(true)

  // Trigger form state
  const [triggerForm, setTriggerForm] = useState({
    event_type: 'rain_15mm', trigger_value: 20, city: 'Mumbai', message: ''
  })
  const [triggerResult, setTriggerResult] = useState(null)
  const [triggering, setTriggering] = useState(false)
  const [reviewingId, setReviewingId] = useState(null)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [sRes, uRes, cRes, fRes, tRes, nRes] = await Promise.all([
        getAdminStats(), getAllUsers(), getAllClaims(), getFraudAlerts(), getAdminRiskTrend(), getAdminNotifications()
      ])
      setStats(sRes.data)
      setUsers(uRes.data || [])
      setClaims(cRes.data || [])
      setFraud(fRes.data || [])
      setTrend(tRes.data || [])
      setNotif(nRes.data || [])
    } finally {
      setLoading(false)
    }
  }

  const handleTrigger = async () => {
    setTriggering(true)
    setTriggerResult(null)
    try {
      const res = await triggerEvent({
        event_type: triggerForm.event_type,
        trigger_value: Number(triggerForm.trigger_value),
        city: triggerForm.city,
        message: triggerForm.message
      })
      setTriggerResult({ success: true, data: res.data })
      loadAll()
    } catch (e) {
      setTriggerResult({ success: false, error: e.response?.data?.detail || 'Trigger failed' })
    } finally {
      setTriggering(false)
    }
  }

  const handleReview = async (claimId, status) => {
    setReviewingId(claimId)
    try {
      await reviewClaim(claimId, { status })
      loadAll()
    } catch (e) {
      alert('Failed to ' + status + ' claim')
    } finally {
      setReviewingId(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center"><div className="text-4xl animate-spin">⚙️</div><p className="text-gray-500 mt-2">Loading admin data...</p></div>
    </div>
  )

  // Pie chart data for role distribution
  const pieData = Object.entries(stats?.users_by_role || {}).map(([role, count]) => ({
    name: role.replace(/_/g, ' '), value: count, color: ROLE_COLORS[role] || '#64748b'
  }))

  // Weekly grouped trend data
  const weeklyTrend = groupByWeek(trend)

  // Analytics metrics
  const lossRatio = stats ? ((stats.total_payout / Math.max(1, (stats.total_policies || 1) * 15 * 4)) * 100).toFixed(1) : 0
  const fraudRate = stats ? ((stats.fraud_alerts / Math.max(1, stats.total_claims)) * 100).toFixed(1) : 0
  const predictedClaims = users.filter(u => u.policy_risk_level === 'high' || u.policy_risk_level === 'critical').length

  const TABS = ['overview', 'analytics', 'users', 'claims', 'fraud', 'notifications', 'trigger']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🛠️ Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">ZENVY Insurance Control Panel</p>
        </div>
        <button onClick={loadAll} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
          🔄 Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap border-b border-gray-200 pb-2">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              tab === t ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}>{t}</button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="👥" label="Total Workers" value={stats?.total_users || 0} color="blue" />
            <StatCard icon="📋" label="Active Policies" value={stats?.active_policies || 0} sub={`of ${stats?.total_policies} total`} color="green" />
            <StatCard icon="💸" label="Total Payouts" value={`₹${(stats?.total_payout || 0).toLocaleString()}`} color="purple" />
            <StatCard icon="⚠️" label="Fraud Alerts" value={stats?.fraud_alerts || 0} color="red" />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk trend — weekly */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-700 mb-1">📈 Risk Score Trend</h3>
              <p className="text-xs text-gray-400 mb-4">Weekly averages — {weeklyTrend.length > 0 ? weeklyTrend.length + ' weeks' : 'Loading...'}</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklyTrend.length > 0 ? weeklyTrend : trend.slice(-7)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v?.slice(5)} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => (v * 100).toFixed(1) + '%'} />
                  <Line type="monotone" dataKey="risk_score" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Weekly Risk Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Role distribution */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-700 mb-4">👥 Workers by Role</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${value}`}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend formatter={(v) => v.replace(/_/g, ' ')} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rainfall & Risk — using ComposedChart so Line and Bar can coexist */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-700 mb-1">📊 Rainfall & Risk Weekly Trend</h3>
            <p className="text-xs text-gray-400 mb-4">Weekly average rainfall (bars) vs risk score (line)</p>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={weeklyTrend.length > 0 ? weeklyTrend : trend.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v?.slice(5)} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} name="Rainfall (mm)" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} domain={[0, 1]} name="Risk Score" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="rainfall_mm" fill="#93c5fd" name="Rainfall (mm)" />
                <Line yAxisId="right" type="monotone" dataKey="risk_score" stroke="#ef4444" strokeWidth={2} dot={false} name="Risk Score" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="📉" label="Loss Ratio" value={`${lossRatio}%`} sub="Claims / Predicted Premium" color="red" />
            <StatCard icon="📊" label="Claim Volume" value={stats?.total_claims || 0} sub="All time claims" color="blue" />
            <StatCard icon="🚨" label="Fraud Rate" value={`${fraudRate}%`} sub="Flagged / Total" color="purple" />
            <StatCard icon="🔮" label="Predicted Claims" value={predictedClaims} sub="From high risk policies" color="orange" />
          </div>

          {/* Claim volume by trigger type */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-700 mb-4">⚡ Claim Volume by Disruption Type</h3>
            {(() => {
              const byType = {}
              claims.forEach(c => {
                const k = c.trigger_event || 'other'
                byType[k] = (byType[k] || 0) + 1
              })
              const chartData = Object.entries(byType).map(([type, count]) => ({
                type: type.replace(/_/g, ' ').slice(0,18),
                count
              })).sort((a, b) => b.count - a.count)
              return (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="type" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" name="Claims" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
            })()}
          </div>

          {/* City-wise disruption trends */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-700 mb-4">🏙️ City-wise Disruption Trends</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
              {['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'].map(city => {
                const cityFraud = fraud.filter(f => f.city === city).length
                const cityClaims = claims.filter(c => {
                  return users.find(u => u.name === c.user_name && u.city === city)
                }).length
                const activeUsers = users.filter(u => u.city === city && u.has_active_policy).length
                const totalCityUsers = users.filter(u => u.city === city).length
                return (
                  <div key={city} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="font-bold text-gray-800 text-base">{city}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-gray-500">Claims: <span className="font-bold text-gray-800">{cityClaims}</span></p>
                      <p className="text-gray-500">Active: <span className="text-green-600 font-bold">{activeUsers}</span></p>
                      <p className="text-gray-500">Fraud: <span className="text-red-500 font-bold">{cityFraud}</span></p>
                      <p className="text-gray-500">Workers: <span className="font-bold text-blue-600">{totalCityUsers}</span></p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Loss ratio trend */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-700 mb-4">📉 Portfolio Health Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-3xl font-black text-blue-700">{stats?.total_users || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Total Registered Workers</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-3xl font-black text-green-700">{stats?.active_policies || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Active Policies</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <p className="text-3xl font-black text-purple-700">₹{((stats?.total_payout || 0)).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Total Paid Out</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <p className="text-3xl font-black text-orange-700">{(stats?.avg_risk_score * 100 || 0).toFixed(0)}%</p>
                <p className="text-xs text-gray-500 mt-1">Avg Portfolio Risk</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {tab === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-700">All Workers ({users.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Role', 'City', 'Policy', 'Risk', 'Claims', 'Fraud Flags'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      u.role === 'food_delivery' ? 'bg-orange-100 text-orange-700' :
                      u.role === 'grocery_delivery' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>{u.role.replace(/_/g, ' ')}</span></td>
                    <td className="px-4 py-3 text-gray-500">{u.city}</td>
                    <td className="px-4 py-3">{u.has_active_policy ? '✅' : '❌'}</td>
                    <td className="px-4 py-3"><RiskBadge level={u.policy_risk_level} /></td>
                    <td className="px-4 py-3">{u.claims_count}</td>
                    <td className="px-4 py-3">{u.fraud_flags > 0 ? <span className="text-red-600 font-bold">⚠️ {u.fraud_flags}</span> : '✅ 0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CLAIMS TAB */}
      {tab === 'claims' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-700">All Claims ({claims.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Worker', 'Role', 'Type', 'Event', 'Payout', 'Status', 'Fraud', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {claims.map(c => (
                  <tr key={c.id} className={`hover:bg-gray-50 ${c.fraud_flagged ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 font-medium">{c.user_name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.user_role?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${c.claim_type === 'parametric' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{c.claim_type}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{c.trigger_event}</td>
                    <td className="px-4 py-3 font-bold text-green-700">₹{c.payout_amount.toFixed(0)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.status === 'paid' ? 'bg-green-100 text-green-700' : c.status === 'flagged' ? 'bg-red-100 text-red-700' : c.status === 'rejected' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>{c.status}</span></td>
                    <td className="px-4 py-3 text-xs">{c.fraud_flagged ? `⚠️ ${(c.fraud_score * 100).toFixed(0)}%` : '✅ Clean'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FRAUD / REVIEW TAB */}
      {tab === 'fraud' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-gray-700">🔍 Manual Claim Review Panel</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                All manual claims require admin review before payout.
                Parametric weather triggers auto-pay — only manual claims appear here.
              </p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
                ⏳ {fraud.filter(f => f.status === 'pending').length} Pending
              </span>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">
                ⚠️ {fraud.filter(f => f.status === 'flagged').length} Flagged
              </span>
            </div>
          </div>

          {fraud.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <p className="text-4xl mb-2">✅</p>
              <p className="text-gray-500">No manual claims pending review</p>
              <p className="text-gray-400 text-sm mt-1">Workers can file manual claims from their File a Claim page</p>
            </div>
          ) : fraud.map(f => (
            <div key={f.claim_id} className={`bg-white shadow-sm rounded-2xl overflow-hidden border ${
              f.status === 'flagged' ? 'border-red-200' :
              f.status === 'paid' ? 'border-green-200' :
              f.status === 'rejected' ? 'border-gray-200' :
              'border-yellow-200'
            }`}>
              {/* Header */}
              <div className={`px-5 py-4 flex justify-between items-start border-b ${
                f.status === 'flagged' ? 'bg-red-50 border-red-100' :
                f.status === 'paid' ? 'bg-green-50 border-green-100' :
                f.status === 'rejected' ? 'bg-gray-50 border-gray-100' :
                'bg-yellow-50 border-yellow-100'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-800 text-base">{f.user_name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      f.status === 'flagged' ? 'bg-red-100 text-red-700' :
                      f.status === 'paid' ? 'bg-green-100 text-green-700' :
                      f.status === 'rejected' ? 'bg-gray-200 text-gray-600' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {f.status === 'pending' ? '⏳ PENDING REVIEW' :
                       f.status === 'flagged' ? '⚠️ FRAUD FLAGGED' :
                       f.status === 'paid' ? '✅ APPROVED' : '❌ REJECTED'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {f.user_role?.replace(/_/g, ' ')} • {f.city}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(f.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-xl font-black ${
                    f.fraud_flagged ? 'text-red-700' : 'text-green-700'
                  }`}>
                    {f.fraud_flagged ? `⚠️ ${(f.fraud_score * 100).toFixed(0)}%` : '✅ Clean'}
                  </div>
                  <p className="text-xs text-gray-400">Fraud Score</p>
                </div>
              </div>

              {/* Supporting data */}
              <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Claim ID</p>
                  <p className="font-bold text-gray-800">#{f.claim_id}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Payout (Estimated)</p>
                  <p className="font-bold text-gray-800">₹{f.payout_amount?.toFixed(0)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Trigger Event</p>
                  <p className="font-semibold text-gray-700">{f.trigger_event?.replace(/_/g, ' ')}</p>
                </div>
                <div className={`rounded-xl p-3 ${f.fraud_flagged ? 'bg-red-50' : 'bg-green-50'}`}>
                  <p className="text-gray-400 text-xs">ML Verdict</p>
                  <p className={`font-medium text-xs mt-0.5 ${f.fraud_flagged ? 'text-red-700' : 'text-green-700'}`}>
                    {f.fraud_flagged ? getFraudReason(f.fraud_score) : '✅ Passed all 4 fraud checks'}
                  </p>
                </div>
              </div>

              {/* Worker description */}
              {f.description && (
                <div className="px-5 pb-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-xs text-blue-400 font-medium mb-1">📝 Worker's Description</p>
                    <p className="text-sm text-blue-800">{f.description}</p>
                  </div>
                </div>
              )}

              {/* Audit trail */}
              <div className="px-5 pb-3">
                <p className="text-xs text-gray-400">
                  Claim #{f.claim_id} • Decision logged to audit trail and reflected on worker's dashboard & alerts
                </p>
              </div>

              {/* Actions — available for both pending and flagged claims */}
              {(f.status === 'flagged' || f.status === 'pending') && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-400 mb-3">Admin decision — worker will be notified immediately via Alerts:</p>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {/* Reject */}
                    <button
                      onClick={() => handleReview(f.claim_id, 'rejected')}
                      disabled={reviewingId === f.claim_id}
                      className="px-4 py-2.5 bg-white border-2 border-red-300 text-red-700 rounded-xl text-sm font-bold hover:bg-red-50 transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {reviewingId === f.claim_id ? '⏳' : '❌'} Reject
                    </button>
                    {/* Flag as Fraud — only show if not already ML-flagged */}
                    {!f.fraud_flagged && (
                      <button
                        onClick={() => handleReview(f.claim_id, 'flagged')}
                        disabled={reviewingId === f.claim_id}
                        className="px-4 py-2.5 bg-white border-2 border-orange-400 text-orange-700 rounded-xl text-sm font-bold hover:bg-orange-50 transition-all disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {reviewingId === f.claim_id ? '⏳' : '⚠️'} Flag as Fraud
                      </button>
                    )}
                    {/* Approve & Pay */}
                    <button
                      onClick={() => handleReview(f.claim_id, 'approved')}
                      disabled={reviewingId === f.claim_id}
                      className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {reviewingId === f.claim_id ? '⏳ Processing...' : '✅ Approve & Pay'}
                    </button>
                  </div>
                </div>
              )}
              {f.status !== 'flagged' && f.status !== 'pending' && (
                <div className="px-5 pb-4 border-t border-gray-100 pt-3">
                  <p className={`text-sm font-medium text-center ${
                    f.status === 'paid' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {f.status === 'paid'
                      ? '✅ Approved — payout sent to worker via UPI'
                      : '❌ Rejected — worker has been notified'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TRIGGER TAB */}
      {tab === 'trigger' && (
        <div className="max-w-lg space-y-5">
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <h3 className="font-bold text-yellow-800">⚡ Parametric Event Trigger</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Simulate a weather/disruption event to trigger automatic payouts for all active policy holders in a city.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
              <select value={triggerForm.event_type}
                onChange={e => setTriggerForm(f => ({ ...f, event_type: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {TRIGGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Value</label>
                <input type="number" value={triggerForm.trigger_value}
                  onChange={e => setTriggerForm(f => ({ ...f, trigger_value: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <select value={triggerForm.city}
                  onChange={e => setTriggerForm(f => ({ ...f, city: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'all'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom Message (optional)</label>
              <input type="text" value={triggerForm.message}
                onChange={e => setTriggerForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Describe the event..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <button onClick={handleTrigger} disabled={triggering}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">
              {triggering ? '⏳ Triggering...' : '🚨 Trigger Event & Process Payouts'}
            </button>
          </div>

          {triggerResult && (
            <div className={`rounded-2xl p-5 border ${triggerResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              {triggerResult.success ? (
                <div>
                  <p className="font-bold text-green-800 mb-2">✅ Event Triggered Successfully!</p>
                  <div className="text-sm space-y-1 text-green-700">
                    <p>Workers affected: <strong>{triggerResult.data.workers_affected}</strong></p>
                    <p>Payouts created: <strong>{triggerResult.data.payouts_created}</strong></p>
                    <p>Fraud flagged: <strong>{triggerResult.data.fraud_flagged}</strong></p>
                    <p>Total payout: <strong>₹{triggerResult.data.total_payout_amount?.toFixed(0)}</strong></p>
                  </div>
                </div>
              ) : (
                <p className="text-red-700">⚠️ {triggerResult.error}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {tab === 'notifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-700">🔔 System Notifications ({notifications.length})</h3>
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
              {notifications.filter(n => !n.is_read).length} unread
            </span>
          </div>
          {notifications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <p className="text-4xl mb-2">🔕</p>
              <p className="text-gray-500">No system notifications yet</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`bg-white border rounded-2xl p-4 shadow-sm ${
                n.severity === 'critical' ? 'border-red-200' : 'border-gray-100'
              } ${!n.is_read ? 'border-l-4 border-l-blue-500' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">
                      {n.type === 'rain' ? '🌧️' : n.type === 'flood' ? '🌊' : n.type === 'aqi' ? '😷' :
                       n.type === 'heat' ? '🌡️' : n.type === 'admin' ? '🚨' : n.type === 'traffic' ? '🚗' : '🔔'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-800 text-sm">{n.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          n.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>{n.severity}</span>
                        {!n.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-gray-400">Worker: <strong className="text-gray-600">{n.user_name}</strong></span>
                        <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
