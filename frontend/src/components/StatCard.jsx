// Reusable stat card for dashboards
export default function StatCard({ icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'from-blue-500 to-blue-700',
    green:  'from-green-500 to-green-700',
    orange: 'from-orange-500 to-orange-700',
    red:    'from-red-500 to-red-700',
    purple: 'from-purple-500 to-purple-700',
  }
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-2xl mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm font-medium text-gray-600 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}
