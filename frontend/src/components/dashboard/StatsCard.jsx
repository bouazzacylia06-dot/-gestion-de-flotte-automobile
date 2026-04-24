const COLOR_MAP = {
  sky:    { card: 'bg-white border-sky-200',    icon: 'bg-sky-50 text-sky-600',    trend: 'text-sky-600' },
  green:  { card: 'bg-white border-green-200',  icon: 'bg-green-50 text-green-600',  trend: 'text-green-600' },
  red:    { card: 'bg-white border-red-200',    icon: 'bg-red-50 text-red-600',    trend: 'text-red-500' },
  yellow: { card: 'bg-white border-yellow-200', icon: 'bg-yellow-50 text-yellow-600', trend: 'text-yellow-600' },
};

export default function StatsCard({ title, value, subtitle, icon, color = 'sky', trend }) {
  const cfg = COLOR_MAP[color] || COLOR_MAP.sky;

  return (
    <div className={`rounded-2xl border-2 p-5 shadow-sm hover:shadow-md transition-shadow ${cfg.card}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-800 leading-none">{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1.5">{subtitle}</p>}
          {trend != null && (
            <p className={`text-xs font-semibold mt-2 ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs mois dernier
            </p>
          )}
        </div>
        {icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${cfg.icon}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
