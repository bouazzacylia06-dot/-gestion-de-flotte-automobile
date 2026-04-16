import { useState, useEffect } from 'react';

const STATUTS = ['actif', 'en_service', 'maintenance', 'inactif'];

export default function VehicleForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    immatriculation: '',
    marque: '',
    modele: '',
    statut: 'actif',
  });

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Immatriculation *
        </label>
        <input
          name="immatriculation"
          value={form.immatriculation}
          onChange={handleChange}
          required
          placeholder="AB-123-CD"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Marque *</label>
          <input
            name="marque"
            value={form.marque}
            onChange={handleChange}
            required
            placeholder="Renault"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Modèle *</label>
          <input
            name="modele"
            value={form.modele}
            onChange={handleChange}
            required
            placeholder="Kangoo"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Statut *</label>
        <select
          name="statut"
          value={form.statut}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
        >
          {STATUTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
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
