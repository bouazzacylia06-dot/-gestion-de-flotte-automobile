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
        className="bg-white rounded shadow p-2 flex gap-2"
      >
        {RANGES.map((r) => (
          <button
            key={r.hours}
            onClick={() => setRangeHours(r.hours)}
            className={`text-xs px-2 py-1 rounded ${
              rangeHours === r.hours
                ? 'bg-sky-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {r.label}
          </button>
        ))}
        {loading && <span className="text-xs text-gray-400 self-center">…</span>}
      </div>

      {positions.length > 1 && (
        <Polyline
          positions={positions}
          pathOptions={{ color: '#0ea5e9', weight: 3, opacity: 0.8 }}
        />
      )}
    </>
  );
}
