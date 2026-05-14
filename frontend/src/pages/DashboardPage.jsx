import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { useVehicules } from '../hooks/useVehicles';
import { useMaintenances } from '../hooks/useMaintenances';
import { GET_CONDUCTEURS, GET_EVENEMENTS, GET_GEO_ALERTES } from '../api/queries';
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
  MAINTENANCE_CREATED:   { icon: '🔧', cls: 'text-yellow-400 bg-yellow-500/10' },
  MAINTENANCE_COMPLETED: { icon: '✅', cls: 'text-green-400 bg-green-500/10' },
  ZONE_EXIT:             { icon: '🚨', cls: 'text-red-400 bg-red-500/10' },
  ALERTE:                { icon: '⚠️', cls: 'text-orange-400 bg-orange-500/10' },
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const { vehicules, loading: vLoading } = useVehicules();
  const { maintenances, loading: mLoading } = useMaintenances();
  const { data: condData } = useQuery(GET_CONDUCTEURS);
  const { data: evtData }  = useQuery(GET_EVENEMENTS, { pollInterval: 30000 });
  const { data: geoData }  = useQuery(GET_GEO_ALERTES, { variables: { limit: 100 }, pollInterval: 30000 });

  const actifs               = vehicules.filter((v) => ['actif', 'en_service', 'in_use', 'available', 'IN_USE', 'AVAILABLE'].includes(v.statut)).length;
  const maintenancesPlannees = maintenances.filter((m) => ['planifie', 'planifiee', 'PLANIFIE', 'PLANIFIEE', 'scheduled'].includes(m.status)).length;
  const conducteursActifs    = (condData?.conducteurs || []).filter((c) => c.statut === 'actif').length;
  const alertes24h           = (geoData?.geoAlertes || []).filter((a) =>
    a.type === 'ZONE_EXIT' && Date.now() - new Date(a.createdAt).getTime() < 86400000
  ).length;

  const recentEvents = [...(evtData?.evenements || [])]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('dashboard.title')}</h1>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {t('dashboard.realtimeData')}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title={t('dashboard.activeVehicles')}
          value={vLoading ? '…' : `${actifs} / ${vehicules.length}`}
          icon="🚗"
          color="green"
          subtitle={t('dashboard.subtitle.activeVehicles')}
          trend={+5}
        />
        <StatsCard
          title={t('dashboard.geoAlerts')}
          value={alertes24h}
          icon="⚠️"
          color="red"
          subtitle={t('dashboard.subtitle.geoAlerts')}
          trend={alertes24h > 0 ? +alertes24h : 0}
        />
        <StatsCard
          title={t('dashboard.plannedMaintenance')}
          value={mLoading ? '…' : maintenancesPlannees}
          icon="🔧"
          color="yellow"
          subtitle={t('dashboard.subtitle.maintenance')}
          trend={-2}
        />
        <StatsCard
          title={t('dashboard.activeDrivers')}
          value={conducteursActifs}
          icon="👤"
          color="sky"
          subtitle={t('dashboard.subtitle.drivers')}
          trend={+1}
        />
      </div>

      {/* Carte flotte */}
      <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-card">
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
      <div className="bg-fleet-card rounded-2xl border border-fleet-border shadow-card">
        <div className="px-5 py-4 border-b border-fleet-border flex items-center justify-between">
          <h3 className="font-semibold text-slate-200">{t('dashboard.recentActivity')}</h3>
          <span className="text-xs text-slate-500">{recentEvents.length} {t('dashboard.events')}</span>
        </div>
        <div className="divide-y divide-fleet-border">
          {recentEvents.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">{t('dashboard.noRecentEvents')}</div>
          ) : (
            recentEvents.map((e) => {
              const cfg = EVT_ICON[e.type] || { icon: '📋', cls: 'text-slate-400 bg-slate-700/40' };
              return (
                <div key={e.id} className="flex items-start gap-4 px-5 py-3 hover:bg-white/5 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base ${cfg.cls}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200">{e.type?.replace(/_/g, ' ')}</p>
                    {e.description && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">{e.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0">{timeAgo(e.date)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
