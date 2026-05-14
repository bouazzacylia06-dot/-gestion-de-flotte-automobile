import MaintenanceBadge from './MaintenanceBadge';

const TYPE_CONFIG = {
  vidange:            { label: 'Vidange',             cls: 'bg-sky-500/15 text-sky-400 border border-sky-500/20' },
  revision:           { label: 'Révision',            cls: 'bg-violet-500/15 text-violet-400 border border-violet-500/20' },
  révision:           { label: 'Révision',            cls: 'bg-violet-500/15 text-violet-400 border border-violet-500/20' },
  pneus:              { label: 'Pneus',               cls: 'bg-orange-500/15 text-orange-400 border border-orange-500/20' },
  freins:             { label: 'Freins',              cls: 'bg-red-500/15 text-red-400 border border-red-500/20' },
  controle_technique: { label: 'Contrôle tech.',      cls: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' },
  batterie:           { label: 'Batterie',            cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/20' },
  carrosserie:        { label: 'Carrosserie',         cls: 'bg-slate-500/15 text-slate-400 border border-slate-500/20' },
  électrique:         { label: 'Électrique',          cls: 'bg-teal-500/15 text-teal-400 border border-teal-500/20' },
  electrique:         { label: 'Électrique',          cls: 'bg-teal-500/15 text-teal-400 border border-teal-500/20' },
  autre:              { label: 'Autre',               cls: 'bg-slate-500/15 text-slate-400 border border-slate-500/20' },
};

function TypeBadge({ type }) {
  const key = type?.toLowerCase() || '';
  const cfg = TYPE_CONFIG[key] || { label: type || '—', cls: 'bg-slate-500/15 text-slate-400 border border-slate-500/20' };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function formatCost(cost) {
  if (cost == null) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cost);
}

export default function MaintenanceTable({ maintenances, onEdit, onDelete, canEdit, canDelete = false }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-fleet-border bg-fleet-card shadow-card">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Véhicule</th>
            <th className="px-4 py-3 text-left font-semibold">Type</th>
            <th className="px-4 py-3 text-left font-semibold">Date</th>
            <th className="px-4 py-3 text-left font-semibold">Statut</th>
            <th className="px-4 py-3 text-right font-semibold">Coût</th>
            {canEdit && <th className="px-4 py-3 text-right font-semibold">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-fleet-border">
          {maintenances.map((m) => (
            <tr key={m.id} className="hover:bg-white/5 transition-colors">
              <td className="px-4 py-3">
                <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  …{m.vehicleId?.slice(-8)}
                </span>
              </td>
              <td className="px-4 py-3">
                <TypeBadge type={m.type} />
              </td>
              <td className="px-4 py-3 text-slate-400 text-xs">
                {new Date(m.date).toLocaleString('fr-FR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </td>
              <td className="px-4 py-3">
                <MaintenanceBadge status={m.status} />
              </td>
              <td className="px-4 py-3 text-right font-medium text-slate-300">
                {formatCost(m.cost)}
              </td>
              {canEdit && (
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => onEdit?.(m)}
                      title="Modifier"
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => onDelete?.(m.id)}
                        title="Supprimer"
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
          {maintenances.length === 0 && (
            <tr>
              <td colSpan={canEdit ? 6 : 5} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm font-medium">Aucune maintenance enregistrée</p>
                  <p className="text-xs">Cliquez sur "+ Signaler un problème" pour commencer</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
