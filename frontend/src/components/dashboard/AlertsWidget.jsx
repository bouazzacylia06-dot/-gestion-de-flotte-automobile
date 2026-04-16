import { useQuery } from '@apollo/client';
import { GET_EVENEMENTS } from '../../api/queries';

export default function AlertsWidget() {
  const { data, loading, error } = useQuery(GET_EVENEMENTS, {
    pollInterval: 10000,
  });

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Alertes récentes</h3>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-gray-700 mb-2">Alertes récentes</h3>
        <p className="text-red-500 text-sm">Erreur de chargement</p>
      </div>
    );
  }

  const alerts = (data?.evenements || [])
    .filter((e) => e.type?.includes('ALERTE') || e.type?.includes('ZONE'))
    .slice(0, 5);

  return (
    <div className="bg-white rounded-xl border p-4">
      <h3 className="font-semibold text-gray-700 mb-3">
        Alertes récentes
        {alerts.length > 0 && (
          <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
            {alerts.length}
          </span>
        )}
      </h3>
      {alerts.length === 0 ? (
        <p className="text-sm text-gray-400">Aucune alerte</p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.id} className="flex items-start gap-2 text-sm">
              <span className="text-red-500 mt-0.5">⚠</span>
              <div>
                <span className="font-medium text-gray-700">{a.type}</span>
                <span className="text-gray-500"> — {a.description}</span>
                <p className="text-xs text-gray-400">
                  {new Date(a.date).toLocaleString('fr-FR')}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
