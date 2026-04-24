import { useState, useEffect } from 'react';

const TYPES = [
  { value: 'vidange',            label: 'Vidange' },
  { value: 'révision',           label: 'Révision' },
  { value: 'pneus',              label: 'Pneus' },
  { value: 'freins',             label: 'Freins' },
  { value: 'controle_technique', label: 'Contrôle technique' },
  { value: 'batterie',           label: 'Batterie' },
  { value: 'carrosserie',        label: 'Carrosserie' },
  { value: 'électrique',         label: 'Électrique' },
  { value: 'autre',              label: 'Autre' },
];

const STATUTS = [
  { value: 'planifie',  label: 'Planifiée' },
  { value: 'en_cours',  label: 'En cours' },
  { value: 'termine',   label: 'Terminée' },
  { value: 'annule',    label: 'Annulée' },
];

export default function MaintenanceForm({ initial, vehicules = [], onSubmit, onCancel, loading, error }) {
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
        date: initial.date ? initial.date.slice(0, 16) : new Date().toISOString().slice(0, 16),
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

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Véhicule *</label>
        <select
          name="vehicleId"
          value={form.vehicleId}
          onChange={handleChange}
          required
          className={inputCls}
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
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Type *</label>
          <select name="type" value={form.type} onChange={handleChange} className={inputCls}>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Statut *</label>
          <select name="status" value={form.status} onChange={handleChange} className={inputCls}>
            {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date planifiée *</label>
          <input
            type="datetime-local"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Coût estimé (€)</label>
          <input
            type="number"
            name="cost"
            value={form.cost}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="0.00"
            className={inputCls}
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2"
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-all"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
