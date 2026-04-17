export default function StatsCard({ title, value, subtitle, icon, color = 'sky' }) {
  const colorMap = {
    sky:    'bg-sky-50 border-sky-200 text-sky-600',
    green:  'bg-green-50 border-green-200 text-green-600',
    red:    'bg-red-50 border-red-200 text-red-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
  };

  return (
    <div className={`rounded-xl border p-5 flex items-center gap-4 ${colorMap[color] || colorMap.sky}`}>
      {icon && <span className="text-3xl">{icon}</span>}
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value ?? '—'}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
