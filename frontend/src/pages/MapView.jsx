// ============================================================
// MapView.jsx — Leaflet Risk Map
// ============================================================
// Shows all workers on map with role markers and risk levels.
// Uses react-leaflet with OpenStreetMap tiles.
// ============================================================

import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import { getMapData } from '../api.js'
import 'leaflet/dist/leaflet.css'

// Fix default marker icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom colored markers by role
const createIcon = (color, emoji) => L.divIcon({
  html: `<div style="background:${color};color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${emoji}</div>`,
  iconSize: [34, 34],
  className: ''
})

const ROLE_ICONS = {
  food_delivery:      createIcon('#f97316', '🍔'),
  grocery_delivery:   createIcon('#22c55e', '🛒'),
  ecommerce_delivery: createIcon('#a855f7', '📦'),
}

const RISK_COLORS = {
  low:      'rgba(34,197,94,0.2)',
  medium:   'rgba(234,179,8,0.2)',
  high:     'rgba(249,115,22,0.2)',
  critical: 'rgba(239,68,68,0.25)',
  none:     'rgba(148,163,184,0.1)'
}

export default function MapView() {
  const [markers, setMarkers] = useState([])
  const [filter, setFilter]   = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMapData()
      .then(r => setMarkers(r.data || []))
      .catch(() => setMarkers([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? markers : markers.filter(m => m.role === filter)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">🗺️ Live Risk Map</h1>
        <span className="text-sm text-gray-500">{filtered.length} workers</span>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all',              label: '🌍 All' },
          { key: 'food_delivery',    label: '🍔 Food' },
          { key: 'grocery_delivery', label: '🛒 Grocery' },
          { key: 'ecommerce_delivery',label:'📦 E-comm' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              filter === f.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'
            }`}>{f.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="h-96 bg-gray-100 rounded-2xl flex items-center justify-center">
          <p className="text-gray-400">Loading map...</p>
        </div>
      ) : (
        <div className="h-[500px] rounded-2xl overflow-hidden shadow-sm border border-gray-200">
          <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {filtered.map(m => (
              <React.Fragment key={m.id}>
                {/* Risk zone circle */}
                <Circle
                  center={[m.lat, m.lon]}
                  radius={15000}
                  pathOptions={{
                    color: RISK_COLORS[m.risk_level]?.replace('0.2', '0.5') || '#94a3b8',
                    fillColor: RISK_COLORS[m.risk_level] || 'rgba(148,163,184,0.1)',
                    fillOpacity: 0.4,
                    weight: 1
                  }}
                />
                {/* Worker marker */}
                <Marker
                  position={[m.lat, m.lon]}
                  icon={ROLE_ICONS[m.role] || ROLE_ICONS.food_delivery}
                >
                  <Popup>
                    <div className="text-sm font-medium">
                      <p className="font-bold">{m.name}</p>
                      <p className="text-gray-500 capitalize">{m.role.replace(/_/g, ' ')}</p>
                      <p className="text-gray-500">{m.city}</p>
                      {m.has_policy ? (
                        <p className={`mt-1 font-bold ${
                          m.risk_level === 'critical' ? 'text-red-600' :
                          m.risk_level === 'high' ? 'text-orange-600' :
                          m.risk_level === 'medium' ? 'text-yellow-600' : 'text-green-600'
                        }`}>Risk: {m.risk_level?.toUpperCase()}</p>
                      ) : (
                        <p className="mt-1 text-gray-400">No active policy</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}
          </MapContainer>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-sm font-bold text-gray-700 mb-2">Legend</p>
        <div className="flex gap-4 flex-wrap text-xs text-gray-600">
          <span>🍔 Food Delivery</span>
          <span>🛒 Grocery Delivery</span>
          <span>📦 E-commerce Delivery</span>
          <span className="text-green-600">🟢 Low Risk</span>
          <span className="text-yellow-600">🟡 Medium Risk</span>
          <span className="text-orange-600">🟠 High Risk</span>
          <span className="text-red-600">🔴 Critical Risk</span>
        </div>
      </div>
    </div>
  )
}
