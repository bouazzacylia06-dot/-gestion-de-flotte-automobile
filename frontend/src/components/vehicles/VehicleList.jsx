import { useState } from 'react';
import { Link } from 'react-router-dom';

const STATUS_CONFIG = {
  AVAILABLE:      { label: 'Disponible',  cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',     dot: 'bg-blue-400' },
  IN_USE:         { label: 'En mission',  cls: 'bg-green-500/15 text-green-400 border border-green-500/20',   dot: 'bg-green-400' },
  MAINTENANCE:    { label: 'Maintenance', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',   dot: 'bg-amber-400' },
  RETIRED:        { label: 'Retiré',      cls: 'bg-slate-500/15 text-slate-400 border border-slate-500/20',   dot: 'bg-slate-500' },
  // legacy lowercase
  actif:          { label: 'Disponible',  cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',     dot: 'bg-blue-400' },
  en_service:     { label: 'En mission',  cls: 'bg-green-500/15 text-green-400 border border-green-500/20',   dot: 'bg-green-400' },
  in_use:         { label: 'En mission',  cls: 'bg-green-500/15 text-green-400 border border-green-500/20',   dot: 'bg-green-400' },
  available:      { label: 'Disponible',  cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',     dot: 'bg-blue-400' },
  maintenance:    { label: 'Maintenance', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',   dot: 'bg-amber-400' },
  en_maintenance: { label: 'Maintenance', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',   dot: 'bg-amber-400' },
  inactif:        { label: 'Inactif',     cls: 'bg-slate-500/15 text-slate-400 border border-slate-500/20',   dot: 'bg-slate-500' },
  retired:        { label: 'Retiré',      cls: 'bg-slate-500/15 text-slate-400 border border-slate-500/20',   dot: 'bg-slate-500' },
};

const PAGE_SIZE = 10;

function StatusBadge({ statut }) {
  const key = statut || '';
  const cfg = STATUS_CONFIG[key] || STATUS_CONFIG[key.toLowerCase()] || { label: statut, cls: 'bg-slate-500/15 text-slate-400', dot: 'bg-slate-500' };
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
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="Rechercher par immatriculation, marque ou modèle…"
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-fleet-card border border-fleet-border text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 placeholder:text-slate-500 transition-all"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-fleet-border bg-fleet-card shadow-card">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Immatriculation</th>
              <th className="px-4 py-3 text-left font-semibold">Marque</th>
              <th className="px-4 py-3 text-left font-semibold">Modèle</th>
              <th className="px-4 py-3 text-left font-semibold">Statut</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fleet-border">
            {slice.map((v) => (
              <tr key={v.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    {v.immatriculation}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-slate-200">{v.marque}</td>
                <td className="px-4 py-3 text-slate-400">{v.modele}</td>
                <td className="px-4 py-3">
                  <StatusBadge statut={v.statut} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <Link
                      to={`/vehicles/${v.id}`}
                      title="Voir la carte"
                      className="p-1.5 rounded-lg text-sky-400 hover:bg-sky-500/10 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </Link>
                    {canEdit && (
                      <button
                        onClick={() => onEdit?.(v)}
                        title="Modifier"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
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
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
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
                  <div className="flex flex-col items-center gap-3 text-slate-500">
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
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span className="text-xs">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} sur {total} véhicule{total > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-fleet-border rounded-lg disabled:opacity-30 hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              ← Préc.
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === p ? 'bg-violet-600 text-white' : 'hover:bg-slate-800 border border-fleet-border text-slate-400'}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-fleet-border rounded-lg disabled:opacity-30 hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              Suiv. →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
