import { useState, useEffect } from 'react';

const TYPES   = ['vidange', 'freins', 'pneus', 'révision', 'carrosserie', 'électrique', 'autre'];
const STATUTS = ['planifie', 'en_cours', 'termine', 'annule'];

export default function MaintenanceForm({ initial, vehicules = [], onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    vehicleId: '',
    date: new Date().toISOString().slice(0, 16),
    type: 'révision',
    status: 'planifie',
    cost: '',
  });

  useEffect(() => {
    if (initial) {
      setForm({
        vehicleId: initial.vehicleId || '',
        date: initial.date ? initial.date.slice(0, 16) : form.date,
        type: initial.type || 'révision',
        status: initial.status || 'planifie',
        cost: initial.cost ?? '',
      });
    }
  }, [initial]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      vehicleId: form.vehicleId,
      date: new Date(form.date).toISOString(),
      type: form.type,
      status: form.status,
      cost: parseFloat(form.cost) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Véhicule *</label>
        <select
          name="vehicleId"
          value={form.vehicleId}
          onChange={handleChange}
          required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
        >
          <option value="">Sélectionner un véhicule</option>
          {vehicules.map((v) => (
            <option key={v.id} value={v.id}>
              {v.immatriculation} — {v.marque} {v.modele}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Statut *</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date planifiée *</label>
          <input
            type="datetime-local"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Coût estimé (€)</label>
          <input
            type="number"
            name="cost"
            value={form.cost}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm"
        >
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
