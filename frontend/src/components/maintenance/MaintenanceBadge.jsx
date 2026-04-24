const CONFIG = {
  planifie:  { label: 'Planifiée',  cls: 'bg-blue-100 text-blue-700',   icon: '📅' },
  planifiee: { label: 'Planifiée',  cls: 'bg-blue-100 text-blue-700',   icon: '📅' },
  en_cours:  { label: 'En cours',   cls: 'bg-orange-100 text-orange-700', icon: '⚙️', animate: true },
  termine:   { label: 'Terminée',   cls: 'bg-green-100 text-green-700', icon: '✅' },
  terminee:  { label: 'Terminée',   cls: 'bg-green-100 text-green-700', icon: '✅' },
  annule:    { label: 'Annulée',    cls: 'bg-gray-100 text-gray-500',   icon: '✕' },
  annulee:   { label: 'Annulée',    cls: 'bg-gray-100 text-gray-500',   icon: '✕' },
};

export default function MaintenanceBadge({ status }) {
  const key = status?.toLowerCase().replace(' ', '_') || '';
  const cfg = CONFIG[key] || { label: status || '—', cls: 'bg-gray-100 text-gray-500', icon: '' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
      <span className={cfg.animate ? 'animate-spin inline-block' : ''}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}
