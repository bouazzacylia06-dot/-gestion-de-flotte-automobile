const COLOR_MAP = {
  sky: {
    card: 'bg-gradient-to-br from-blue-900/50 to-blue-950/80 border border-blue-700/25',
    icon: 'bg-blue-500/15 text-blue-400 shadow-inner shadow-blue-500/10',
    trendUp: 'text-green-400',
    trendDown: 'text-red-400',
    title: 'text-blue-300/70',
    value: 'text-white',
    subtitle: 'text-slate-400',
  },
  green: {
    card: 'bg-gradient-to-br from-teal-900/50 to-teal-950/80 border border-teal-700/25',
    icon: 'bg-teal-500/15 text-teal-400 shadow-inner shadow-teal-500/10',
    trendUp: 'text-green-400',
    trendDown: 'text-red-400',
    title: 'text-teal-300/70',
    value: 'text-white',
    subtitle: 'text-slate-400',
  },
  red: {
    card: 'bg-gradient-to-br from-red-900/50 to-red-950/80 border border-red-700/25',
    icon: 'bg-red-500/15 text-red-400 shadow-inner shadow-red-500/10',
    trendUp: 'text-green-400',
    trendDown: 'text-red-400',
    title: 'text-red-300/70',
    value: 'text-white',
    subtitle: 'text-slate-400',
  },
  yellow: {
    card: 'bg-gradient-to-br from-amber-900/50 to-amber-950/80 border border-amber-700/25',
    icon: 'bg-amber-500/15 text-amber-400 shadow-inner shadow-amber-500/10',
    trendUp: 'text-green-400',
    trendDown: 'text-red-400',
    title: 'text-amber-300/70',
    value: 'text-white',
    subtitle: 'text-slate-400',
  },
};

export default function StatsCard({ title, value, subtitle, icon, color = 'sky', trend }) {
  const cfg = COLOR_MAP[color] || COLOR_MAP.sky;

  return (
    <div className={`rounded-2xl p-5 shadow-card hover:shadow-card-hover hover:scale-[1.01] transition-all duration-200 ${cfg.card}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${cfg.title}`}>{title}</p>
          <p className={`text-3xl font-bold leading-none ${cfg.value}`}>{value ?? '—'}</p>
          {subtitle && <p className={`text-xs mt-1.5 ${cfg.subtitle}`}>{subtitle}</p>}
          {trend != null && (
            <p className={`text-xs font-semibold mt-2 ${trend >= 0 ? cfg.trendUp : cfg.trendDown}`}>
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
