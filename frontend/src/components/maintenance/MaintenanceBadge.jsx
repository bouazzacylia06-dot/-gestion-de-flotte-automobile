const CONFIG = {
  planifie:  { label: 'Planifiée',  cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',     icon: '📅' },
  planifiee: { label: 'Planifiée',  cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',     icon: '📅' },
  en_cours:  { label: 'En cours',   cls: 'bg-orange-500/15 text-orange-400 border border-orange-500/20', icon: '⚙️', animate: true },
  termine:   { label: 'Terminée',   cls: 'bg-green-500/15 text-green-400 border border-green-500/20',   icon: '✅' },
  terminee:  { label: 'Terminée',   cls: 'bg-green-500/15 text-green-400 border border-green-500/20',   icon: '✅' },
  annule:    { label: 'Annulée',    cls: 'bg-slate-500/15 text-slate-400 border border-slate-500/20',   icon: '✕' },
  annulee:   { label: 'Annulée',    cls: 'bg-slate-500/15 text-slate-400 border border-slate-500/20',   icon: '✕' },
};

export default function MaintenanceBadge({ status }) {
  const key = status?.toLowerCase().replace(' ', '_') || '';
  const cfg = CONFIG[key] || { label: status || '—', cls: 'bg-slate-500/15 text-slate-400 border border-slate-500/20', icon: '' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
      <span className={cfg.animate ? 'animate-spin inline-block' : ''}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}
