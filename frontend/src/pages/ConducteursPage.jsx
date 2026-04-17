import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '../auth/useAuth';
import { useVehicules } from '../hooks/useVehicles';
import {
  GET_CONDUCTEURS,
  CREATE_CONDUCTEUR,
  UPDATE_CONDUCTEUR,
  DELETE_CONDUCTEUR,
} from '../api/queries';

const STATUTS = ['actif', 'inactif', 'en_conge'];

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ConducteurForm({ initial, vehicules = [], onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(
    initial || { nom: '', prenom: '', numeroPermis: '', statut: 'actif', vehiculeId: '' }
  );

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
          <input name="nom" value={form.nom} onChange={handleChange} required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
          <input name="prenom" value={form.prenom} onChange={handleChange} required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">N° Permis *</label>
        <input name="numeroPermis" value={form.numeroPermis} onChange={handleChange} required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Statut *</label>
          <select name="statut" value={form.statut} onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none">
            {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Véhicule assigné</label>
          <select name="vehiculeId" value={form.vehiculeId || ''} onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-400 focus:outline-none">
            <option value="">— Aucun —</option>
            {vehicules.map((v) => (
              <option key={v.id} value={v.id}>
                {v.immatriculation} ({v.marque} {v.modele})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="flex-1 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm">
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" onClick={onCancel}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm">
          Annuler
        </button>
      </div>
    </form>
  );
}

export default function ConducteursPage() {
  const { hasRole } = useAuth();
  const { data, loading, error } = useQuery(GET_CONDUCTEURS);
  const [createConducteur, { loading: creating }] = useMutation(CREATE_CONDUCTEUR, {
    refetchQueries: [{ query: GET_CONDUCTEURS }],
  });
  const [updateConducteur, { loading: updating }] = useMutation(UPDATE_CONDUCTEUR, {
    refetchQueries: [{ query: GET_CONDUCTEURS }],
  });
  const [deleteConducteur] = useMutation(DELETE_CONDUCTEUR, {
    refetchQueries: [{ query: GET_CONDUCTEURS }],
  });

  const [modal, setModal] = useState(null);
  const canEdit = hasRole('admin') || hasRole('manager');
  const { vehicules } = useVehicules();
  const conducteurs = data?.conducteurs || [];

  const handleCreate = async (input) => {
    await createConducteur({ variables: { input } });
    setModal(null);
  };

  const handleUpdate = async (input) => {
    await updateConducteur({ variables: { id: modal.conducteur.id, input } });
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce conducteur ?')) {
      await deleteConducteur({ variables: { id } });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600">Erreur : {error.message}</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Conducteurs</h1>
        {canEdit && (
          <button
            onClick={() => setModal('create')}
            className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            + Nouveau conducteur
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Nom</th>
              <th className="px-4 py-3 text-left">Prénom</th>
              <th className="px-4 py-3 text-left">N° Permis</th>
              <th className="px-4 py-3 text-left">Statut</th>
              {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {conducteurs.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{c.nom}</td>
                <td className="px-4 py-3 text-gray-600">{c.prenom}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.numeroPermis}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    c.statut === 'actif' ? 'bg-green-100 text-green-700'
                      : c.statut === 'inactif' ? 'bg-gray-100 text-gray-600'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {c.statut}
                  </span>
                </td>
                {canEdit && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setModal({ conducteur: c })}
                        className="text-xs text-gray-600 hover:underline">Modifier</button>
                      <button onClick={() => handleDelete(c.id)}
                        className="text-xs text-red-500 hover:underline">Supprimer</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {conducteurs.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Aucun conducteur</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal === 'create' && (
        <Modal title="Nouveau conducteur" onClose={() => setModal(null)}>
          <ConducteurForm vehicules={vehicules} onSubmit={handleCreate} onCancel={() => setModal(null)} loading={creating} />
        </Modal>
      )}

      {modal?.conducteur && (
        <Modal title="Modifier le conducteur" onClose={() => setModal(null)}>
          <ConducteurForm
            initial={modal.conducteur}
            vehicules={vehicules}
            onSubmit={handleUpdate}
            onCancel={() => setModal(null)}
            loading={updating}
          />
        </Modal>
      )}
    </div>
  );
}
