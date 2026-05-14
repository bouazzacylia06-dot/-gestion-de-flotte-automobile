import { useState } from 'react';
import { Polyline } from 'react-leaflet';
import { usePositionHistory } from '../../hooks/useLocalisation';

const RANGES = [
  { label: '1 heure',  hours: 1 },
  { label: '6 heures', hours: 6 },
  { label: '24 heures',hours: 24 },
];

export default function TrajectoryLayer({ vehicleId }) {
  const [rangeHours, setRangeHours] = useState(1);

  const to   = new Date().toISOString();
  const from = new Date(Date.now() - rangeHours * 3600 * 1000).toISOString();

  const { history, loading } = usePositionHistory(vehicleId, from, to, 200);

  const positions = history.map((p) => [p.latitude, p.longitude]);

  return (
    <>
      {/* Sélecteur plage horaire */}
      <div
        style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}
        className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-2 flex gap-2"
      >
        {RANGES.map((r) => (
          <button
            key={r.hours}
            onClick={() => setRangeHours(r.hours)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              rangeHours === r.hours
                ? 'bg-violet-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {r.label}
          </button>
        ))}
        {loading && <span className="text-xs text-slate-500 self-center">…</span>}
      </div>

      {positions.length > 1 && (
        <Polyline
          positions={positions}
          pathOptions={{ color: '#7c3aed', weight: 3, opacity: 0.8 }}
        />
      )}
    </>
  );
}
