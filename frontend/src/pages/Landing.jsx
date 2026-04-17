import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAdminStats } from '../api.js'

const FEATURES = [
  { icon: '🌧️', title: 'Weather Triggers', desc: 'Auto-payouts when rain, flood, or heat thresholds are crossed' },
  { icon: '😷', title: 'AQI Protection', desc: 'Hazardous air quality that prevents outdoor work is covered' },
  { icon: '🚗', title: 'Traffic Disruption', desc: 'Severe traffic disruptions blocking delivery routes' },
  { icon: '🚧', title: 'Zone Restrictions', desc: 'Government lockdowns and area restrictions covered' },
  { icon: '🤖', title: 'AI Risk Engine', desc: 'RADAR ML model: XGBoost + Random Forest ensemble' },
  { icon: '⚡', title: 'Instant Payouts', desc: 'UPI transfer in seconds — no paperwork, no waiting' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Sign Up & Set Role', desc: 'Tell us your delivery type — food, grocery, or e-commerce' },
  { step: '02', title: 'Buy Weekly Policy', desc: 'AI calculates your risk and shows your weekly premium (₹10–25)' },
  { step: '03', title: 'Event is Monitored', desc: 'Real-world disruptions are tracked 24/7 by our AI engine' },
  { step: '04', title: 'Automatic Payout', desc: 'When a threshold is crossed, your UPI receives funds instantly' },
]

function AnimatedCounter({ target, prefix = '', suffix = '' }) {
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    if (target === 0) return
    const step = target / 60
    let val = 0
    const timer = setInterval(() => {
      val += step
      if (val >= target) { setCurrent(target); clearInterval(timer) }
      else setCurrent(Math.floor(val))
    }, 16)
    return () => clearInterval(timer)
  }, [target])
  return <span>{prefix}{current.toLocaleString()}{suffix}</span>
}

export default function Landing() {
  const [stats, setStats] = useState({ 
    total_payout: 425000, 
    total_claims: 1250, 
    active_policies: 3400 
  })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getAdminStats()
      .then(res => {
        if (res.data) {
          setStats({
            total_payout: res.data.total_payout,
            total_claims: res.data.total_claims,
            active_policies: res.data.active_policies
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0d1535] to-[#0f172a] text-white overflow-hidden font-sans">
      
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[100px] animate-pulse" style={{animationDelay:'1s'}} />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{animationDelay:'2s'}} />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-black text-white tracking-tight">⚡ ZENVY</span>
          <span className="hidden sm:inline-block text-xs bg-blue-500/20 border border-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full font-medium ml-2">AI-Powered</span>
        </div>
        <div className="flex gap-3 items-center">
          <Link to="/login" className="px-5 py-2 rounded-xl text-blue-200 hover:text-white transition-colors font-medium text-sm">
            Log In
          </Link>
          <Link to="/signup" className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 transform hover:-translate-y-0.5">
            Get Started →
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 pt-16 pb-20">
        <div className="max-w-5xl mx-auto text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-400/30 bg-blue-500/10 backdrop-blur-sm text-blue-200 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Parametric AI Insurance — India's First for Gig Workers
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-black leading-[1.05] mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-blue-400">
              Income Protection
            </span>
            <br />
            <span className="text-white">When You Need It Most</span>
          </h1>
          
          <p className="text-lg md:text-xl text-blue-200/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            Parametric insurance that pays out <strong className="text-white">automatically in seconds</strong> — triggered by real-world disruptions like extreme rain, hazardous AQI, traffic, and zone restrictions.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link to="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-500 transition-all shadow-[0_0_40px_-8px_rgba(59,130,246,0.7)] hover:shadow-[0_0_60px_-8px_rgba(59,130,246,0.9)] transform hover:-translate-y-1">
              🛡️ Protect My Income
            </Link>
            <Link to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/5 text-white font-bold text-lg hover:bg-white/10 backdrop-blur-md transition-all border border-white/10 transform hover:-translate-y-1">
              📊 Worker Dashboard
            </Link>
          </div>

          {/* Live Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-7 hover:bg-white/10 transition-all hover:border-blue-500/30 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.2)]">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-4xl mb-3">🛡️</div>
              <p className="text-blue-300 font-medium text-sm mb-2">Protected Earnings Paid Out</p>
              <p className="text-3xl md:text-4xl font-black text-white">
                {loaded ? <AnimatedCounter target={stats.total_payout} prefix="₹" /> : '₹...'}
              </p>
              <p className="text-xs text-green-400 mt-2 font-medium">↑ Paid directly to workers via UPI</p>
            </div>

            <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-7 hover:bg-white/10 transition-all hover:border-purple-500/30 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.2)]">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-4xl mb-3">⚡</div>
              <p className="text-blue-300 font-medium text-sm mb-2">Claims Processed</p>
              <p className="text-3xl md:text-4xl font-black text-white">
                {loaded ? <AnimatedCounter target={stats.total_claims} /> : '...'}
              </p>
              <p className="text-xs text-blue-300 mt-2 font-medium">Zero paperwork required</p>
            </div>

            <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-7 hover:bg-white/10 transition-all hover:border-cyan-500/30 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.2)]">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-4xl mb-3">👥</div>
              <p className="text-blue-300 font-medium text-sm mb-2">Active Policies</p>
              <p className="text-3xl md:text-4xl font-black text-white">
                {loaded ? <AnimatedCounter target={stats.active_policies} /> : '...'}
              </p>
              <p className="text-xs text-blue-300 mt-2 font-medium">Workers currently protected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">What triggers your payout?</h2>
          <p className="text-blue-200/70 max-w-xl mx-auto">Pre-defined parametric thresholds — when crossed, payouts happen automatically. No claims. No waiting.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {FEATURES.map((f, i) => (
            <div key={i} className="group bg-white/3 backdrop-blur-sm border border-white/8 rounded-2xl p-6 hover:bg-white/8 hover:border-blue-500/30 transition-all">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-blue-200/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it Works */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">How it works</h2>
          <p className="text-blue-200/70 max-w-xl mx-auto">Get protected in under 2 minutes</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {HOW_IT_WORKS.map((h, i) => (
            <div key={i} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-lg mx-auto mb-4">
                {h.step}
              </div>
              <h3 className="font-bold text-white mb-2 text-sm">{h.title}</h3>
              <p className="text-xs text-blue-200/60 leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-blue-600/20 to-indigo-600/20 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-12">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Start protecting your income today</h2>
          <p className="text-blue-200/70 mb-8 max-w-lg mx-auto">Premiums start at just ₹10/week. That's less than a chai. Sign up in 30 seconds.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30 transform hover:-translate-y-1">
              🚀 Get Started Free
            </Link>
            <Link to="/login" className="px-8 py-4 rounded-2xl bg-white/10 text-white font-bold text-lg hover:bg-white/15 transition-all border border-white/10 transform hover:-translate-y-1">
              Already have account →
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-white/5 py-8">
        <div className="container mx-auto px-6 text-center text-blue-200/40 text-sm">
          <p>⚡ ZENVY — Parametric Income Insurance for India's Gig Economy</p>
          <p className="mt-1 text-xs">Powered by RADAR AI • XGBoost + Random Forest Ensemble</p>
        </div>
      </div>
    </div>
  )
}
