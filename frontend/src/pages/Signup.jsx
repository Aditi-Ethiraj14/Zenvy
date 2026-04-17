// ============================================================
// Signup.jsx — Worker Registration with Role Selection
// ============================================================

import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup as signupAPI } from '../api.js'
import { useAuth } from '../App.jsx'

const ROLES = [
  { value: 'food_delivery',     label: 'Food Delivery',       emoji: '🍔', desc: 'Swiggy, Zomato, etc.' },
  { value: 'grocery_delivery',  label: 'Grocery Delivery',    emoji: '🛒', desc: 'Blinkit, Zepto, etc.' },
  { value: 'ecommerce_delivery',label: 'E-commerce Delivery', emoji: '📦', desc: 'Amazon, Flipkart, etc.' },
]

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad']

// Approximate city coordinates for map
const CITY_COORDS = {
  Mumbai:    [19.0760, 72.8777],
  Delhi:     [28.7041, 77.1025],
  Bangalore: [12.9716, 77.5946],
  Chennai:   [13.0827, 80.2707],
  Hyderabad: [17.3850, 78.4867],
  Kolkata:   [22.5726, 88.3639],
  Pune:      [18.5204, 73.8567],
  Ahmedabad: [23.0225, 72.5714],
}

export default function Signup() {
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    role: 'food_delivery', city: 'Mumbai', years_exp: 1
  })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const coords = CITY_COORDS[form.city] || [19.0760, 72.8777]
      const res = await signupAPI({
        ...form,
        years_exp: Number(form.years_exp),
        lat: coords[0],
        lon: coords[1]
      })
      login({ ...res.data, access_token: res.data.access_token })
      navigate('/app/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
            <h1 className="text-4xl font-black text-white">⚡ ZENVY</h1>
          </Link>
          <p className="text-blue-200 mt-1">Protect Your Income Today</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Create Your Account</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection — most important step */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Select Your Work Role *</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(r => (
                  <button key={r.value} type="button"
                    onClick={() => set('role', r.value)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      form.role === r.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <div className="text-2xl">{r.emoji}</div>
                    <div className="text-xs font-medium mt-1">{r.label}</div>
                    <div className="text-xs text-gray-400">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <select value={form.city} onChange={e => set('city', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years Experience</label>
                <input type="number" value={form.years_exp} min="0" max="30" step="0.5"
                  onChange={e => set('years_exp', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">⚠️ {error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">
              {loading ? '⏳ Creating account...' : '🚀 Create Account & Get Protected'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Have an account? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
