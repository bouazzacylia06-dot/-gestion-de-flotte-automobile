import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { useMaintenances, useCreateMaintenance, useUpdateMaintenance, useDeleteMaintenance } from '../hooks/useMaintenances';
import { useVehicules } from '../hooks/useVehicles';
import MaintenanceTable from '../components/maintenance/MaintenanceTable';
import MaintenanceForm from '../components/maintenance/MaintenanceForm';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

const KANBAN_COLS = [
  { keys: ['planifie', 'planifiee'], label: 'Planifié', color: 'bg-blue-50 border-blue-200' },
  { keys: ['en_cours'],              label: 'En cours', color: 'bg-orange-50 border-orange-200' },
  { keys: ['termine', 'terminee'],   label: 'Terminé',  color: 'bg-green-50 border-green-200' },
];

export default function MaintenancePage() {
  const { hasRole } = useAuth();
  const { maintenances, loading, error } = useMaintenances();
  const { vehicules } = useVehicules();
  const { createMaintenance, loading: creating } = useCreateMaintenance();
  const { updateMaintenance, loading: updating } = useUpdateMaintenance();
  const { deleteMaintenance } = useDeleteMaintenance();

  const [modal, setModal] = useState(null);
  const [view, setView]   = useState('table'); // 'table' | 'kanban'
  const canEdit = hasRole('admin') || hasRole('manager') || hasRole('technicien');

  const handleCreate = async (input) => {
    await createMaintenance({ variables: { input } });
    setModal(null);
  };

  const handleUpdate = async (input) => {
    await updateMaintenance({ variables: { id: modal.maintenance.id, input } });
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette intervention ?')) {
      await deleteMaintenance({ variables: { id } });
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Maintenance</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView('table')}
            className={`text-sm px-3 py-1.5 rounded-lg ${view === 'table' ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Table
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`text-sm px-3 py-1.5 rounded-lg ${view === 'kanban' ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Kanban
          </button>
          <button
            onClick={() => setModal('create')}
            className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg"
          >
            + Signaler un problème
          </button>
        </div>
      </div>

      {view === 'table' ? (
        <MaintenanceTable
          maintenances={maintenances}
          canEdit={canEdit}
          onEdit={(m) => setModal({ maintenance: m })}
          onDelete={handleDelete}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {KANBAN_COLS.map((col) => {
            const items = maintenances.filter((m) => col.keys.includes(m.status?.toLowerCase()));
            return (
              <div key={col.key} className={`rounded-xl border p-4 ${col.color}`}>
                <h3 className="font-semibold text-gray-700 mb-3">
                  {col.label}
                  <span className="ml-2 text-xs bg-white px-2 py-0.5 rounded-full text-gray-500 border">
                    {items.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {items.map((m) => (
                    <div key={m.id} className="bg-white rounded-lg border p-3 shadow-sm">
                      <p className="text-xs font-mono text-gray-500 truncate">{m.vehicleId}</p>
                      <p className="font-medium text-gray-800 capitalize mt-1">{m.type}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(m.date).toLocaleDateString('fr-FR')}
                      </p>
                      {m.cost > 0 && (
                        <p className="text-xs text-gray-500">{m.cost.toFixed(2)} €</p>
                      )}
                      {canEdit && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => setModal({ maintenance: m })}
                            className="text-xs text-gray-500 hover:underline">Modifier</button>
                          <button onClick={() => handleDelete(m.id)}
                            className="text-xs text-red-400 hover:underline">Supprimer</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Aucune</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal === 'create' && (
        <Modal title="Nouvelle intervention" onClose={() => setModal(null)}>
          <MaintenanceForm
            vehicules={vehicules}
            onSubmit={handleCreate}
            onCancel={() => setModal(null)}
            loading={creating}
          />
        </Modal>
      )}

      {modal?.maintenance && (
        <Modal title="Modifier l'intervention" onClose={() => setModal(null)}>
          <MaintenanceForm
            initial={modal.maintenance}
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
