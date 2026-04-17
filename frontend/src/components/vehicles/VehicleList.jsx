import { useState } from 'react';
import { Link } from 'react-router-dom';

const STATUS_BADGE = {
  actif:          'bg-green-100 text-green-700',
  en_service:     'bg-green-100 text-green-700',
  in_use:         'bg-green-100 text-green-700',
  available:      'bg-blue-100 text-blue-700',
  maintenance:    'bg-yellow-100 text-yellow-700',
  en_maintenance: 'bg-yellow-100 text-yellow-700',
  inactif:        'bg-gray-100 text-gray-600',
  retired:        'bg-gray-100 text-gray-500',
};

const PAGE_SIZE = 10;

export default function VehicleList({ vehicules, onEdit, onDelete, canEdit }) {
  const [page, setPage] = useState(1);
  const total = vehicules.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const slice = vehicules.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Immatriculation</th>
              <th className="px-4 py-3 text-left">Marque</th>
              <th className="px-4 py-3 text-left">Modèle</th>
              <th className="px-4 py-3 text-left">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {slice.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800">{v.immatriculation}</td>
                <td className="px-4 py-3 text-gray-600">{v.marque}</td>
                <td className="px-4 py-3 text-gray-600">{v.modele}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_BADGE[v.statut?.toLowerCase()] || 'bg-gray-100 text-gray-500'}`}>
                    {v.statut}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-2 justify-end">
                    <Link
                      to={`/vehicles/${v.id}`}
                      className="text-xs text-sky-600 hover:underline"
                    >
                      Carte
                    </Link>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => onEdit?.(v)}
                          className="text-xs text-gray-600 hover:underline"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => onDelete?.(v.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Supprimer
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {slice.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Aucun véhicule
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
          <span>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} sur {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50"
            >
              ←
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
