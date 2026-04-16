const STYLES = {
  planifie:   'bg-blue-100 text-blue-700',
  planifiee:  'bg-blue-100 text-blue-700',
  en_cours:   'bg-orange-100 text-orange-700',
  termine:    'bg-green-100 text-green-700',
  terminee:   'bg-green-100 text-green-700',
  annule:     'bg-gray-100 text-gray-500',
  annulee:    'bg-gray-100 text-gray-500',
};

const LABELS = {
  planifie:  'Planifié',
  planifiee: 'Planifié',
  en_cours:  'En cours',
  termine:   'Terminé',
  terminee:  'Terminé',
  annule:    'Annulé',
  annulee:   'Annulé',
};

export default function MaintenanceBadge({ status }) {
  const key = status?.toLowerCase().replace(' ', '_');
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STYLES[key] || 'bg-gray-100 text-gray-500'}`}>
      {LABELS[key] || status}
    </span>
  );
}
