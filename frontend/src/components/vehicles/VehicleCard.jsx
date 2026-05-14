import { Link } from 'react-router-dom';

const STATUS_STYLES = {
  actif:          'bg-green-500/15 text-green-400 border border-green-500/20',
  en_service:     'bg-green-500/15 text-green-400 border border-green-500/20',
  maintenance:    'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  en_maintenance: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  inactif:        'bg-slate-500/15 text-slate-400 border border-slate-500/20',
};

export default function VehicleCard({ vehicule, onEdit, onDelete, canEdit }) {
  const statusStyle = STATUS_STYLES[vehicule.statut?.toLowerCase()] || 'bg-slate-500/15 text-slate-400 border border-slate-500/20';

  return (
    <div className="bg-fleet-card rounded-xl border border-fleet-border shadow-card p-4 flex flex-col gap-3 hover:border-slate-600 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-white text-lg">{vehicule.immatriculation}</p>
          <p className="text-slate-400 text-sm">{vehicule.marque} {vehicule.modele}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusStyle}`}>
          {vehicule.statut}
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link
          to={`/vehicles/${vehicule.id}`}
          className="text-xs bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/20 px-3 py-1.5 rounded font-medium transition-colors"
        >
          Voir sur carte
        </Link>
        {canEdit && (
          <>
            <button
              onClick={() => onEdit?.(vehicule)}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded font-medium transition-colors"
            >
              Modifier
            </button>
            <button
              onClick={() => onDelete?.(vehicule.id)}
              className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded font-medium transition-colors"
            >
              Supprimer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
