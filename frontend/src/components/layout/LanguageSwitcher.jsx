import { useTranslation } from 'react-i18next';

const LANGS = [
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.slice(0, 2) || 'fr';

  return (
    <div className="flex gap-1" role="group" aria-label="Sélection de la langue">
      {LANGS.map(({ code, label, flag }) => (
        <button
          key={code}
          onClick={() => i18n.changeLanguage(code)}
          aria-label={`Changer la langue en ${label}`}
          aria-pressed={currentLang === code}
          className={`px-2 py-1 rounded text-sm font-medium transition-colors
            focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-violet-500 focus:ring-offset-fleet-sidebar
            ${currentLang === code
              ? 'bg-violet-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
        >
          <span aria-hidden="true">{flag}</span>{' '}
          {label}
        </button>
      ))}
    </div>
  );
}
