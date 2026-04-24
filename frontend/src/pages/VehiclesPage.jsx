import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { useVehicules, useCreateVehicule, useUpdateVehicule, useDeleteVehicule } from '../hooks/useVehicles';
import VehicleList from '../components/vehicles/VehicleList';
import VehicleForm from '../components/vehicles/VehicleForm';

function Modal({ title, icon, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-white to-gray-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            {icon && <span className="text-xl">{icon}</span>}
            <h2 className="font-semibold text-gray-800">{title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded" />
        </td>
      ))}
    </tr>
  );
}

export default function VehiclesPage() {
  const { hasRole } = useAuth();
  const { vehicules, loading, error } = useVehicules();
  const { createVehicule, loading: creating, error: createError } = useCreateVehicule();
  const { updateVehicule, loading: updating, error: updateError } = useUpdateVehicule();
  const { deleteVehicule } = useDeleteVehicule();

  const [modal, setModal] = useState(null);
  const [formError, setFormError] = useState('');

  const canEdit   = hasRole('admin') || hasRole('manager');
  const canDelete = hasRole('admin');

  const handleCreate = async (formData) => {
    setFormError('');
    try {
      const { id: _id, ...input } = formData;
      await createVehicule({ variables: { input } });
      setModal(null);
    } catch (err) {
      setFormError(err.message || 'Erreur lors de la création');
    }
  };

  const handleUpdate = async (formData) => {
    setFormError('');
    try {
      const { id: _id, ...input } = formData;
      await updateVehicule({ variables: { id: modal.vehicule.id, input } });
      setModal(null);
    } catch (err) {
      setFormError(err.message || 'Erreur lors de la modification');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce véhicule définitivement ?')) {
      await deleteVehicule({ variables: { id } });
    }
  };

  const openCreate = () => {
    setFormError('');
    setModal('create');
  };

  const openEdit = (v) => {
    setFormError('');
    setModal({ vehicule: v });
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600">
        Erreur : {error.message}
      </div>
    );
  }

  const actifs   = vehicules.filter((v) => ['IN_USE', 'AVAILABLE', 'actif', 'en_service', 'in_use', 'available'].includes(v.statut)).length;
  const enMaint  = vehicules.filter((v) => ['MAINTENANCE', 'maintenance', 'en_maintenance'].includes(v.statut)).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Véhicules</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? '…' : `${vehicules.length} véhicule${vehicules.length > 1 ? 's' : ''} · ${actifs} actif${actifs > 1 ? 's' : ''} · ${enMaint} en maintenance`}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau véhicule
          </button>
        )}
      </div>

      {loading ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Immatriculation', 'Marque', 'Modèle', 'Statut', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left">
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      ) : (
        <VehicleList
          vehicules={vehicules}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={openEdit}
          onDelete={canDelete ? handleDelete : undefined}
        />
      )}

      {modal === 'create' && (
        <Modal title="Nouveau véhicule" icon="🚗" onClose={() => setModal(null)}>
          <VehicleForm
            onSubmit={handleCreate}
            onCancel={() => setModal(null)}
            loading={creating}
            error={formError || createError?.message}
          />
        </Modal>
      )}

      {modal?.vehicule && (
        <Modal title="Modifier le véhicule" icon="✏️" onClose={() => setModal(null)}>
          <VehicleForm
            initial={modal.vehicule}
            onSubmit={handleUpdate}
            onCancel={() => setModal(null)}
            loading={updating}
            error={formError || updateError?.message}
          />
        </Modal>
      )}
    </div>
  );
}
