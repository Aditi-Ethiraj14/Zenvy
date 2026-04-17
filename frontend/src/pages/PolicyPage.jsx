// ============================================================
// PolicyPage.jsx — Buy Policy with UPI Payment Simulation
// ============================================================

import React, { useState, useEffect } from 'react'
import { useAuth } from '../App.jsx'
import { useLang } from '../i18n.jsx'
import { getWeatherRisk, getActivePolicy, buyPolicy, getPolicyHistory } from '../api.js'
import RiskBadge from '../components/RiskBadge.jsx'

// UPI payment stages
const UPI_STAGE = { IDLE: 'idle', ENTER: 'enter', VERIFYING: 'verifying', VERIFIED: 'verified', PAYING: 'paying', SUCCESS: 'success', FAILED: 'failed' }

function UpiReceipt({ policy, premium, upiId, onDone }) {
  const txnId = `ZENVY${Date.now().toString().slice(-10)}${Math.random().toString(36).slice(2,6).toUpperCase()}`
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in">
        {/* Green header */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 pt-8 pb-10 text-white text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-9 h-9 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-100 text-sm font-medium">Payment Successful</p>
          <p className="text-4xl font-black mt-1">₹{premium}</p>
          <p className="text-green-200 text-xs mt-1">Weekly Premium — ZENVY Income Protection</p>
        </div>

        {/* Receipt body */}
        <div className="px-6 py-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">UPI ID</span>
            <span className="font-mono font-medium text-gray-800">{upiId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Transaction ID</span>
            <span className="font-mono text-xs text-gray-700">{txnId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date & Time</span>
            <span className="text-gray-700">{new Date().toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Paid To</span>
            <span className="text-gray-700 font-medium">ZENVY Insurance</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Coverage</span>
            <span className="text-green-700 font-bold">₹5,000 for 7 days</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full text-xs">✅ SUCCESS</span>
          </div>

          <div className="border-t border-gray-100 pt-3 mt-3 bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
            🛡️ Your income is now protected. Payouts trigger automatically when disruption thresholds are crossed.
          </div>
        </div>

        <div className="px-6 pb-6">
          <button onClick={onDone}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all">
            Done ✓
          </button>
        </div>
      </div>
    </div>
  )
}

function UpiPaymentFlow({ premium, onSuccess, onCancel }) {
  const { t } = useLang()
  const [stage, setStage] = useState(UPI_STAGE.ENTER)
  const [upiId, setUpiId] = useState('')
  const [error, setError] = useState('')

  const isValidUpi = upiId.match(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/)

  const handleVerify = () => {
    if (!isValidUpi) { setError('Please enter a valid UPI ID (e.g. name@upi)'); return }
    setError('')
    setStage(UPI_STAGE.VERIFYING)
    // Simulate UPI verification (1.5s)
    setTimeout(() => setStage(UPI_STAGE.VERIFIED), 1500)
  }

  const handlePay = () => {
    setStage(UPI_STAGE.PAYING)
    // Simulate payment processing (2s)
    setTimeout(() => setStage(UPI_STAGE.SUCCESS), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white flex items-center justify-between">
          <div>
            <p className="font-bold text-base">Pay via UPI</p>
            <p className="text-blue-200 text-xs">ZENVY Income Insurance</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black">₹{premium}</p>
            <p className="text-blue-200 text-xs">Weekly Premium</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* UPI ID Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('upiId')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={upiId}
                onChange={e => { setUpiId(e.target.value); setError('') }}
                placeholder={t('enterUpi')}
                disabled={stage !== UPI_STAGE.ENTER}
                className={`w-full border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 transition-all ${
                  stage === UPI_STAGE.VERIFIED
                    ? 'border-green-400 bg-green-50 text-green-800 focus:ring-green-400'
                    : error
                    ? 'border-red-400 bg-red-50 focus:ring-red-400'
                    : 'border-gray-200 focus:ring-blue-500'
                }`}
              />
              {stage === UPI_STAGE.VERIFIED && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 font-bold text-sm flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  Verified
                </div>
              )}
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

            {/* Quick UPI suggestions */}
            {stage === UPI_STAGE.ENTER && (
              <div className="mt-2 flex flex-wrap gap-2">
                {['name@upi', 'id@okicici', 'id@paytm', 'id@ybl'].map(s => (
                  <button key={s} onClick={() => setUpiId(s)}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-lg text-gray-600 transition-all font-mono">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Verification status */}
          {stage === UPI_STAGE.VERIFYING && (
            <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="text-sm text-yellow-700 font-medium">Verifying UPI ID with bank...</span>
            </div>
          )}

          {stage === UPI_STAGE.VERIFIED && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium flex items-center gap-2">
              <span className="text-xl">✅</span>
              <div>
                <p className="font-bold">{t('upiVerified')}</p>
                <p className="text-xs text-green-600">{upiId}</p>
              </div>
            </div>
          )}

          {stage === UPI_STAGE.PAYING && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-blue-700 font-medium">{t('processing')}</p>
              <p className="text-xs text-blue-500 mt-1">Link sent to UPI ID — please approve in your UPI app</p>
            </div>
          )}

          {/* Coverage summary */}
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
            <div className="flex justify-between"><span>Premium</span><span className="font-bold text-gray-800">₹{premium}/week</span></div>
            <div className="flex justify-between"><span>Coverage</span><span className="font-bold text-green-700">₹5,000</span></div>
            <div className="flex justify-between"><span>Duration</span><span className="font-bold text-gray-800">7 days</span></div>
            <div className="flex justify-between"><span>Payouts</span><span className="font-bold text-blue-700">Instant UPI</span></div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-all">
              {t('cancel')}
            </button>

            {stage === UPI_STAGE.ENTER && (
              <button onClick={handleVerify} disabled={!upiId.trim()}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50">
                {t('verifyUpi')}
              </button>
            )}

            {stage === UPI_STAGE.VERIFIED && (
              <button onClick={handlePay}
                className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-all">
                {t('payNow')} ₹{premium}
              </button>
            )}

            {stage === UPI_STAGE.PAYING && (
              <button disabled
                className="flex-1 py-3 rounded-xl bg-blue-400 text-white text-sm font-bold opacity-70 cursor-not-allowed">
                ⏳ {t('processing')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Receipt overlay when success */}
      {stage === UPI_STAGE.SUCCESS && (
        <UpiReceipt
          premium={premium}
          upiId={upiId}
          onDone={() => onSuccess(upiId)}
        />
      )}
    </div>
  )
}

export default function PolicyPage() {
  const { user }  = useAuth()
  const { t }     = useLang()

  const [weather, setWeather]   = useState(null)
  const [policy, setPolicy]     = useState(null)
  const [history, setHistory]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [city, setCity]         = useState(user?.city || 'Mumbai')
  const [showUpi, setShowUpi]   = useState(false)
  const [msg, setMsg]           = useState('')

  useEffect(() => { loadData() }, [city])

  const loadData = async () => {
    setLoading(true)
    try {
      const [wRes, hRes] = await Promise.all([
        getWeatherRisk(city, user.role),
        getPolicyHistory(user.user_id)
      ])
      setWeather(wRes.data)
      setHistory(hRes.data || [])
      try {
        const pRes = await getActivePolicy(user.user_id)
        setPolicy(pRes.data)
      } catch { setPolicy(null) }
    } finally {
      setLoading(false)
    }
  }

  // Called after successful UPI payment
  const handleUpiSuccess = async (upiId) => {
    setShowUpi(false)
    setMsg('')
    const risk = weather?.risk
    if (!risk) return
    try {
      await buyPolicy(user.user_id, {
        risk_score: risk.risk_score,
        risk_level: risk.risk_level,
        weekly_premium: risk.weekly_premium,
        coverage_amount: 5000
      })
      setMsg(`✅ Policy activated! Paid ₹${risk.weekly_premium} via ${upiId}`)
      loadData()
    } catch (e) {
      setMsg('⚠️ ' + (e.response?.data?.detail || 'Policy activation failed'))
    }
  }

  const risk     = weather?.risk
  const features = weather?.weather

  return (
    <div className="space-y-6">
      {showUpi && risk && (
        <UpiPaymentFlow
          premium={risk.weekly_premium}
          onSuccess={handleUpiSuccess}
          onCancel={() => setShowUpi(false)}
        />
      )}

      <h1 className="text-2xl font-bold text-gray-800">📋 {t('incomePolicy')}</h1>

      {/* City selector */}
      <div className="flex gap-2 flex-wrap">
        {['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'].map(c => (
          <button key={c} onClick={() => setCity(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              city === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
            }`}>{c}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">⏳ {t('loading')}</div>
      ) : (
        <>
          {msg && (
            <div className={`px-4 py-3 rounded-xl text-sm border ${
              msg.startsWith('✅') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
            }`}>{msg}</div>
          )}

          {risk && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-800">🧠 {t('riskAssessment')}</h3>
                  <p className="text-sm text-gray-500">AI-powered prediction for {city}</p>
                </div>
                <RiskBadge level={risk.risk_level} score={risk.risk_score} />
              </div>

              {/* Score bar */}
              <div className="mb-5">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Risk Score</span><span>{(risk.risk_score * 100).toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${
                    risk.risk_score < 0.25 ? 'bg-green-500' : risk.risk_score < 0.50 ? 'bg-yellow-500' :
                    risk.risk_score < 0.75 ? 'bg-orange-500' : 'bg-red-600'
                  }`} style={{ width: `${risk.risk_score * 100}%` }} />
                </div>
              </div>

              {/* Ensemble scores */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-blue-50 rounded-xl p-3 text-sm">
                  <p className="text-gray-500">XGBoost (70%)</p>
                  <p className="font-bold text-blue-700 text-lg">{(risk.xgboost_score * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-sm">
                  <p className="text-gray-500">Random Forest (30%)</p>
                  <p className="font-bold text-green-700 text-lg">{(risk.rf_score * 100).toFixed(1)}%</p>
                </div>
              </div>

              {/* Weather inputs */}
              {features && (
                <div className="grid grid-cols-3 gap-2 text-sm bg-gray-50 rounded-xl p-3 mb-5">
                  <div className="text-center"><p className="text-gray-500">{t('rain')}</p><p className="font-bold">{features.rainfall_mm?.toFixed(1)}mm</p></div>
                  <div className="text-center"><p className="text-gray-500">{t('aqi')}</p><p className="font-bold">{features.aqi?.toFixed(0)}</p></div>
                  <div className="text-center"><p className="text-gray-500">{t('temperature')}</p><p className="font-bold">{features.temperature?.toFixed(0)}°C</p></div>
                  <div className="text-center"><p className="text-gray-500">Humidity</p><p className="font-bold">{features.humidity?.toFixed(0)}%</p></div>
                  <div className="text-center"><p className="text-gray-500">{t('windSpeed')}</p><p className="font-bold">{features.wind_speed?.toFixed(0)} km/h</p></div>
                  <div className="text-center"><p className="text-gray-500">Monsoon</p><p className="font-bold">{features.is_monsoon_season ? 'Yes' : 'No'}</p></div>
                </div>
              )}

              {/* Feature importance */}
              {risk.feature_importance && (
                <div className="mb-5">
                  <p className="text-sm font-medium text-gray-600 mb-2">{t('riskFactors')}:</p>
                  <div className="space-y-1.5">
                    {Object.entries(risk.feature_importance).slice(0, 5).map(([feat, val]) => (
                      <div key={feat} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500 w-40 truncate">{feat}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, val * 100 * 3)}%` }} />
                        </div>
                        <span className="text-gray-400 w-12 text-right">{(val * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Premium + Buy section */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">{t('weeklyPremium')}</p>
                    <p className="text-3xl font-black text-blue-700">₹{risk.weekly_premium}</p>
                    <p className="text-xs text-gray-400">Covers ₹5,000 income loss</p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>Coverage: 7 days</p>
                    <p className="mt-1 text-xs">Payout = Income × Severity × Duration</p>
                  </div>
                </div>

                {policy ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <p className="text-green-700 font-bold">✅ {t('alreadyProtected')}</p>
                    <p className="text-green-600 text-sm mt-1">Risk: {policy.risk_level} • Premium: ₹{policy.weekly_premium}/week</p>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowUpi(true)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 transform hover:-translate-y-0.5"
                  >
                    ⚡ {t('buyWeeklyPolicy')} — ₹{risk.weekly_premium}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Policy History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-gray-800 mb-3">📜 {t('policyHistory')}</h3>
              <div className="space-y-2">
                {history.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>{p.status}</span>
                      <RiskBadge level={p.risk_level} />
                    </div>
                    <div className="text-right text-gray-500">
                      <p className="font-medium">₹{p.weekly_premium}/wk</p>
                      <p className="text-xs">{new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
