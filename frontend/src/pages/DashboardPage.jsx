import { useQuery } from '@apollo/client';
import { useVehicules } from '../hooks/useVehicles';
import { useMaintenances } from '../hooks/useMaintenances';
import { GET_CONDUCTEURS, GET_EVENEMENTS } from '../api/queries';
import StatsCard from '../components/dashboard/StatsCard';
import AlertsWidget from '../components/dashboard/AlertsWidget';
import ActivityChart from '../components/dashboard/ActivityChart';
import FleetMap from '../components/map/FleetMap';

export default function DashboardPage() {
  const { vehicules, loading: vLoading } = useVehicules();
  const { maintenances, loading: mLoading } = useMaintenances();
  const { data: condData } = useQuery(GET_CONDUCTEURS);
  const { data: evtData }  = useQuery(GET_EVENEMENTS, { pollInterval: 30000 });

  const actifs              = vehicules.filter((v) => ['actif', 'en_service', 'in_use', 'available'].includes(v.statut?.toLowerCase())).length;
  const maintenancesPlannees = maintenances.filter((m) => m.status === 'planifie').length;
  const conducteursActifs   = (condData?.conducteurs || []).filter((c) => c.statut === 'actif').length;
  const alertes24h          = (evtData?.evenements || [])
    .filter((e) => {
      const diff = Date.now() - new Date(e.date).getTime();
      return diff < 86400000 && (e.type?.includes('ZONE') || e.type?.includes('ALERTE'));
    }).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Véhicules actifs"
          value={vLoading ? '…' : `${actifs} / ${vehicules.length}`}
          icon="🚗"
          color="green"
          subtitle="En service actuellement"
        />
        <StatsCard
          title="Alertes géofencing"
          value={alertes24h}
          icon="⚠️"
          color="red"
          subtitle="Dernières 24h"
        />
        <StatsCard
          title="Maintenances planifiées"
          value={mLoading ? '…' : maintenancesPlannees}
          icon="🔧"
          color="yellow"
          subtitle="En attente"
        />
        <StatsCard
          title="Conducteurs actifs"
          value={conducteursActifs}
          icon="👤"
          color="sky"
          subtitle="En service"
        />
      </div>

      {/* Carte flotte */}
      <FleetMap height="400px" />

      {/* Graphique + Alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityChart />
        </div>
        <AlertsWidget />
      </div>
    </div>
  );
}
