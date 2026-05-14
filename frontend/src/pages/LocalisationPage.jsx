import { useState } from 'react';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery, useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/useAuth';
import { useVehicules } from '../hooks/useVehicles';
import { useLastPosition } from '../hooks/useLocalisation';
import { useMaintenances } from '../hooks/useMaintenances';
import { GET_GEO_ALERTES, GET_CONDUCTEURS, CREATE_GEO_ALERTE } from '../api/queries';
import VehicleMarker from '../components/map/VehicleMarker';
import MaintenanceBadge from '../components/maintenance/MaintenanceBadge';

function VehicleMarkerLive({ vehicule }) {
  const { position } = useLastPosition(vehicule.id, 3000);
  if (!position) return null;
  return <VehicleMarker vehicule={vehicule} position={position} />;
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

function GeoAlerteForm({ vehicules, onSuccess, onCancel }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ vehicleId: '', type: '', zoneId: '', latitude: '', longitude: '' });
  const [success, setSuccess] = useState(false);
  const [createGeoAlerte, { loading, error }] = useMutation(CREATE_GEO_ALERTE, {
    refetchQueries: [{ query: GET_GEO_ALERTES, variables: { limit: 20 } }],
  });

  const inputCls = 'w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all placeholder:text-slate-500';

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const input = {
      vehicleId: form.vehicleId,
      type: form.type,
      zoneId: form.zoneId || null,
      latitude:  form.latitude  ? parseFloat(form.latitude)  : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
    };
    await createGeoAlerte({ variables: { input } });
    setSuccess(true);
    setTimeout(() => onSuccess(), 1500);
  };

  return (
    <div className="bg-fleet-card rounded-2xl border border-violet-500/30 shadow-card p-5">
      <h3 className="font-semibold text-slate-200 mb-4">{t('localisation.addAlert.title')}</h3>
      {success ? (
        <p className="text-green-400 text-center py-4">✅ {t('localisation.addAlert.success')}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t('localisation.addAlert.vehicle')} *</label>
            <select name="vehicleId" value={form.vehicleId} onChange={handleChange} required className={inputCls}>
              <option value="">— Sélectionner</option>
              {vehicules.map((v) => (
                <option key={v.id} value={v.id}>{v.immatriculation} — {v.marque} {v.modele}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t('localisation.addAlert.type')} *</label>
            <select name="type" value={form.type} onChange={handleChange} required className={inputCls}>
              <option value="">— Sélectionner</option>
              <option value="ZONE_EXIT">{t('localisation.addAlert.types.ZONE_EXIT')}</option>
              <option value="FORBIDDEN">{t('localisation.addAlert.types.FORBIDDEN')}</option>
              <option value="SPEED">{t('localisation.addAlert.types.SPEED')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t('localisation.addAlert.zone')}</label>
            <input name="zoneId" value={form.zoneId} onChange={handleChange} className={inputCls} placeholder="Zone A, Zone Nord..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t('localisation.addAlert.lat')}</label>
              <input name="latitude" type="number" step="any" value={form.latitude} onChange={handleChange} className={inputCls} placeholder="49.44..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t('localisation.addAlert.lon')}</label>
              <input name="longitude" type="number" step="any" value={form.longitude} onChange={handleChange} className={inputCls} placeholder="1.09..." />
            </div>
          </div>
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">⚠️ {error.message}</div>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? '…' : t('localisation.addAlert.submit')}
            </button>
            <button type="button" onClick={onCancel}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2.5 rounded-xl text-sm transition-all">
              {t('localisation.addAlert.cancel')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function LocalisationPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const { vehicules, loading } = useVehicules();
  const { maintenances } = useMaintenances();
  const { data: condData } = useQuery(GET_CONDUCTEURS);
  const { data: alertData } = useQuery(GET_GEO_ALERTES, {
    variables: { limit: 20 },
    pollInterval: 10000,
  });
  const [showAlertForm, setShowAlertForm] = useState(false);

  const conducteurs = condData?.conducteurs || [];
  const geoAlertes  = alertData?.geoAlertes || [];
  const alertes24h  = geoAlertes.filter((a) => Date.now() - new Date(a.createdAt).getTime() < 86400000);

  // Vehicles with a recent ZONE_EXIT alert are treated as "hors_zone" regardless of DB statut
  const vehicleIdsHorsZone = new Set(
    alertes24h.filter((a) => a.type === 'ZONE_EXIT').map((a) => a.vehicleId)
  );
  const vehiculesEffectifs = vehicules.map((v) =>
    vehicleIdsHorsZone.has(v.id) ? { ...v, statut: 'hors_zone' } : v
  );

  const maintenancesPlanifiees = maintenances.filter((m) =>
    ['planifie', 'planifiee', 'PLANIFIE', 'PLANIFIEE'].includes(m.status)
  );
  const vehiculesHorsZone = vehiculesEffectifs.filter((v) => ['hors_zone', 'alerte'].includes(v.statut?.toLowerCase()));

  const canManageAlerts = hasRole('admin') || hasRole('manager');

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-white">{t('localisation.title')}</h1>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          {t('localisation.realtimeUpdate')}
        </div>
      </div>

      {/* Légende */}
      <div className="flex gap-4 text-xs text-slate-400 flex-wrap">
        {[
          { color: 'bg-green-500',  label: t('localisation.legend.inService') },
          { color: 'bg-blue-500',   label: t('localisation.legend.available') },
          { color: 'bg-red-500',    label: t('localisation.legend.outOfZone') },
          { color: 'bg-yellow-500', label: t('localisation.legend.maintenance') },
          { color: 'bg-gray-500',   label: t('localisation.legend.inactive') },
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
            <div className="flex items-center justify-center bg-fleet-card border border-fleet-border rounded-2xl" style={{ height: '600px' }}>
              <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden shadow-card border border-slate-800" style={{ height: '600px' }}>
              <MapContainer center={[49.4431, 1.0993]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {vehiculesEffectifs.map((v) => <VehicleMarkerLive key={v.id} vehicule={v} />)}
                {alertes24h.filter((a) => a.latitude && a.longitude).map((a) => (
                  <Circle
                    key={a.id}
                    center={[a.latitude, a.longitude]}
                    radius={200}
                    pathOptions={{
                      color: a.type === 'ZONE_EXIT' ? '#ef4444' : a.type === 'SPEED' ? '#eab308' : '#f97316',
                      fillColor: a.type === 'ZONE_EXIT' ? '#ef4444' : a.type === 'SPEED' ? '#eab308' : '#f97316',
                      fillOpacity: 0.15,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: '150px', fontSize: '13px' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          {a.type === 'ZONE_EXIT' ? '🚨 Sortie de zone' : a.type === 'SPEED' ? '⚡ Excès de vitesse' : '⚠️ Zone interdite'}
                        </p>
                        <p style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: '11px' }}>Véhicule #{a.vehicleId?.slice(-8)}</p>
                        <p style={{ color: '#9ca3af', fontSize: '11px', marginTop: '2px' }}>{new Date(a.createdAt).toLocaleString('fr-FR')}</p>
                      </div>
                    </Popup>
                  </Circle>
                ))}
              </MapContainer>
            </div>
          )}
        </div>

        {/* Panneau latéral */}
        <div className="w-full lg:w-72 flex flex-col gap-4">
          {/* Alertes géofencing */}
          <div className="bg-fleet-card rounded-2xl border border-fleet-border shadow-card p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                ⚠️ {t('localisation.alerts')}
              </h3>
              <div className="flex items-center gap-1.5">
                {alertes24h.length > 0 && (
                  <span className="bg-red-500/15 text-red-400 border border-red-500/20 text-xs font-bold px-2 py-0.5 rounded-full">
                    {alertes24h.length}
                  </span>
                )}
                {canManageAlerts && (
                  <button
                    onClick={() => setShowAlertForm((f) => !f)}
                    title={t('localisation.addAlert.title')}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 hover:text-violet-300 text-sm font-bold transition-colors border border-violet-500/20"
                  >
                    +
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-3">{t('localisation.alertsLast24h')}</p>
            {alertes24h.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">✅ {t('localisation.noAlerts')}</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alertes24h.map((a) => (
                  <div key={a.id} className={`rounded-xl border p-2.5 text-xs ${
                    a.type === 'ZONE_EXIT'
                      ? 'bg-red-500/10 border-red-500/20 text-red-400'
                      : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                  }`}>
                    <p className="font-semibold">
                      {a.type === 'ZONE_EXIT' ? `🚨 ${t('localisation.addAlert.types.ZONE_EXIT')}` : `⚠️ ${t('localisation.addAlert.types.FORBIDDEN')}`}
                    </p>
                    <p className="text-slate-500 font-mono mt-0.5">Véhicule #{a.vehicleId?.slice(-8)}</p>
                    <p className="text-slate-500 mt-0.5">{new Date(a.createdAt).toLocaleString('fr-FR')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Véhicules hors zone */}
          {vehiculesHorsZone.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
              <h3 className="font-semibold text-red-400 mb-2">🚨 {t('localisation.outOfZone')} ({vehiculesHorsZone.length})</h3>
              <div className="space-y-1">
                {vehiculesHorsZone.map((v) => (
                  <p key={v.id} className="text-xs text-red-300 font-mono">{v.immatriculation} — {v.marque} {v.modele}</p>
                ))}
              </div>
            </div>
          )}

          {/* Maintenances planifiées */}
          <div className="bg-fleet-card rounded-2xl border border-fleet-border shadow-card p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">🔧 {t('localisation.planned')}</h3>
              {maintenancesPlanifiees.length > 0 && (
                <span className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-xs font-bold px-2 py-0.5 rounded-full">
                  {maintenancesPlanifiees.length}
                </span>
              )}
            </div>
            {maintenancesPlanifiees.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-3">✅ {t('localisation.noPlanned')}</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto mt-2">
                {maintenancesPlanifiees.slice(0, 5).map((m) => (
                  <div key={m.id} className="text-xs text-slate-400 border border-fleet-border rounded-lg p-2 hover:bg-white/5 transition-colors">
                    <p className="font-medium capitalize text-slate-300">{m.type}</p>
                    <p className="text-slate-500">{new Date(m.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                ))}
                {maintenancesPlanifiees.length > 5 && (
                  <p className="text-xs text-slate-500 text-center">+ {maintenancesPlanifiees.length - 5} autres</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formulaire de création d'alerte géofencing */}
      {showAlertForm && canManageAlerts && (
        <GeoAlerteForm
          vehicules={vehicules}
          onSuccess={() => setShowAlertForm(false)}
          onCancel={() => setShowAlertForm(false)}
        />
      )}
    </div>
  );
}
