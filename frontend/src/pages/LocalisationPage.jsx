import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useVehicules } from '../hooks/useVehicles';
import { useLastPosition } from '../hooks/useLocalisation';
import VehicleMarker from '../components/map/VehicleMarker';

function VehicleMarkerLive({ vehicule }) {
  const { position } = useLastPosition(vehicule.id, 3000);
  if (!position) return null;
  return <VehicleMarker vehicule={vehicule} position={position} />;
}

export default function LocalisationPage() {
  const { vehicules, loading } = useVehicules();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Localisation temps réel</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Mise à jour toutes les 3s
        </div>
      </div>

      {/* Légende */}
      <div className="flex gap-4 text-xs text-gray-600 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500" /> En service
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500" /> Hors zone
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-yellow-500" /> Maintenance
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-gray-400" /> Inactif
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center bg-gray-100 rounded-xl" style={{ height: '600px' }}>
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden shadow" style={{ height: '600px' }}>
          <MapContainer
            center={[49.4431, 1.0993]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {vehicules.map((v) => (
              <VehicleMarkerLive key={v.id} vehicule={v} />
            ))}
          </MapContainer>
        </div>
      )}

      {/* Liste véhicules */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-gray-700 mb-3">
          Flotte ({vehicules.length} véhicules)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {vehicules.map((v) => (
            <div key={v.id} className="border rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-800">{v.immatriculation}</p>
              <p className="text-gray-500 text-xs">{v.marque} {v.modele}</p>
              <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full font-medium ${
                ['in_use', 'available'].includes(v.statut?.toLowerCase())
                  ? 'bg-green-100 text-green-700'
                  : v.statut?.toLowerCase() === 'maintenance'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {v.statut === 'IN_USE' ? 'En service' : v.statut === 'AVAILABLE' ? 'Disponible' : v.statut === 'MAINTENANCE' ? 'Maintenance' : v.statut === 'RETIRED' ? 'Retiré' : v.statut}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
