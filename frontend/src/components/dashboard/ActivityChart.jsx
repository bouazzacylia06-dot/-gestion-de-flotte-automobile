import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useMaintenances } from '../../hooks/useMaintenances';
import { useVehicules } from '../../hooks/useVehicles';

function buildActivityData(maintenances) {
  const counts = {};
  for (let h = 0; h < 24; h++) {
    counts[`${h}h`] = { heure: `${h}h`, maintenances: 0, vehicules: 0 };
  }
  maintenances.forEach((m) => {
    const h = new Date(m.date).getHours();
    counts[`${h}h`].maintenances += 1;
  });
  return Object.values(counts);
}

export default function ActivityChart() {
  const { maintenances, loading } = useMaintenances();
  const { vehicules } = useVehicules();

  const data = buildActivityData(maintenances);
  // Ajoute le compte total de véhicules actifs à chaque heure (agrégation simple)
  const actifs = vehicules.filter(
    (v) => v.statut === 'actif' || v.statut === 'en_service'
  ).length;
  data.forEach((d) => { d.vehicules = actifs; });

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-4 h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-4">
      <h3 className="font-semibold text-gray-700 mb-4">Activité par heure (aujourd'hui)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="heure"
            tick={{ fontSize: 11 }}
            interval={3}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="maintenances" name="Maintenances" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
          <Bar dataKey="vehicules"   name="Véh. actifs"  fill="#22c55e" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
