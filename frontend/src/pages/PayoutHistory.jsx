// ============================================================
// PayoutHistory.jsx — Full Transaction History + Receipt Modal
// ============================================================
import React, { useState, useEffect } from 'react'
import { useAuth } from '../App.jsx'
import { useLang } from '../i18n.jsx'
import { getClaimsHistory, getPolicyHistory } from '../api.js'

const STATUS_BADGE = {
  paid:    'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  flagged: 'bg-red-100 text-red-700',
  rejected:'bg-gray-100 text-gray-600',
  active:  'bg-blue-100 text-blue-700',
  expired: 'bg-slate-100 text-slate-600',
  approved:'bg-green-100 text-green-700',
}

const EVENT_LABELS = {
  rain_15mm:           '🌧️ Rain (15mm+)',
  flood_40mm:          '🌊 Flood (40mm+)',
  aqi_300:             '😷 AQI (300+)',
  heat_43:             '🌡️ Heat (43°C+)',
  traffic_80:          '🚗 Traffic Disruption',
  zone_restriction_1:  '🚧 Zone Restriction',
  manual_claim:        '📝 Manual Claim',
  admin:               '🚨 Admin Trigger',
  premium_payment:     '💳 Premium Payment',
}

const STATUS_ICON = {
  paid:    '✅',
  flagged: '⚠️',
  rejected:'❌',
  pending: '⏳',
  active:  '🟢',
  expired: '⬜',
  approved:'✅',
}

function ReceiptModal({ item, onClose }) {
  const isPaid = item.status === 'paid' || item.status === 'approved'
  const isClaim = item.type === 'claim'
  const txnId = item.upi_transaction_id || (item.type === 'premium' ? `PREM${item.id}${Date.now()}` : null)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className={`px-6 pt-7 pb-9 text-white text-center ${
          isPaid ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
          item.status === 'flagged' ? 'bg-gradient-to-br from-orange-500 to-red-500' :
          item.status === 'rejected' ? 'bg-gradient-to-br from-gray-500 to-gray-700' :
          'bg-gradient-to-br from-yellow-500 to-orange-500'
        }`}>
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
            {STATUS_ICON[item.status] || '📄'}
          </div>
          <p className="text-white/80 text-sm">{isClaim ? 'Insurance Payout' : 'Premium Payment'}</p>
          <p className="text-4xl font-black mt-1">
            {isClaim ? '+' : ''}₹{Math.abs(item.payout_amount || item.weekly_premium || 0).toFixed(0)}
          </p>
          <p className="text-white/70 text-xs mt-1">
            {EVENT_LABELS[item.trigger_event] || item.trigger_event || 'Policy Premium'}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3 text-sm">
          {txnId && (
            <div className="flex justify-between">
              <span className="text-gray-500">Transaction ID</span>
              <span className="font-mono text-xs text-gray-700 max-w-[160px] truncate">{txnId}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className={`font-bold px-2 py-0.5 rounded-full text-xs uppercase ${STATUS_BADGE[item.status] || 'bg-gray-100 text-gray-600'}`}>
              {item.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Type</span>
            <span className="text-gray-700">{isClaim ? item.claim_type : 'Premium'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span className="text-gray-700">{item.date?.toLocaleString('en-IN') || '—'}</span>
          </div>
          {item.paid_at && (
            <div className="flex justify-between">
              <span className="text-gray-500">Paid At</span>
              <span className="text-gray-700">{new Date(item.paid_at).toLocaleString('en-IN')}</span>
            </div>
          )}
          {isClaim && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500">Severity</span>
                <span className="text-gray-700">{((item.severity || 0) * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Duration</span>
                <span className="text-gray-700">{item.duration_days} day(s)</span>
              </div>
            </>
          )}
          {item.fraud_flagged && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-700 text-xs font-medium">⚠️ Fraud Flag</p>
              <p className="text-red-600 text-xs mt-1">Score: {((item.fraud_score || 0) * 100).toFixed(0)}% — Pending admin review</p>
            </div>
          )}
          {isClaim && item.description && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs mb-1">Description</p>
              <p className="text-gray-700 text-xs">{item.description}</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <button onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-all text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// End-to-end flow indicator
function FlowTimeline({ transactions }) {
  const hasClaim = transactions.some(t => t.type === 'claim')
  const hasPaid  = transactions.some(t => t.status === 'paid')
  const haFlag   = transactions.some(t => t.fraud_flagged)

  const steps = [
    { label: 'Signed Up',     done: true,  icon: '👤' },
    { label: 'Got Policy',    done: transactions.some(t => t.type === 'premium'), icon: '📋' },
    { label: 'Trigger Fired', done: hasClaim, icon: '⚡' },
    { label: 'Claim Created', done: hasClaim, icon: '📝' },
    { label: 'Fraud Check',   done: hasClaim, icon: '🔍', warn: haFlag },
    { label: 'Approved',      done: hasPaid, icon: '✅' },
    { label: 'Payout Sent',   done: hasPaid, icon: '💸' },
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-bold text-gray-800 mb-4">🔄 Your Journey</h3>
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1 min-w-[52px]">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                s.warn   ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-300' :
                s.done   ? 'bg-green-100 text-green-700 ring-2 ring-green-300' :
                           'bg-gray-100 text-gray-400'
              }`}>
                {s.icon}
              </div>
              <p className="text-xs text-center text-gray-500 leading-tight">{s.label}</p>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 min-w-[8px] ${
                steps[i + 1].done || s.done ? 'bg-green-300' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export default function PayoutHistory() {
  const { user }  = useAuth()
  const { t }     = useLang()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]           = useState(true)
  const [selected, setSelected]         = useState(null)
  const [filter, setFilter]             = useState('all')

  useEffect(() => {
    Promise.all([
      getClaimsHistory(user.user_id),
      getPolicyHistory(user.user_id)
    ])
    .then(([cRes, pRes]) => {
      const claims = (cRes.data || []).map(c => ({
        ...c, type: 'claim', date: new Date(c.created_at)
      }))
      const policies = (pRes.data || []).map(p => ({
        ...p,
        type: 'premium',
        trigger_event: 'premium_payment',
        payout_amount: -p.weekly_premium,
        date: new Date(p.created_at),
      }))
      setTransactions([...claims, ...policies].sort((a, b) => b.date - a.date))
    })
    .finally(() => setLoading(false))
  }, [])

  const claimsOnly  = transactions.filter(t => t.type === 'claim')
  const totalPaid   = claimsOnly.filter(c => c.status === 'paid').reduce((s, c) => s + c.payout_amount, 0)
  const pendingCount = claimsOnly.filter(c => c.status === 'flagged' || c.status === 'pending').length

  const filtered = filter === 'all'     ? transactions
                 : filter === 'claims'  ? transactions.filter(t => t.type === 'claim')
                 : filter === 'paid'    ? transactions.filter(t => t.status === 'paid')
                 : filter === 'flagged' ? transactions.filter(t => t.fraud_flagged)
                 : transactions.filter(t => t.type === 'premium')

  if (loading) return <div className="text-center py-12 text-gray-400">⏳ {t('loading')}</div>

  return (
    <div className="space-y-5">
      {selected && <ReceiptModal item={selected} onClose={() => setSelected(null)} />}

      <h1 className="text-2xl font-bold text-gray-800">💸 {t('transactions')}</h1>

      {/* Flow timeline */}
      <FlowTimeline transactions={transactions} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-black text-green-600">₹{totalPaid.toFixed(0)}</p>
          <p className="text-xs text-gray-500 mt-1">{t('totalPayouts')}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-black text-blue-600">{claimsOnly.filter(c => c.status === 'paid').length}</p>
          <p className="text-xs text-gray-500 mt-1">{t('approvedClaims')}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-black text-orange-500">{pendingCount}</p>
          <p className="text-xs text-gray-500 mt-1">Pending Review</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-black text-red-600">{claimsOnly.filter(c => c.fraud_flagged).length}</p>
          <p className="text-xs text-gray-500 mt-1">{t('flaggedClaims')}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all',     label: 'All' },
          { key: 'claims',  label: 'Claims' },
          { key: 'paid',    label: 'Paid' },
          { key: 'flagged', label: 'Flagged' },
          { key: 'premium', label: 'Premiums' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === f.key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-400'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500">No transactions for this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(tx => (
            <button
              key={`${tx.type}-${tx.id}`}
              onClick={() => setSelected(tx)}
              className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{STATUS_ICON[tx.status] || '📄'}</span>
                  <div>
                    <p className="font-bold text-gray-800">
                      {EVENT_LABELS[tx.trigger_event] || tx.trigger_event || 'Transaction'}
                    </p>
                    <p className="text-xs text-gray-400">{tx.date?.toLocaleString('en-IN')}</p>
                    {tx.description && (
                      <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{tx.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${STATUS_BADGE[tx.status] || 'bg-gray-100 text-gray-600'}`}>
                    {tx.status}
                  </span>
                  <span className="text-xs text-gray-400">{tx.type === 'claim' ? tx.claim_type : 'Premium'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">{tx.type === 'claim' ? 'Payout' : 'Premium Paid'}</span>
                <span className={`text-xl font-black ${tx.type === 'claim' && tx.status === 'paid' ? 'text-green-600' : 'text-gray-800'}`}>
                  {tx.type === 'claim' && tx.status === 'paid' ? '+' : ''}₹{Math.abs(tx.payout_amount || 0).toFixed(0)}
                </span>
              </div>

              {/* UPI receipt preview */}
              {tx.upi_transaction_id && (
                <div className="mt-3 bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-xs text-green-700 flex items-center justify-between">
                  <span>💳 {tx.upi_transaction_id}</span>
                  <span className="text-green-500 font-medium group-hover:underline">View Receipt →</span>
                </div>
              )}

              {tx.fraud_flagged && (
                <div className="mt-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-xs text-orange-700">
                  ⚠️ Fraud score: {((tx.fraud_score || 0) * 100).toFixed(0)}% — Pending review
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
