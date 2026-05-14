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

const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-300 font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

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
      <div className="bg-fleet-card rounded-xl border border-fleet-border p-4 h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-fleet-card rounded-xl border border-fleet-border p-4">
      <h3 className="font-semibold text-slate-200 mb-4">Activité par heure (aujourd'hui)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="heure"
            tick={{ fontSize: 11, fill: '#64748b' }}
            interval={3}
            axisLine={{ stroke: '#1e293b' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={{ stroke: '#1e293b' }}
            tickLine={false}
          />
          <Tooltip content={<DarkTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
          />
          <Bar dataKey="maintenances" name="Maintenances" fill="#7c3aed" radius={[3, 3, 0, 0]} />
          <Bar dataKey="vehicules"   name="Véh. actifs"  fill="#0ea5e9" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
