import { useQuery } from '@apollo/client';
import { GET_GEO_ALERTES } from '../../api/queries';

const LABEL = {
  ZONE_EXIT: 'Sortie de zone',
  FORBIDDEN: 'Zone interdite',
  SPEED:     'Excès de vitesse',
};

export default function AlertsWidget() {
  const { data, loading, error } = useQuery(GET_GEO_ALERTES, {
    variables: { limit: 20 },
    pollInterval: 10000,
  });

  if (loading) {
    return (
      <div className="bg-fleet-card rounded-xl border border-fleet-border p-4">
        <h3 className="font-semibold text-slate-200 mb-3">Alertes géofencing</h3>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-slate-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-fleet-card rounded-xl border border-fleet-border p-4">
        <h3 className="font-semibold text-slate-200 mb-2">Alertes géofencing</h3>
        <p className="text-red-400 text-sm">Erreur de chargement</p>
      </div>
    );
  }

  const alerts = (data?.geoAlertes || [])
    .filter((a) => Date.now() - new Date(a.createdAt).getTime() < 86400000)
    .slice(0, 5);

  return (
    <div className="bg-fleet-card rounded-xl border border-fleet-border p-4">
      <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
        Alertes géofencing
        {alerts.length > 0 && (
          <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
            {alerts.length}
          </span>
        )}
      </h3>
      {alerts.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune alerte (24h)</p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.id} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-red-500/5 border border-red-500/10">
              <span className="text-red-400 mt-0.5 flex-shrink-0">⚠</span>
              <div className="min-w-0">
                <span className="font-medium text-slate-200">{LABEL[a.type] || a.type}</span>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  Véhicule #{a.vehicleId?.slice(-8)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(a.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
