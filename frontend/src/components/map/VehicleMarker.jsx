import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

/**
 * Couleur selon statut du véhicule :
 *   en_service → vert
 *   hors_zone  → rouge  (alerte géofencing)
 *   maintenance → jaune
 *   autre       → gris
 */
function getMarkerColor(statut) {
  switch (statut?.toLowerCase()) {
    case 'en_service':
    case 'actif':
    case 'in_use':
    case 'available':
      return '#22c55e'; // green-500
    case 'hors_zone':
    case 'alerte':
      return '#ef4444'; // red-500
    case 'maintenance':
    case 'en_maintenance':
      return '#eab308'; // yellow-500
    case 'retired':
    case 'inactif':
      return '#6b7280'; // gray-500
    default:
      return '#6b7280'; // gray-500
  }
}

function createDivIcon(color, label) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50% 50% 50% 0;
        width: 28px;
        height: 28px;
        transform: rotate(-45deg);
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-size: 11px;
          font-weight: bold;
          display: block;
          text-align: center;
          line-height: 1;
          margin-top: 2px;
        ">${label?.substring(0, 2) || '?'}</span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

export default function VehicleMarker({ vehicule, position }) {
  if (!position) return null;

  const color = getMarkerColor(vehicule?.statut);
  const icon = createDivIcon(color, vehicule?.immatriculation);

  return (
    <Marker
      position={[position.latitude, position.longitude]}
      icon={icon}
    >
      <Popup>
        <div className="text-sm min-w-[160px]">
          <p className="font-bold text-sky-700">{vehicule?.immatriculation}</p>
          <p className="text-gray-600">{vehicule?.marque} {vehicule?.modele}</p>
          <p className="mt-1">
            <span className="text-gray-500">Statut : </span>
            <span
              className="font-medium"
              style={{ color }}
            >
              {vehicule?.statut}
            </span>
          </p>
          {position.speed != null && (
            <p className="text-gray-500 text-xs mt-1">
              Vitesse : {Math.round(position.speed)} km/h
            </p>
          )}
          <p className="text-gray-400 text-xs mt-1">
            {new Date(position.timestamp).toLocaleString('fr-FR')}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}
