import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '../auth/useAuth';
import { useVehicules } from '../hooks/useVehicles';
import { useTranslation } from 'react-i18next';
import {
  GET_CONDUCTEURS,
  CREATE_CONDUCTEUR,
  UPDATE_CONDUCTEUR,
  DELETE_CONDUCTEUR,
  ASSIGN_VEHICULE_TO_CONDUCTEUR,
} from '../api/queries';

const STATUTS = ['actif', 'inactif', 'suspendu'];

const STATUT_CONFIG = {
  actif:    { label: 'Actif',    cls: 'bg-green-500/15 text-green-400 border border-green-500/20',   dot: 'bg-green-400' },
  inactif:  { label: 'Inactif',  cls: 'bg-slate-500/15 text-slate-400 border border-slate-500/20',   dot: 'bg-slate-500' },
  suspendu: { label: 'Suspendu', cls: 'bg-red-500/15 text-red-400 border border-red-500/20',          dot: 'bg-red-400' },
  en_conge: { label: 'En congé', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',   dot: 'bg-amber-400' },
};

function avatarColor(name = '') {
  const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-rose-500',
    'bg-amber-500', 'bg-teal-500', 'bg-indigo-500', 'bg-pink-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function Avatar({ prenom, nom }) {
  const initials = `${(prenom || '')[0] || ''}${(nom || '')[0] || ''}`.toUpperCase();
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(nom + prenom)}`}>
      {initials}
    </div>
  );
}

function StatutBadge({ statut }) {
  const cfg = STATUT_CONFIG[statut?.toLowerCase()] || { label: statut, cls: 'bg-slate-500/15 text-slate-400 border border-slate-500/20', dot: 'bg-slate-500' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

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

function ConducteurForm({ initial, vehicules = [], conducteurs = [], onSubmit, onCancel, loading, error }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(
    initial
      ? { nom: initial.nom || '', prenom: initial.prenom || '', numeroPermis: initial.numeroPermis || '', statut: initial.statut || 'actif', vehiculeId: initial.vehiculeId || '' }
      : { nom: '', prenom: '', numeroPermis: '', statut: 'actif', vehiculeId: '' }
  );

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const inputCls = 'w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all placeholder:text-slate-500';

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t('conducteurs.lastName')} *</label>
          <input name="nom" value={form.nom} onChange={handleChange} required className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t('conducteurs.firstName')} *</label>
          <input name="prenom" value={form.prenom} onChange={handleChange} required className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t('conducteurs.license')} *</label>
        <input name="numeroPermis" value={form.numeroPermis} onChange={handleChange} required className={`${inputCls} font-mono`} placeholder="07-0512-0001" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{t('conducteurs.status')} *</label>
        <select name="statut" value={form.statut} onChange={handleChange} className={inputCls}>
          {STATUTS.map((s) => (
            <option key={s} value={s}>{STATUT_CONFIG[s]?.label || s}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">🚗 {t('conducteurs.assignVehicle')}</label>
        <select name="vehiculeId" value={form.vehiculeId} onChange={handleChange} className={inputCls}>
          <option value="">— {t('conducteurs.noVehicle')}</option>
          {vehicules.map((v) => {
            const alreadyAssigned = conducteurs.find((c) => c.vehiculeId === v.id && c.id !== initial?.id);
            return (
              <option key={v.id} value={v.id} disabled={!!alreadyAssigned}>
                {v.immatriculation} — {v.marque} {v.modele}{alreadyAssigned ? ' (déjà assigné)' : ''}
              </option>
            );
          })}
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
          {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {loading ? '…' : t('common.save')}
        </button>
        <button type="button" onClick={onCancel}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2.5 rounded-xl text-sm transition-all">
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}

function AssignVehiculeModal({ conducteur, vehicules, conducteurs, onClose }) {
  const { t } = useTranslation();
  const [vehiculeId, setVehiculeId] = useState(conducteur.vehiculeId || '');
  const [success, setSuccess] = useState(false);
  const [assignVehicule, { loading }] = useMutation(ASSIGN_VEHICULE_TO_CONDUCTEUR, {
    refetchQueries: [{ query: GET_CONDUCTEURS }],
  });

  const inputCls = 'w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all';

  const handleAssign = async () => {
    await assignVehicule({ variables: { conducteurId: conducteur.id, vehiculeId: vehiculeId || null } });
    setSuccess(true);
    setTimeout(() => onClose(), 1200);
  };

  return (
    <Modal title={t('conducteurs.assignQuick')} icon="⚡" onClose={onClose}>
      {success ? (
        <p className="text-green-400 text-center py-6 text-sm">✅ {t('common.save')} !</p>
      ) : (
        <div className="space-y-4">
          <select value={vehiculeId} onChange={(e) => setVehiculeId(e.target.value)} className={inputCls}>
            <option value="">— {t('conducteurs.noVehicle')}</option>
            {vehicules.map((v) => {
              const alreadyAssigned = conducteurs.find((c) => c.vehiculeId === v.id && c.id !== conducteur.id);
              return (
                <option key={v.id} value={v.id} disabled={!!alreadyAssigned}>
                  {v.immatriculation} — {v.marque} {v.modele}{alreadyAssigned ? ' (déjà assigné)' : ''}
                </option>
              );
            })}
          </select>
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleAssign}
              disabled={loading}
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? '…' : t('common.save')}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2.5 rounded-xl text-sm transition-all">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function ConducteursPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const { data, loading, error } = useQuery(GET_CONDUCTEURS);
  const [createConducteur, { loading: creating, error: createError }] = useMutation(CREATE_CONDUCTEUR, {
    refetchQueries: [{ query: GET_CONDUCTEURS }],
  });
  const [updateConducteur, { loading: updating, error: updateError }] = useMutation(UPDATE_CONDUCTEUR, {
    refetchQueries: [{ query: GET_CONDUCTEURS }],
  });
  const [deleteConducteur] = useMutation(DELETE_CONDUCTEUR, {
    refetchQueries: [{ query: GET_CONDUCTEURS }],
  });

  const [modal, setModal]         = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [formError, setFormError] = useState('');
  const [search, setSearch]       = useState('');

  const canEdit   = hasRole('admin') || hasRole('manager');
  const canDelete = hasRole('admin');
  const { vehicules } = useVehicules();
  const conducteurs   = data?.conducteurs || [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return conducteurs;
    return conducteurs.filter(
      (c) =>
        c.nom?.toLowerCase().includes(q) ||
        c.prenom?.toLowerCase().includes(q) ||
        c.numeroPermis?.toLowerCase().includes(q)
    );
  }, [conducteurs, search]);

  const nbActifs = conducteurs.filter((c) => c.statut === 'actif').length;

  const handleCreate = async (formData) => {
    setFormError('');
    try {
      const input = { ...formData, vehiculeId: formData.vehiculeId || null };
      await createConducteur({ variables: { input } });
      setModal(null);
    } catch (err) {
      setFormError(err.message || 'Erreur lors de la création');
    }
  };

  const handleUpdate = async (formData) => {
    setFormError('');
    try {
      const input = { ...formData, vehiculeId: formData.vehiculeId || null };
      await updateConducteur({ variables: { id: modal.conducteur.id, input } });
      setModal(null);
    } catch (err) {
      setFormError(err.message || 'Erreur lors de la modification');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce conducteur définitivement ?')) {
      await deleteConducteur({ variables: { id } });
    }
  };

  const openCreate = () => { setFormError(''); setModal('create'); };
  const openEdit   = (c) => { setFormError(''); setModal({ conducteur: c }); };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-32 bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-48 bg-slate-800 rounded animate-pulse mt-2" />
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-fleet-border bg-fleet-card">
          <table className="min-w-full text-sm">
            <tbody className="divide-y divide-fleet-border">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-slate-800 rounded" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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
          <h1 className="text-2xl font-bold text-white">{t('conducteurs.title')}</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {conducteurs.length} conducteur{conducteurs.length > 1 ? 's' : ''} · {nbActifs} actif{nbActifs > 1 ? 's' : ''}
          </p>
          {hasRole('manager') && !hasRole('admin') && (
            <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1 inline-flex items-center gap-1 mt-2">
              ⚠️ {t('conducteurs.managerNote')}
            </p>
          )}
        </div>
        {canEdit && (
          <button
            onClick={openCreate}
            className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('conducteurs.new')}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('conducteurs.search')}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-fleet-card border border-fleet-border text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 placeholder:text-slate-500 transition-all"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-fleet-border bg-fleet-card shadow-card">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left font-semibold w-10"></th>
              <th className="px-4 py-3 text-left font-semibold">{t('conducteurs.lastName')}</th>
              <th className="px-4 py-3 text-left font-semibold">{t('conducteurs.firstName')}</th>
              <th className="px-4 py-3 text-left font-semibold">{t('conducteurs.license')}</th>
              <th className="px-4 py-3 text-left font-semibold">{t('conducteurs.status')}</th>
              <th className="px-4 py-3 text-left font-semibold">{t('conducteurs.assignedVehicleCol')}</th>
              {canEdit && <th className="px-4 py-3 text-right font-semibold">{t('conducteurs.actions')}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-fleet-border">
            {filtered.map((c) => {
              const assignedVehicle = vehicules.find((v) => v.id === c.vehiculeId);
              return (
                <tr key={c.id} className="hover:bg-white/5 transition-colors">
                  <td className="pl-4 py-3">
                    <Avatar prenom={c.prenom} nom={c.nom} />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-200">{c.nom}</td>
                  <td className="px-4 py-3 text-slate-400">{c.prenom}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">{c.numeroPermis}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatutBadge statut={c.statut} />
                  </td>
                  <td className="px-4 py-3">
                    {assignedVehicle ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                        <span className="font-mono text-xs bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">{assignedVehicle.immatriculation}</span>
                        <span className="text-slate-400 text-xs">{assignedVehicle.marque} {assignedVehicle.modele}</span>
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">— {t('conducteurs.noVehicle')}</span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => setAssignModal(c)}
                          title={t('conducteurs.assignQuick')}
                          className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 transition-colors"
                        >
                          ⚡
                        </button>
                        <button
                          onClick={() => openEdit(c)}
                          title={t('common.edit')}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(c.id)}
                            title={t('common.delete')}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 7 : 6} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm font-medium">
                      {search ? t('conducteurs.noResults') : t('conducteurs.noData')}
                    </p>
                    {!search && <p className="text-xs">{t('conducteurs.addFirst')}</p>}
                    {!search && canEdit && (
                      <button onClick={openCreate} className="mt-1 text-sm text-violet-400 hover:underline font-medium">
                        + {t('conducteurs.new')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal === 'create' && (
        <Modal title={t('conducteurs.new')} icon="👤" onClose={() => setModal(null)}>
          <ConducteurForm
            vehicules={vehicules}
            conducteurs={conducteurs}
            onSubmit={handleCreate}
            onCancel={() => setModal(null)}
            loading={creating}
            error={formError || createError?.message}
          />
        </Modal>
      )}

      {modal?.conducteur && (
        <Modal title={t('common.edit')} icon="✏️" onClose={() => setModal(null)}>
          <ConducteurForm
            initial={modal.conducteur}
            vehicules={vehicules}
            conducteurs={conducteurs}
            onSubmit={handleUpdate}
            onCancel={() => setModal(null)}
            loading={updating}
            error={formError || updateError?.message}
          />
        </Modal>
      )}

      {assignModal && (
        <AssignVehiculeModal
          conducteur={assignModal}
          vehicules={vehicules}
          conducteurs={conducteurs}
          onClose={() => setAssignModal(null)}
        />
      )}
    </div>
  );
}
