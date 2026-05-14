import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { useTranslation } from 'react-i18next';
import { useMaintenances, useCreateMaintenance, useUpdateMaintenance, useDeleteMaintenance } from '../hooks/useMaintenances';
import { useVehicules } from '../hooks/useVehicles';
import MaintenanceTable from '../components/maintenance/MaintenanceTable';
import MaintenanceForm from '../components/maintenance/MaintenanceForm';
import MaintenanceBadge from '../components/maintenance/MaintenanceBadge';

function Modal({ title, icon, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-fleet-card rounded-2xl shadow-2xl border border-fleet-border w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-fleet-border bg-slate-800/30 rounded-t-2xl">
          <div className="flex items-center gap-3">
            {icon && <span className="text-xl">{icon}</span>}
            <h2 className="font-semibold text-slate-200">{title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors">✕</button>
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
  { keys: ['planifie', 'planifiee'], label: 'Planifiée',  border: 'border-t-blue-500',    bg: 'bg-blue-500/10',   hdr: 'text-blue-400' },
  { keys: ['en_cours'],              label: 'En cours',   border: 'border-t-orange-500',  bg: 'bg-orange-500/10', hdr: 'text-orange-400' },
  { keys: ['termine', 'terminee'],   label: 'Terminée',   border: 'border-t-green-500',   bg: 'bg-green-500/10',  hdr: 'text-green-400' },
];

export default function MaintenancePage() {
  const { t } = useTranslation();
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
    if (window.confirm(t('maintenance.confirmDelete'))) {
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
        <div className="h-8 w-40 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-fleet-border bg-fleet-card p-4 animate-pulse">
              <div className="h-4 w-24 bg-slate-800 rounded mb-3" />
              {[1, 2, 3].map((j) => <div key={j} className="h-16 bg-slate-800 rounded mb-2" />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-400">Erreur : {error.message}</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('maintenance.title')}</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {maintenances.length} intervention{maintenances.length > 1 ? 's' : ''} · {nbPlanifies} planifiée{nbPlanifies > 1 ? 's' : ''} · {nbEnCours} en cours · {nbTermines} terminée{nbTermines > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-slate-800 rounded-xl p-1 gap-1 border border-fleet-border">
            <button
              onClick={() => setView('table')}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-all ${view === 'table' ? 'bg-fleet-card text-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t('maintenance.viewTable')}
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-all ${view === 'kanban' ? 'bg-fleet-card text-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t('maintenance.viewKanban')}
            </button>
          </div>
          {canEdit && (
            <button
              onClick={openCreate}
              className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('maintenance.report')}
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
              <div key={col.label} className={`rounded-xl border-t-4 border border-fleet-border bg-fleet-card shadow-card ${col.border}`}>
                <div className={`px-4 py-3 flex items-center justify-between ${col.bg} rounded-t-lg`}>
                  <h3 className={`font-semibold text-sm ${col.hdr}`}>{col.label}</h3>
                  <span className="text-xs bg-fleet-card px-2 py-0.5 rounded-full text-slate-400 border border-fleet-border font-medium">
                    {items.length}
                  </span>
                </div>
                <div className="p-3 space-y-2 min-h-32">
                  {items.map((m) => (
                    <div key={m.id} className="bg-fleet-card2 rounded-xl border border-fleet-border p-3 hover:border-slate-600 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-slate-500 truncate">…{m.vehicleId?.slice(-8)}</p>
                          <p className="font-semibold text-slate-200 capitalize mt-0.5 text-sm">
                            {TYPE_LABELS[m.type?.toLowerCase()] || m.type}
                          </p>
                        </div>
                        <MaintenanceBadge status={m.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5">
                        {new Date(m.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      {m.cost > 0 && (
                        <p className="text-xs font-semibold text-slate-400 mt-1">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(m.cost)}
                        </p>
                      )}
                      {canEdit && (
                        <div className="flex gap-1 mt-2 pt-2 border-t border-fleet-border">
                          <button onClick={() => openEdit(m)}
                            className="text-xs text-slate-400 hover:text-slate-200 font-medium px-2 py-1 rounded hover:bg-slate-700 transition-colors">
                            {t('maintenance.editBtn')}
                          </button>
                          {canDelete && (
                            <button onClick={() => handleDelete(m.id)}
                              className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-red-500/10 transition-colors">
                              {t('maintenance.deleteBtn')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-600">
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
        <Modal title={t('maintenance.report')} icon="🔧" onClose={() => setModal(null)}>
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
