// ============================================================
// Login.jsx — Login Page
// ============================================================

import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login as loginAPI } from '../api.js'
import { useAuth } from '../App.jsx'

export default function Login() {
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await loginAPI({ email, password })
      login({ ...res.data, access_token: res.data.access_token })
      // Redirect admin to admin dashboard
      if (res.data.role === 'admin') navigate('/app/admin')
      else navigate('/app/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (e, p) => { setEmail(e); setPassword(p) }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo — links back to landing page */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
            <h1 className="text-5xl font-black text-white">⚡ ZENVY</h1>
          </Link>
          <p className="text-blue-200 mt-2">AI-Powered Income Insurance for Gig Workers</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Welcome back 👋</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••" required />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">
              {loading ? '⏳ Logging in...' : '→ Login'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-3 text-center font-medium">DEMO LOGINS (click to fill)</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '🍔 Food',   email: 'food@test.com' },
                { label: '🛒 Grocery', email: 'grocery@test.com' },
                { label: '📦 Ecomm',  email: 'ecommerce@test.com' },
                { label: '🛠️ Admin',  email: 'admin@test.com' },
              ].map(d => (
                <button key={d.email} type="button" onClick={() => quickLogin(d.email, '1234')}
                  className="text-xs bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-2 text-gray-600 hover:text-blue-600 transition-all">
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            No account? <Link to="/signup" className="text-blue-600 font-semibold hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
