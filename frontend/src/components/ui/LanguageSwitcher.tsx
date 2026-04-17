import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { applyDocumentLanguage, languageMeta, type AppLanguage } from '@/locales/i18n';

const languages = (Object.entries(languageMeta) as Array<[AppLanguage, (typeof languageMeta)[AppLanguage]]>).map(([code, meta]) => ({
  code,
  name: meta.label
}));

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = async (lng: string) => {
    localStorage.setItem('lang', lng);
    await i18n.changeLanguage(lng);
    applyDocumentLanguage(lng);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-slate-400" />
      <div className="flex flex-wrap gap-1">
        {languages.map((lang) => (
          <Button
            key={lang.code}
            type="button"
            variant={i18n.resolvedLanguage === lang.code ? 'default' : 'ghost'}
            size="sm"
            onClick={() => changeLanguage(lang.code)}
            className="px-2 py-1 text-xs"
            data-language={lang.code}
            aria-label={`Switch language to ${lang.code}`}
            aria-pressed={i18n.resolvedLanguage === lang.code}
          >
            {lang.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
