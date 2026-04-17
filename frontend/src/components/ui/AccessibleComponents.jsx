// AccessibleComponents.jsx — Composants de base conformes WCAG 2.1 Niveau AA
// Utiliser ces composants dans TOUTES les pages pour garantir l'accessibilité

// ── SKIP LINK — Premier élément du body (navigation clavier) ─────────────
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4
                 bg-blue-600 text-white px-4 py-2 rounded-lg z-50 font-medium
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
  const base = 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ' +
               'px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2';
  const variants = {
    primary:   'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    danger:    'bg-red-600 hover:bg-red-700 text-white',
    ghost:     'hover:bg-gray-100 text-gray-600',
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
  en_service:     { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500'  },
  disponible:     { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500'   },
  en_maintenance: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  hors_service:   { bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500'    },
  actif:          { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500'  },
  inactif:        { bg: 'bg-gray-100',   text: 'text-gray-700',   dot: 'bg-gray-400'   },
  suspendu:       { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
  planifie:       { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500'   },
  en_cours:       { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  termine:        { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500'  },
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
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="text-red-500 ml-0.5">*</span>
            <span className="sr-only"> (obligatoire)</span>
          </>
        )}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-gray-500">{hint}</p>
      )}
      <input
        id={id}
        type={type}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined}
        className={`border rounded-lg px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}`}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} role="alert" aria-live="assertive" className="text-red-600 text-xs flex items-center gap-1">
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
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="text-red-500 ml-0.5">*</span>
            <span className="sr-only"> (obligatoire)</span>
          </>
        )}
      </label>
      <select
        id={id}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`border rounded-lg px-3 py-2 text-sm bg-white
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${error ? 'border-red-500' : 'border-gray-300'}`}
        {...props}
      >
        {options.map(({ value, label: optLabel }) => (
          <option key={value} value={value}>{optLabel}</option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-red-600 text-xs">{error}</p>
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
      className="overflow-x-auto rounded-lg border border-gray-200"
    >
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-gray-50">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-8 text-center text-gray-400">
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
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      {/* Contenu */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 focus:outline-none">
        <div className="flex items-start justify-between mb-4">
          <h2 id={titleId || 'modal-title'} className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer la boîte de dialogue"
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
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
    info:    { bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-800',  icon: 'ℹ' },
    success: { bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-800', icon: '✓' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200',text: 'text-yellow-800',icon: '⚠' },
    error:   { bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-800',   icon: '✕' },
  };
  const s = styles[type] || styles.info;
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`flex items-start gap-3 p-4 rounded-lg border ${s.bg} ${s.border} ${s.text}`}
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
