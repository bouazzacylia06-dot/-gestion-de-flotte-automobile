import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useVehicules } from '../../hooks/useVehicles';
import { useLastPosition } from '../../hooks/useLocalisation';
import VehicleMarker from './VehicleMarker';

// Fix Leaflet marker icons avec Vite (imports statiques)
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon   from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
});

// Composant interne pour chaque marker (utilise son propre hook polling)
function VehicleMarkerContainer({ vehicule }) {
  const { position } = useLastPosition(vehicule.id, 3000);
  if (!position) return null;
  return <VehicleMarker vehicule={vehicule} position={position} />;
}

/**
 * Carte Leaflet multi-véhicules centrée sur Rouen
 * Polling individuel de la dernière position toutes les 3s
 */
export default function FleetMap({ height = '400px' }) {
  const { vehicules, loading, error } = useVehicules();

  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-lg"
        style={{ height }}
      >
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-red-50 rounded-lg text-red-600 text-sm"
        style={{ height }}
      >
        Erreur de chargement de la carte
      </div>
    );
  }

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden shadow">
      <MapContainer
        center={[49.4431, 1.0993]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {vehicules.map((v) => (
          <VehicleMarkerContainer key={v.id} vehicule={v} />
        ))}
      </MapContainer>
    </div>
  );
}
