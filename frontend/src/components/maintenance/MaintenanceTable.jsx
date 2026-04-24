import MaintenanceBadge from './MaintenanceBadge';

const TYPE_CONFIG = {
  vidange:            { label: 'Vidange',             cls: 'bg-sky-100 text-sky-700' },
  revision:           { label: 'Révision',            cls: 'bg-violet-100 text-violet-700' },
  révision:           { label: 'Révision',            cls: 'bg-violet-100 text-violet-700' },
  pneus:              { label: 'Pneus',               cls: 'bg-orange-100 text-orange-700' },
  freins:             { label: 'Freins',              cls: 'bg-red-100 text-red-700' },
  controle_technique: { label: 'Contrôle tech.',      cls: 'bg-indigo-100 text-indigo-700' },
  batterie:           { label: 'Batterie',            cls: 'bg-yellow-100 text-yellow-700' },
  carrosserie:        { label: 'Carrosserie',         cls: 'bg-slate-100 text-slate-700' },
  électrique:         { label: 'Électrique',          cls: 'bg-teal-100 text-teal-700' },
  electrique:         { label: 'Électrique',          cls: 'bg-teal-100 text-teal-700' },
  autre:              { label: 'Autre',               cls: 'bg-gray-100 text-gray-600' },
};

function TypeBadge({ type }) {
  const key = type?.toLowerCase() || '';
  const cfg = TYPE_CONFIG[key] || { label: type || '—', cls: 'bg-gray-100 text-gray-600' };
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
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Véhicule</th>
            <th className="px-4 py-3 text-left font-semibold">Type</th>
            <th className="px-4 py-3 text-left font-semibold">Date</th>
            <th className="px-4 py-3 text-left font-semibold">Statut</th>
            <th className="px-4 py-3 text-right font-semibold">Coût</th>
            {canEdit && <th className="px-4 py-3 text-right font-semibold">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {maintenances.map((m) => (
            <tr key={m.id} className="hover:bg-blue-50 transition-colors">
              <td className="px-4 py-3">
                <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  …{m.vehicleId?.slice(-8)}
                </span>
              </td>
              <td className="px-4 py-3">
                <TypeBadge type={m.type} />
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs">
                {new Date(m.date).toLocaleString('fr-FR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </td>
              <td className="px-4 py-3">
                <MaintenanceBadge status={m.status} />
              </td>
              <td className="px-4 py-3 text-right font-medium text-gray-700">
                {formatCost(m.cost)}
              </td>
              {canEdit && (
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => onEdit?.(m)}
                      title="Modifier"
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => onDelete?.(m.id)}
                        title="Supprimer"
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
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
                <div className="flex flex-col items-center gap-3 text-gray-400">
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
