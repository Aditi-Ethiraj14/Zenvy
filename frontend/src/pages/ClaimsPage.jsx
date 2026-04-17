// ============================================================
// ClaimsPage.jsx — File Manual Claim with i18n
// ============================================================

import React, { useState, useEffect } from 'react'
import { useAuth } from '../App.jsx'
import { useLang } from '../i18n.jsx'
import { getActivePolicy, fileClaim, getClaimsHistory } from '../api.js'

export default function ClaimsPage() {
  const { user }   = useAuth()
  const { t }      = useLang()

  const [policy, setPolicy]         = useState(null)
  const [history, setHistory]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult]         = useState(null)
  const [description, setDesc]      = useState('')

  useEffect(() => {
    Promise.all([
      getActivePolicy(user.user_id).catch(() => null),
      getClaimsHistory(user.user_id).catch(() => ({ data: [] })),
    ]).then(([pRes, cRes]) => {
      setPolicy(pRes?.data || null)
      setHistory(cRes.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!policy) return
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fileClaim(user.user_id, {
        policy_id: policy.id,
        description,
        claim_type: 'manual'
      })
      setResult({ success: true, claim: res.data })
      setDesc('')
      // Refresh history
      const cRes = await getClaimsHistory(user.user_id)
      setHistory(cRes.data || [])
    } catch (e) {
      setResult({ success: false, error: e.response?.data?.detail || 'Claim failed' })
    } finally {
      setSubmitting(false)
    }
  }

  const STATUS_BADGE = {
    paid:     'bg-green-100 text-green-700',
    flagged:  'bg-red-100 text-red-700',
    rejected: 'bg-gray-100 text-gray-600',
    pending:  'bg-yellow-100 text-yellow-700',
  }

  if (loading) return <div className="text-center py-12 text-gray-400">⏳ {t('loading')}</div>

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800">📝 {t('fileClaim')}</h1>

      {!policy ? (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-bold text-orange-700">{t('noPolicy')}</p>
          <p className="text-orange-600 text-sm mt-1">You need an active policy to file a claim.</p>
        </div>
      ) : (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
            <p className="font-medium text-blue-800">Active Policy #{policy.id}</p>
            <p className="text-blue-600">Coverage: ₹{policy.coverage_amount?.toLocaleString()} • Risk: {policy.risk_level}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-1">Manual Income Loss Claim</h3>
            <p className="text-sm text-gray-500 mb-4">
              Use this for disruptions not auto-triggered by weather.
              4-layer fraud detection will run automatically.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('describe')}
                </label>
                <textarea value={description} onChange={e => setDesc(e.target.value)}
                  rows={4} required
                  placeholder="E.g., Civic strike blocked all deliveries in my area on 15th March..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700">
                <strong>Note:</strong> Claims go through 4-layer fraud detection:
                GPS verification · Duplicate check · Frequency analysis · Weather consistency
              </div>

              <button type="submit" disabled={submitting || !description.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">
                {submitting ? '⏳ Processing claim...' : `📤 ${t('submitClaim')}`}
              </button>
            </form>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-2xl p-6 border ${
              result.success ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'
            }`}>
              {result.success ? (
                <>
                  {result.claim.status === 'flagged' ? (
                    <>
                      <h3 className="font-bold text-lg text-orange-800 mb-2">⚠️ Claim Flagged for Review</h3>
                      <p className="text-orange-700 text-sm mb-3">
                        Our 4-layer fraud detection flagged this claim (score: {((result.claim.fraud_score || 0) * 100).toFixed(0)}%).
                        An admin will review it within 24–48 hours. You'll be notified via Alerts.
                      </p>
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-700">
                        ℹ️ Estimated payout if approved: <strong>₹{result.claim.payout_amount?.toFixed(0)}</strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="font-bold text-lg text-blue-800 mb-2">📋 Claim Submitted for Review</h3>
                      <p className="text-blue-700 text-sm mb-3">
                        Your manual claim has been submitted and is pending admin review.
                        Manual claims require admin approval before payout is processed. You'll be notified via Alerts.
                      </p>
                      <div className="bg-white border border-blue-200 rounded-xl p-4 text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Claim ID</span>
                          <span className="font-mono font-bold">#{result.claim.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Status</span>
                          <span className="font-bold text-yellow-600">⏳ PENDING REVIEW</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Estimated Payout</span>
                          <span className="font-bold text-blue-700">₹{result.claim.payout_amount?.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Fraud Check</span>
                          <span className="text-green-600 font-medium">✅ Passed ({((result.claim.fraud_score || 0) * 100).toFixed(0)}%)</span>
                        </div>
                      </div>
                      <p className="text-xs text-blue-500 mt-3">
                        ⚡ Parametric weather-triggered payouts are instant. Manual claims need admin verification.
                      </p>
                    </>
                  )}
                </>
              ) : (
                <p className="text-red-700 font-medium">⚠️ {result.error}</p>
              )}
            </div>
          )}
        </>
      )}

      {/* Previous Claims */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-3">📜 Your Previous Claims</h3>
          <div className="space-y-2">
            {history.slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-gray-800">{c.trigger_event?.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_BADGE[c.status] || 'bg-gray-100 text-gray-600'}`}>
                    {c.status}
                  </span>
                  <span className={`font-bold ${c.status === 'paid' ? 'text-green-700' : 'text-gray-500'}`}>
                    ₹{c.payout_amount?.toFixed(0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
