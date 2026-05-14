import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { useTranslation } from 'react-i18next';
import { useVehicules, useCreateVehicule, useUpdateVehicule, useDeleteVehicule } from '../hooks/useVehicles';
import VehicleList from '../components/vehicles/VehicleList';
import VehicleForm from '../components/vehicles/VehicleForm';

function Modal({ title, icon, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-fleet-card rounded-2xl shadow-2xl border border-fleet-border w-full max-w-md mx-4">
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

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-slate-800 rounded" />
        </td>
      ))}
    </tr>
  );
}

export default function VehiclesPage() {
  const { t } = useTranslation();
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
    if (window.confirm(t('vehicles.confirmDelete'))) {
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
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-400">
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
          <h1 className="text-2xl font-bold text-white">{t('vehicles.title')}</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {loading ? '…' : `${vehicules.length} véhicule${vehicules.length > 1 ? 's' : ''} · ${actifs} actif${actifs > 1 ? 's' : ''} · ${enMaint} ${t('vehicles.maintenance')}`}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreate}
            className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('vehicles.new')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="overflow-x-auto rounded-xl border border-fleet-border bg-fleet-card shadow-card">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-800/50">
              <tr>
                {['Immatriculation', 'Marque', 'Modèle', 'Statut', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left">
                    <div className="h-3 bg-slate-700 rounded animate-pulse w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-fleet-border">
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
        <Modal title={t('vehicles.new')} icon="🚗" onClose={() => setModal(null)}>
          <VehicleForm
            onSubmit={handleCreate}
            onCancel={() => setModal(null)}
            loading={creating}
            error={formError || createError?.message}
          />
        </Modal>
      )}

      {modal?.vehicule && (
        <Modal title={t('vehicles.editVehicle')} icon="✏️" onClose={() => setModal(null)}>
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
