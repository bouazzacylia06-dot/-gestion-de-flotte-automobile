import { useState } from 'react';
import { Link } from 'react-router-dom';

const STATUS_CONFIG = {
  AVAILABLE:      { label: 'Disponible',  cls: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  IN_USE:         { label: 'En mission',  cls: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  MAINTENANCE:    { label: 'Maintenance', cls: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  RETIRED:        { label: 'Retiré',      cls: 'bg-gray-100 text-gray-500',   dot: 'bg-gray-400' },
  // legacy lowercase
  actif:          { label: 'Disponible',  cls: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  en_service:     { label: 'En mission',  cls: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  in_use:         { label: 'En mission',  cls: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  available:      { label: 'Disponible',  cls: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  maintenance:    { label: 'Maintenance', cls: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  en_maintenance: { label: 'Maintenance', cls: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  inactif:        { label: 'Inactif',     cls: 'bg-gray-100 text-gray-500',   dot: 'bg-gray-400' },
  retired:        { label: 'Retiré',      cls: 'bg-gray-100 text-gray-500',   dot: 'bg-gray-400' },
};

const PAGE_SIZE = 10;

function StatusBadge({ statut }) {
  const key = statut || '';
  const cfg = STATUS_CONFIG[key] || STATUS_CONFIG[key.toLowerCase()] || { label: statut, cls: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function VehicleList({ vehicules, onEdit, onDelete, canEdit }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const filtered = vehicules.filter((v) => {
    const q = search.toLowerCase();
    return !q || v.immatriculation?.toLowerCase().includes(q) || v.marque?.toLowerCase().includes(q) || v.modele?.toLowerCase().includes(q);
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="Rechercher par immatriculation, marque ou modèle…"
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Immatriculation</th>
              <th className="px-4 py-3 text-left font-semibold">Marque</th>
              <th className="px-4 py-3 text-left font-semibold">Modèle</th>
              <th className="px-4 py-3 text-left font-semibold">Statut</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {slice.map((v) => (
              <tr key={v.id} className="hover:bg-blue-50 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {v.immatriculation}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">{v.marque}</td>
                <td className="px-4 py-3 text-gray-600">{v.modele}</td>
                <td className="px-4 py-3">
                  <StatusBadge statut={v.statut} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <Link
                      to={`/vehicles/${v.id}`}
                      title="Voir la carte"
                      className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </Link>
                    {canEdit && (
                      <button
                        onClick={() => onEdit?.(v)}
                        title="Modifier"
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(v.id)}
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
              </tr>
            ))}
            {slice.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-sm font-medium">
                      {search ? 'Aucun résultat pour cette recherche' : 'Aucun véhicule enregistré'}
                    </p>
                    {!search && <p className="text-xs">Cliquez sur "+ Nouveau véhicule" pour commencer</p>}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="text-xs">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} sur {total} véhicule{total > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 text-xs font-medium transition-colors"
            >
              ← Préc.
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === p ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 border border-gray-200'}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 text-xs font-medium transition-colors"
            >
              Suiv. →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
