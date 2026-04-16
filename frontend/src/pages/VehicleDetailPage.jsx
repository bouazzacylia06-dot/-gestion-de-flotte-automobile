import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useVehicule } from '../hooks/useVehicles';
import { useLastPosition, usePositionHistory } from '../hooks/useLocalisation';
import VehicleMarker from '../components/map/VehicleMarker';
import TrajectoryLayer from '../components/map/TrajectoryLayer';

export default function VehicleDetailPage() {
  const { id } = useParams();
  const { vehicule, loading: vLoading } = useVehicule(id);
  const { position }                    = useLastPosition(id, 3000);

  const to   = new Date().toISOString();
  const from = new Date(Date.now() - 3600 * 1000).toISOString();
  const { history } = usePositionHistory(id, from, to, 50);

  if (vLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const center = position
    ? [position.latitude, position.longitude]
    : [49.4431, 1.0993];

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/vehicles" className="text-sm text-sky-600 hover:underline mb-1 block">
            ← Retour aux véhicules
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            {vehicule?.immatriculation}
          </h1>
          <p className="text-gray-500">{vehicule?.marque} {vehicule?.modele} — {vehicule?.statut}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden shadow" style={{ height: '450px' }}>
          <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <TrajectoryLayer vehicleId={id} />
            {position && <VehicleMarker vehicule={vehicule} position={position} />}
          </MapContainer>
        </div>

        {/* Panneau historique */}
        <div className="bg-white rounded-xl border p-4 overflow-auto" style={{ maxHeight: '450px' }}>
          <h3 className="font-semibold text-gray-700 mb-3">Historique (1h)</h3>
          {history.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune position enregistrée</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {history.slice().reverse().map((p) => (
                <li key={p.id} className="border-b pb-2">
                  <p className="font-mono text-gray-600">
                    {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                  </p>
                  {p.speed != null && (
                    <p className="text-gray-400">{Math.round(p.speed)} km/h</p>
                  )}
                  <p className="text-gray-400">
                    {new Date(p.timestamp).toLocaleTimeString('fr-FR')}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {position && (
            <div className="mt-4 bg-sky-50 rounded-lg p-3 text-xs">
              <p className="font-semibold text-sky-700 mb-1">Dernière position</p>
              <p>{position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}</p>
              {position.speed != null && <p>{Math.round(position.speed)} km/h</p>}
              <p className="text-gray-400">
                {new Date(position.timestamp).toLocaleString('fr-FR')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
