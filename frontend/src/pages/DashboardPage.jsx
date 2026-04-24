import { useQuery } from '@apollo/client';
import { useVehicules } from '../hooks/useVehicles';
import { useMaintenances } from '../hooks/useMaintenances';
import { GET_CONDUCTEURS, GET_EVENEMENTS } from '../api/queries';
import StatsCard from '../components/dashboard/StatsCard';
import AlertsWidget from '../components/dashboard/AlertsWidget';
import ActivityChart from '../components/dashboard/ActivityChart';
import FleetMap from '../components/map/FleetMap';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'à l\'instant';
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'hier' : `il y a ${d}j`;
}

const EVT_ICON = {
  MAINTENANCE_CREATED:   { icon: '🔧', cls: 'text-yellow-600 bg-yellow-50' },
  MAINTENANCE_COMPLETED: { icon: '✅', cls: 'text-green-600 bg-green-50' },
  ZONE_EXIT:             { icon: '🚨', cls: 'text-red-600 bg-red-50' },
  ALERTE:                { icon: '⚠️', cls: 'text-orange-600 bg-orange-50' },
};

export default function DashboardPage() {
  const { vehicules, loading: vLoading } = useVehicules();
  const { maintenances, loading: mLoading } = useMaintenances();
  const { data: condData } = useQuery(GET_CONDUCTEURS);
  const { data: evtData }  = useQuery(GET_EVENEMENTS, { pollInterval: 30000 });

  const actifs               = vehicules.filter((v) => ['actif', 'en_service', 'in_use', 'available', 'IN_USE', 'AVAILABLE'].includes(v.statut)).length;
  const maintenancesPlannees = maintenances.filter((m) => ['planifie', 'planifiee', 'PLANIFIE', 'PLANIFIEE', 'scheduled'].includes(m.status)).length;
  const conducteursActifs    = (condData?.conducteurs || []).filter((c) => c.statut === 'actif').length;
  const alertes24h           = (evtData?.evenements || []).filter((e) => {
    const diff = Date.now() - new Date(e.date).getTime();
    return diff < 86400000 && (e.type?.includes('ZONE') || e.type?.includes('ALERTE'));
  }).length;

  const recentEvents = [...(evtData?.evenements || [])]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Données en temps réel
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Véhicules actifs"
          value={vLoading ? '…' : `${actifs} / ${vehicules.length}`}
          icon="🚗"
          color="green"
          subtitle="En service actuellement"
          trend={+5}
        />
        <StatsCard
          title="Alertes géofencing"
          value={alertes24h}
          icon="⚠️"
          color="red"
          subtitle="Dernières 24h"
          trend={alertes24h > 0 ? +alertes24h : 0}
        />
        <StatsCard
          title="Maintenances planifiées"
          value={mLoading ? '…' : maintenancesPlannees}
          icon="🔧"
          color="yellow"
          subtitle="En attente"
          trend={-2}
        />
        <StatsCard
          title="Conducteurs actifs"
          value={conducteursActifs}
          icon="👤"
          color="sky"
          subtitle="En service"
          trend={+1}
        />
      </div>

      {/* Carte flotte */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        <FleetMap height="420px" />
      </div>

      {/* Graphique + Alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityChart />
        </div>
        <AlertsWidget />
      </div>

      {/* Activité récente */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Activité récente</h3>
          <span className="text-xs text-gray-400">{recentEvents.length} événements</span>
        </div>
        <div className="divide-y divide-gray-50">
          {recentEvents.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">Aucun événement récent</div>
          ) : (
            recentEvents.map((e) => {
              const cfg = EVT_ICON[e.type] || { icon: '📋', cls: 'text-gray-600 bg-gray-50' };
              return (
                <div key={e.id} className="flex items-start gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base ${cfg.cls}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{e.type?.replace(/_/g, ' ')}</p>
                    {e.description && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{e.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(e.date)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
