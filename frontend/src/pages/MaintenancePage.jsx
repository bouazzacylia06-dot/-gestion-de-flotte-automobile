import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { useMaintenances, useCreateMaintenance, useUpdateMaintenance, useDeleteMaintenance } from '../hooks/useMaintenances';
import { useVehicules } from '../hooks/useVehicles';
import MaintenanceTable from '../components/maintenance/MaintenanceTable';
import MaintenanceForm from '../components/maintenance/MaintenanceForm';
import MaintenanceBadge from '../components/maintenance/MaintenanceBadge';

function Modal({ title, icon, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg mx-4">
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

const TYPE_LABELS = {
  vidange: 'Vidange', revision: 'Révision', révision: 'Révision',
  pneus: 'Pneus', freins: 'Freins', controle_technique: 'Contrôle tech.',
  batterie: 'Batterie', carrosserie: 'Carrosserie', électrique: 'Électrique', autre: 'Autre',
};

const KANBAN_COLS = [
  { keys: ['planifie', 'planifiee'], label: 'Planifiée',  color: 'border-t-blue-400',   bg: 'bg-blue-50',   hdr: 'text-blue-700' },
  { keys: ['en_cours'],              label: 'En cours',   color: 'border-t-orange-400', bg: 'bg-orange-50', hdr: 'text-orange-700' },
  { keys: ['termine', 'terminee'],   label: 'Terminée',   color: 'border-t-green-400',  bg: 'bg-green-50',  hdr: 'text-green-700' },
];

export default function MaintenancePage() {
  const { hasRole } = useAuth();
  const { maintenances, loading, error } = useMaintenances();
  const { vehicules } = useVehicules();
  const { createMaintenance, loading: creating, error: createError } = useCreateMaintenance();
  const { updateMaintenance, loading: updating, error: updateError } = useUpdateMaintenance();
  const { deleteMaintenance } = useDeleteMaintenance();

  const [modal, setModal]       = useState(null);
  const [view, setView]         = useState('table');
  const [formError, setFormError] = useState('');

  const canEdit   = hasRole('admin') || hasRole('manager') || hasRole('technicien');
  const canDelete = hasRole('admin');

  const handleCreate = async (input) => {
    setFormError('');
    try {
      await createMaintenance({ variables: { input } });
      setModal(null);
    } catch (err) {
      setFormError(err.message || 'Erreur lors de la création');
    }
  };

  const handleUpdate = async (input) => {
    setFormError('');
    try {
      await updateMaintenance({ variables: { id: modal.maintenance.id, input } });
      setModal(null);
    } catch (err) {
      setFormError(err.message || 'Erreur lors de la modification');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette intervention ?')) {
      await deleteMaintenance({ variables: { id } });
    }
  };

  const openCreate = () => { setFormError(''); setModal('create'); };
  const openEdit   = (m) => { setFormError(''); setModal({ maintenance: m }); };

  const nbPlanifies = maintenances.filter((m) => ['planifie', 'planifiee'].includes(m.status?.toLowerCase())).length;
  const nbEnCours   = maintenances.filter((m) => m.status?.toLowerCase() === 'en_cours').length;
  const nbTermines  = maintenances.filter((m) => ['termine', 'terminee'].includes(m.status?.toLowerCase())).length;

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
              {[1, 2, 3].map((j) => <div key={j} className="h-16 bg-gray-100 rounded mb-2" />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600">Erreur : {error.message}</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Maintenance</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {maintenances.length} intervention{maintenances.length > 1 ? 's' : ''} · {nbPlanifies} planifiée{nbPlanifies > 1 ? 's' : ''} · {nbEnCours} en cours · {nbTermines} terminée{nbTermines > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setView('table')}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-all ${view === 'table' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Table
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-all ${view === 'kanban' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Kanban
            </button>
          </div>
          {canEdit && (
            <button
              onClick={openCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Signaler un problème
            </button>
          )}
        </div>
      </div>

      {view === 'table' ? (
        <MaintenanceTable
          maintenances={maintenances}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {KANBAN_COLS.map((col) => {
            const items = maintenances.filter((m) => col.keys.includes(m.status?.toLowerCase()));
            return (
              <div key={col.label} className={`rounded-xl border-t-4 border border-gray-200 bg-white shadow-sm ${col.color}`}>
                <div className={`px-4 py-3 flex items-center justify-between ${col.bg} rounded-t-lg`}>
                  <h3 className={`font-semibold text-sm ${col.hdr}`}>{col.label}</h3>
                  <span className="text-xs bg-white px-2 py-0.5 rounded-full text-gray-500 border font-medium">
                    {items.length}
                  </span>
                </div>
                <div className="p-3 space-y-2 min-h-32">
                  {items.map((m) => (
                    <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-gray-400 truncate">…{m.vehicleId?.slice(-8)}</p>
                          <p className="font-semibold text-gray-800 capitalize mt-0.5 text-sm">
                            {TYPE_LABELS[m.type?.toLowerCase()] || m.type}
                          </p>
                        </div>
                        <MaintenanceBadge status={m.status} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">
                        {new Date(m.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      {m.cost > 0 && (
                        <p className="text-xs font-semibold text-gray-600 mt-1">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m.cost)}
                        </p>
                      )}
                      {canEdit && (
                        <div className="flex gap-1 mt-2 pt-2 border-t border-gray-50">
                          <button onClick={() => openEdit(m)}
                            className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1 rounded hover:bg-gray-50 transition-colors">
                            Modifier
                          </button>
                          {canDelete && (
                            <button onClick={() => handleDelete(m.id)}
                              className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
                              Supprimer
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                      <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-xs">Aucune</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal === 'create' && (
        <Modal title="Nouvelle intervention" icon="🔧" onClose={() => setModal(null)}>
          <MaintenanceForm
            vehicules={vehicules}
            onSubmit={handleCreate}
            onCancel={() => setModal(null)}
            loading={creating}
            error={formError || createError?.message}
          />
        </Modal>
      )}

      {modal?.maintenance && (
        <Modal title="Modifier l'intervention" icon="✏️" onClose={() => setModal(null)}>
          <MaintenanceForm
            initial={modal.maintenance}
            vehicules={vehicules}
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
