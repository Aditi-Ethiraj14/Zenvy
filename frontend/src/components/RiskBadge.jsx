// Reusable risk level badge component
export default function RiskBadge({ level, score }) {
  const config = {
    low:      { color: 'bg-green-100 text-green-700 border-green-200',  icon: '🟢', label: 'LOW' },
    medium:   { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '🟡', label: 'MEDIUM' },
    high:     { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '🟠', label: 'HIGH' },
    critical: { color: 'bg-red-100 text-red-700 border-red-200',         icon: '🔴', label: 'CRITICAL' },
    none:     { color: 'bg-gray-100 text-gray-600 border-gray-200',      icon: '⚪', label: 'NO POLICY' }
  }
  const c = config[level] || config.none
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${c.color}`}>
      {c.icon} {c.label} {score !== undefined && `(${(score * 100).toFixed(0)}%)`}
    </span>
  )
}
