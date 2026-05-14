import { useState, useEffect } from 'react';

const STATUTS = [
  { value: 'AVAILABLE',    label: 'Disponible' },
  { value: 'IN_USE',       label: 'En mission' },
  { value: 'MAINTENANCE',  label: 'Maintenance' },
  { value: 'RETIRED',      label: 'Retiré' },
];

export default function VehicleForm({ initial, onSubmit, onCancel, loading, error }) {
  const [form, setForm] = useState({
    immatriculation: '',
    marque: '',
    modele: '',
    statut: 'AVAILABLE',
  });

  useEffect(() => {
    if (initial) {
      setForm({
        immatriculation: initial.immatriculation || '',
        marque: initial.marque || '',
        modele: initial.modele || '',
        statut: initial.statut || 'AVAILABLE',
      });
    }
  }, [initial]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const inputCls = 'w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all placeholder:text-slate-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
          Immatriculation *
        </label>
        <input
          name="immatriculation"
          value={form.immatriculation}
          onChange={handleChange}
          required
          placeholder="AA-001-RN"
          className={`${inputCls} font-mono`}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Marque *</label>
          <input
            name="marque"
            value={form.marque}
            onChange={handleChange}
            required
            placeholder="Renault"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Modèle *</label>
          <input
            name="modele"
            value={form.modele}
            onChange={handleChange}
            required
            placeholder="Kangoo"
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Statut *</label>
        <select name="statut" value={form.statut} onChange={handleChange} className={inputCls}>
          {STATUTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2"
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2.5 rounded-xl text-sm transition-all"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
