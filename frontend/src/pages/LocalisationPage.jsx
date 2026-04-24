import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@apollo/client';
import { useVehicules } from '../hooks/useVehicles';
import { useLastPosition } from '../hooks/useLocalisation';
import { useMaintenances } from '../hooks/useMaintenances';
import { GET_GEO_ALERTES, GET_CONDUCTEURS } from '../api/queries';
import VehicleMarker from '../components/map/VehicleMarker';
import MaintenanceBadge from '../components/maintenance/MaintenanceBadge';

function VehicleMarkerLive({ vehicule }) {
  const { position } = useLastPosition(vehicule.id, 3000);
  if (!position) return null;
  return <VehicleMarker vehicule={vehicule} position={position} />;
}

function StatutBadge({ statut }) {
  const s = statut?.toLowerCase() || '';
  const cfg =
    ['in_use', 'available', 'actif', 'en_service'].includes(s)
      ? { cls: 'bg-green-100 text-green-700', label: statut === 'IN_USE' ? 'En service' : statut === 'AVAILABLE' ? 'Disponible' : statut }
      : ['hors_zone', 'alerte'].includes(s)
      ? { cls: 'bg-red-100 text-red-700', label: statut }
      : s === 'maintenance'
      ? { cls: 'bg-yellow-100 text-yellow-700', label: 'Maintenance' }
      : s === 'retired'
      ? { cls: 'bg-gray-100 text-gray-500', label: 'Retiré' }
      : { cls: 'bg-gray-100 text-gray-500', label: statut };

  const labelMap = { IN_USE: 'En mission', AVAILABLE: 'Disponible', MAINTENANCE: 'Maintenance', RETIRED: 'Retiré' };
  const displayLabel = labelMap[statut] || cfg.label;

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.cls}`}>
      {displayLabel}
    </span>
  );
}

function avatarColor(name = '') {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-rose-500', 'bg-amber-500', 'bg-teal-500'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function Avatar({ prenom = '', nom = '' }) {
  const initials = `${prenom[0] || ''}${nom[0] || ''}`.toUpperCase();
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(nom + prenom)}`}>
      {initials}
    </div>
  );
}

export default function LocalisationPage() {
  const { vehicules, loading } = useVehicules();
  const { maintenances } = useMaintenances();
  const { data: condData } = useQuery(GET_CONDUCTEURS);
  const { data: alertData } = useQuery(GET_GEO_ALERTES, {
    variables: { limit: 20 },
    pollInterval: 10000,
  });

  const conducteurs = condData?.conducteurs || [];
  const geoAlertes  = alertData?.geoAlertes || [];
  const alertes24h  = geoAlertes.filter((a) => Date.now() - new Date(a.createdAt).getTime() < 86400000);

  const maintenancesPlanifiees = maintenances.filter((m) =>
    ['planifie', 'planifiee', 'PLANIFIE', 'PLANIFIEE'].includes(m.status)
  );
  const vehiculesHorsZone = vehicules.filter((v) => ['hors_zone', 'alerte'].includes(v.statut?.toLowerCase()));
  const vehiculesAvecConducteur = vehicules.map((v) => ({
    ...v,
    conducteur: conducteurs.find((c) => c.vehiculeId === v.id) || null,
  }));

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-800">Localisation temps réel</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          Mise à jour toutes les 3s
        </div>
      </div>

      {/* Légende */}
      <div className="flex gap-4 text-xs text-gray-600 flex-wrap">
        {[
          { color: 'bg-green-500', label: 'En service' },
          { color: 'bg-blue-500', label: 'Disponible' },
          { color: 'bg-red-500', label: 'Hors zone' },
          { color: 'bg-yellow-500', label: 'Maintenance' },
          { color: 'bg-gray-400', label: 'Inactif' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`inline-block w-3 h-3 rounded-full ${color}`} />
            {label}
          </span>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Carte */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center bg-gray-100 rounded-2xl" style={{ height: '600px' }}>
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-200" style={{ height: '600px' }}>
              <MapContainer center={[49.4431, 1.0993]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {vehicules.map((v) => <VehicleMarkerLive key={v.id} vehicule={v} />)}
              </MapContainer>
            </div>
          )}
        </div>

        {/* Panneau latéral */}
        <div className="w-full lg:w-72 flex flex-col gap-4">
          {/* Alertes géofencing */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                ⚠️ Alertes géofencing
              </h3>
              {alertes24h.length > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {alertes24h.length}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-3">Dernières 24h</p>
            {alertes24h.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">✅ Aucune alerte</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alertes24h.map((a) => (
                  <div key={a.id} className={`rounded-xl border p-2.5 text-xs ${
                    a.type === 'ZONE_EXIT' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-orange-50 border-orange-200 text-orange-700'
                  }`}>
                    <p className="font-semibold">{a.type === 'ZONE_EXIT' ? '🚨 Sortie de zone' : '⚠️ Zone interdite'}</p>
                    <p className="text-gray-500 font-mono mt-0.5">Véhicule #{a.vehicleId?.slice(-8)}</p>
                    <p className="text-gray-400 mt-0.5">{new Date(a.createdAt).toLocaleString('fr-FR')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Véhicules hors zone */}
          {vehiculesHorsZone.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <h3 className="font-semibold text-red-700 mb-2">🚨 Hors zone ({vehiculesHorsZone.length})</h3>
              <div className="space-y-1">
                {vehiculesHorsZone.map((v) => (
                  <p key={v.id} className="text-xs text-red-600 font-mono">{v.immatriculation} — {v.marque} {v.modele}</p>
                ))}
              </div>
            </div>
          )}

          {/* Maintenances planifiées */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">🔧 Planifiées</h3>
              {maintenancesPlanifiees.length > 0 && (
                <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {maintenancesPlanifiees.length}
                </span>
              )}
            </div>
            {maintenancesPlanifiees.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-3">✅ Aucune planifiée</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto mt-2">
                {maintenancesPlanifiees.slice(0, 5).map((m) => (
                  <div key={m.id} className="text-xs text-gray-600 border border-gray-100 rounded-lg p-2 hover:bg-gray-50">
                    <p className="font-medium capitalize">{m.type}</p>
                    <p className="text-gray-400">{new Date(m.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                ))}
                {maintenancesPlanifiees.length > 5 && (
                  <p className="text-xs text-gray-400 text-center">+ {maintenancesPlanifiees.length - 5} autres</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tableau récapitulatif — Véhicules */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Récapitulatif flotte — {vehicules.length} véhicule{vehicules.length > 1 ? 's' : ''}</h3>
          <span className="text-xs text-gray-400">
            {conducteurs.length} conducteur{conducteurs.length > 1 ? 's' : ''} · {maintenances.length} maintenance{maintenances.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Immatriculation</th>
                <th className="px-4 py-3 text-left font-semibold">Marque / Modèle</th>
                <th className="px-4 py-3 text-left font-semibold">Statut</th>
                <th className="px-4 py-3 text-left font-semibold">Conducteur assigné</th>
                <th className="px-4 py-3 text-left font-semibold">Dernière maint.</th>
                <th className="px-4 py-3 text-left font-semibold">Statut maint.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vehiculesAvecConducteur.map((v, idx) => {
                const maintsVehicule = maintenances.filter((m) => m.vehicleId === v.id).sort((a, b) => new Date(b.date) - new Date(a.date));
                const derniereMaint  = maintsVehicule[0] || null;
                return (
                  <tr key={v.id} className={`hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{v.immatriculation}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{v.marque} {v.modele}</td>
                    <td className="px-4 py-3"><StatutBadge statut={v.statut} /></td>
                    <td className="px-4 py-3 text-gray-600">
                      {v.conducteur ? (
                        <span className="flex items-center gap-2">
                          <Avatar prenom={v.conducteur.prenom} nom={v.conducteur.nom} />
                          {v.conducteur.prenom} {v.conducteur.nom}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">— Non assigné</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {derniereMaint ? new Date(derniereMaint.date).toLocaleDateString('fr-FR') : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {derniereMaint ? <MaintenanceBadge status={derniereMaint.status} /> : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                  </tr>
                );
              })}
              {vehicules.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucun véhicule</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Liste Conducteurs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Conducteurs — {conducteurs.length}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left font-semibold w-10"></th>
                <th className="px-4 py-3 text-left font-semibold">Nom</th>
                <th className="px-4 py-3 text-left font-semibold">Prénom</th>
                <th className="px-4 py-3 text-left font-semibold">N° Permis</th>
                <th className="px-4 py-3 text-left font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {conducteurs.map((c, idx) => (
                <tr key={c.id} className={`hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="pl-4 py-3"><Avatar prenom={c.prenom} nom={c.nom} /></td>
                  <td className="px-4 py-3 font-medium text-gray-800">{c.nom}</td>
                  <td className="px-4 py-3 text-gray-600">{c.prenom}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{c.numeroPermis}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      c.statut === 'actif' ? 'bg-green-100 text-green-700'
                      : c.statut === 'inactif' ? 'bg-gray-100 text-gray-600'
                      : 'bg-red-100 text-red-600'
                    }`}>{c.statut}</span>
                  </td>
                </tr>
              ))}
              {conducteurs.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Aucun conducteur</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Liste Maintenances */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Maintenances — {maintenances.length}</h3>
          <div className="flex gap-2 text-xs">
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {maintenancesPlanifiees.length} planifiée{maintenancesPlanifiees.length > 1 ? 's' : ''}
            </span>
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              {maintenances.filter((m) => ['termine', 'terminee'].includes(m.status?.toLowerCase())).length} terminée{maintenances.filter((m) => ['termine', 'terminee'].includes(m.status?.toLowerCase())).length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Véhicule</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Statut</th>
                <th className="px-4 py-3 text-right font-semibold">Coût</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {maintenances.slice(0, 20).map((m, idx) => (
                <tr key={m.id} className={`hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">…{m.vehicleId?.slice(-8)}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 capitalize">{m.type}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(m.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3"><MaintenanceBadge status={m.status} /></td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700">
                    {m.cost != null ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m.cost) : '—'}
                  </td>
                </tr>
              ))}
              {maintenances.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Aucune maintenance</td></tr>
              )}
            </tbody>
          </table>
          {maintenances.length > 20 && (
            <p className="text-xs text-gray-400 text-center py-2">20 sur {maintenances.length} affichées</p>
          )}
        </div>
      </div>
    </div>
  );
}
