import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { useVehicules, useCreateVehicule, useUpdateVehicule, useDeleteVehicule } from '../hooks/useVehicles';
import VehicleList from '../components/vehicles/VehicleList';
import VehicleForm from '../components/vehicles/VehicleForm';

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

export default function VehiclesPage() {
  const { hasRole } = useAuth();
  const { vehicules, loading, error } = useVehicules();
  const { createVehicule, loading: creating } = useCreateVehicule();
  const { updateVehicule, loading: updating } = useUpdateVehicule();
  const { deleteVehicule } = useDeleteVehicule();

  const [modal, setModal] = useState(null); // null | 'create' | { vehicule }
  const canEdit = hasRole('admin');

  const handleCreate = async (input) => {
    await createVehicule({ variables: { input } });
    setModal(null);
  };

  const handleUpdate = async (input) => {
    await updateVehicule({ variables: { id: modal.vehicule.id, input } });
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce véhicule ?')) {
      await deleteVehicule({ variables: { id } });
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
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600">
        Erreur : {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Véhicules</h1>
        {canEdit && (
          <button
            onClick={() => setModal('create')}
            className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            + Nouveau véhicule
          </button>
        )}
      </div>

      <VehicleList
        vehicules={vehicules}
        canEdit={canEdit}
        onEdit={(v) => setModal({ vehicule: v })}
        onDelete={handleDelete}
      />

      {modal === 'create' && (
        <Modal title="Nouveau véhicule" onClose={() => setModal(null)}>
          <VehicleForm
            onSubmit={handleCreate}
            onCancel={() => setModal(null)}
            loading={creating}
          />
        </Modal>
      )}

      {modal?.vehicule && (
        <Modal title="Modifier le véhicule" onClose={() => setModal(null)}>
          <VehicleForm
            initial={modal.vehicule}
            onSubmit={handleUpdate}
            onCancel={() => setModal(null)}
            loading={updating}
          />
        </Modal>
      )}
    </div>
  );
}
