import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@apollo/client';
import { useVehicules } from '../../hooks/useVehicles';
import { useLastPosition } from '../../hooks/useLocalisation';
import { GET_GEO_ALERTES } from '../../api/queries';
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

const ZONE_POPUP_LABEL = {
  ZONE_EXIT: '🚨 Sortie de zone',
  FORBIDDEN: '⛔ Zone interdite',
  SPEED:     '⚡ Excès de vitesse',
};

/**
 * Carte Leaflet multi-véhicules centrée sur Rouen
 * Polling individuel de la dernière position toutes les 3s
 * Affiche les alertes géofencing (zones interdites) en rouge
 */
export default function FleetMap({ height = '400px' }) {
  const { vehicules, loading, error } = useVehicules();
  const { data: geoData } = useQuery(GET_GEO_ALERTES, {
    variables: { limit: 50 },
    pollInterval: 30000,
  });

  const alertesAvecPosition = (geoData?.geoAlertes || []).filter(
    (a) => a.latitude && a.longitude && Date.now() - new Date(a.createdAt).getTime() < 86400000
  );

  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-fleet-card rounded-lg border border-fleet-border"
        style={{ height }}
      >
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-red-500/10 rounded-lg text-red-400 text-sm border border-red-500/20"
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
        {alertesAvecPosition.map((a) => (
          <Circle
            key={a.id}
            center={[a.latitude, a.longitude]}
            radius={300}
            pathOptions={{
              color: '#ef4444',
              fillColor: '#ef4444',
              fillOpacity: 0.18,
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ minWidth: '150px', fontSize: '13px' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {ZONE_POPUP_LABEL[a.type] || a.type}
                </p>
                <p style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: '11px' }}>
                  Véhicule #{a.vehicleId?.slice(-8)}
                </p>
                <p style={{ color: '#9ca3af', fontSize: '11px', marginTop: '2px' }}>
                  {new Date(a.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
            </Popup>
          </Circle>
        ))}
      </MapContainer>
    </div>
  );
}
