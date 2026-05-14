// AccessibleComponents.jsx — Composants de base conformes WCAG 2.1 Niveau AA
// Utiliser ces composants dans TOUTES les pages pour garantir l'accessibilité

// ── SKIP LINK — Premier élément du body (navigation clavier) ─────────────
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4
                 bg-violet-600 text-white px-4 py-2 rounded-lg z-50 font-medium
                 focus:outline-none focus:ring-2 focus:ring-white"
    >
      Aller au contenu principal
    </a>
  );
}

// ── BOUTON ACCESSIBLE ─────────────────────────────────────────────────────
export function A11yButton({
  onClick,
  label,
  icon,
  variant = 'primary',
  disabled = false,
  type = 'button',
  className = '',
  ...props
}) {
  const base = 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 focus:ring-offset-fleet-card ' +
               'px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2';
  const variants = {
    primary:   'bg-violet-600 hover:bg-violet-700 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200',
    danger:    'bg-red-600 hover:bg-red-700 text-white',
    ghost:     'hover:bg-slate-700 text-slate-300',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-disabled={disabled}
      className={`${base} ${variants[variant] || variants.primary} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {label}
    </button>
  );
}

// ── BADGE DE STATUT ACCESSIBLE ────────────────────────────────────────────
const STATUS_COLORS = {
  en_service:     { bg: 'bg-green-500/15',  text: 'text-green-400',  dot: 'bg-green-500'  },
  disponible:     { bg: 'bg-blue-500/15',   text: 'text-blue-400',   dot: 'bg-blue-500'   },
  en_maintenance: { bg: 'bg-amber-500/15',  text: 'text-amber-400',  dot: 'bg-amber-500'  },
  hors_service:   { bg: 'bg-red-500/15',    text: 'text-red-400',    dot: 'bg-red-500'    },
  actif:          { bg: 'bg-green-500/15',  text: 'text-green-400',  dot: 'bg-green-500'  },
  inactif:        { bg: 'bg-slate-500/15',  text: 'text-slate-400',  dot: 'bg-slate-500'  },
  suspendu:       { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-500' },
  planifie:       { bg: 'bg-blue-500/15',   text: 'text-blue-400',   dot: 'bg-blue-500'   },
  en_cours:       { bg: 'bg-amber-500/15',  text: 'text-amber-400',  dot: 'bg-amber-500'  },
  termine:        { bg: 'bg-green-500/15',  text: 'text-green-400',  dot: 'bg-green-500'  },
};

export function StatusBadge({ status, label }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.inactif;
  return (
    <span
      role="status"
      aria-label={`Statut : ${label || status}`}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {label || status}
    </span>
  );
}

// ── CHAMP DE FORMULAIRE ACCESSIBLE ────────────────────────────────────────
export function A11yInput({ id, label, required = false, error, hint, type = 'text', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-300">
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="text-red-400 ml-0.5">*</span>
            <span className="sr-only"> (obligatoire)</span>
          </>
        )}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-slate-500">{hint}</p>
      )}
      <input
        id={id}
        type={type}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined}
        className={`bg-slate-800 border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500
          focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40
          ${error ? 'border-red-500/50 bg-red-500/5' : 'border-slate-700'}`}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} role="alert" aria-live="assertive" className="text-red-400 text-xs flex items-center gap-1">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}

// ── SELECT ACCESSIBLE ─────────────────────────────────────────────────────
export function A11ySelect({ id, label, required = false, error, options = [], ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-300">
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="text-red-400 ml-0.5">*</span>
            <span className="sr-only"> (obligatoire)</span>
          </>
        )}
      </label>
      <select
        id={id}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`bg-slate-800 border rounded-lg px-3 py-2 text-sm text-slate-200
          focus:outline-none focus:ring-2 focus:ring-violet-500/40
          ${error ? 'border-red-500/50' : 'border-slate-700'}`}
        {...props}
      >
        {options.map(({ value, label: optLabel }) => (
          <option key={value} value={value}>{optLabel}</option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-red-400 text-xs">{error}</p>
      )}
    </div>
  );
}

// ── TABLE ACCESSIBLE ──────────────────────────────────────────────────────
export function A11yTable({ caption, headers, children, loading = false }) {
  return (
    <div
      role="region"
      aria-label={caption}
      aria-busy={loading}
      className="overflow-x-auto rounded-xl border border-fleet-border bg-fleet-card"
    >
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-slate-800/50">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-fleet-border">
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-8 text-center text-slate-500">
                <span aria-live="polite">Chargement...</span>
              </td>
            </tr>
          ) : children}
        </tbody>
      </table>
    </div>
  );
}

// ── MODAL ACCESSIBLE ──────────────────────────────────────────────────────
export function A11yModal({ isOpen, onClose, title, titleId, children }) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId || 'modal-title'}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      {/* Contenu */}
      <div className="relative bg-fleet-card border border-fleet-border rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6 focus:outline-none">
        <div className="flex items-start justify-between mb-4">
          <h2 id={titleId || 'modal-title'} className="text-lg font-semibold text-slate-200">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer la boîte de dialogue"
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-700 p-1 rounded focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <span aria-hidden="true" className="text-xl">×</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── ALERT / NOTIFICATION ACCESSIBLE ──────────────────────────────────────
export function A11yAlert({ type = 'info', message, onDismiss }) {
  const styles = {
    info:    { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   text: 'text-blue-400',   icon: 'ℹ' },
    success: { bg: 'bg-green-500/10',  border: 'border-green-500/20',  text: 'text-green-400',  icon: '✓' },
    warning: { bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  text: 'text-amber-400',  icon: '⚠' },
    error:   { bg: 'bg-red-500/10',    border: 'border-red-500/20',    text: 'text-red-400',    icon: '✕' },
  };
  const s = styles[type] || styles.info;
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`flex items-start gap-3 p-4 rounded-xl border ${s.bg} ${s.border} ${s.text}`}
    >
      <span aria-hidden="true" className="text-lg flex-shrink-0">{s.icon}</span>
      <p className="flex-1 text-sm">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Fermer cette notification"
          className="text-current opacity-60 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current rounded"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
}
