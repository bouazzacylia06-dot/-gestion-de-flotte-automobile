import { Link } from 'react-router-dom';

const STATUS_STYLES = {
  actif:          'bg-green-100 text-green-700',
  en_service:     'bg-green-100 text-green-700',
  maintenance:    'bg-yellow-100 text-yellow-700',
  en_maintenance: 'bg-yellow-100 text-yellow-700',
  inactif:        'bg-gray-100 text-gray-600',
};

export default function VehicleCard({ vehicule, onEdit, onDelete, canEdit }) {
  const statusStyle = STATUS_STYLES[vehicule.statut?.toLowerCase()] || 'bg-gray-100 text-gray-500';

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-gray-800 text-lg">{vehicule.immatriculation}</p>
          <p className="text-gray-500 text-sm">{vehicule.marque} {vehicule.modele}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusStyle}`}>
          {vehicule.statut}
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link
          to={`/vehicles/${vehicule.id}`}
          className="text-xs bg-sky-50 text-sky-600 hover:bg-sky-100 px-3 py-1.5 rounded font-medium"
        >
          Voir sur carte
        </Link>
        {canEdit && (
          <>
            <button
              onClick={() => onEdit?.(vehicule)}
              className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-1.5 rounded font-medium"
            >
              Modifier
            </button>
            <button
              onClick={() => onDelete?.(vehicule.id)}
              className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded font-medium"
            >
              Supprimer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
