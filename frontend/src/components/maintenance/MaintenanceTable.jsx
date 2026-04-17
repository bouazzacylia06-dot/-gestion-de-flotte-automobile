import MaintenanceBadge from './MaintenanceBadge';

export default function MaintenanceTable({ maintenances, onEdit, onDelete, canEdit }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th className="px-4 py-3 text-left">Véhicule ID</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-left">Statut</th>
            <th className="px-4 py-3 text-right">Coût</th>
            {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {maintenances.map((m) => (
            <tr key={m.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs text-gray-600">{m.vehicleId}</td>
              <td className="px-4 py-3 text-gray-700 capitalize">{m.type}</td>
              <td className="px-4 py-3 text-gray-600">
                {new Date(m.date).toLocaleString('fr-FR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </td>
              <td className="px-4 py-3">
                <MaintenanceBadge status={m.status} />
              </td>
              <td className="px-4 py-3 text-right text-gray-700">
                {m.cost != null ? `${m.cost.toFixed(2)} €` : '—'}
              </td>
              {canEdit && (
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => onEdit?.(m)}
                      className="text-xs text-gray-600 hover:underline"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => onDelete?.(m.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
          {maintenances.length === 0 && (
            <tr>
              <td colSpan={canEdit ? 6 : 5} className="px-4 py-8 text-center text-gray-400">
                Aucune maintenance
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
