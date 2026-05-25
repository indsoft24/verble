# Language (i18n) – English / Hindi

- **Config:** `config.ts` – initializes i18next, loads `en` and `hi`, reads/saves language from `localStorage` (`verble_lang`).
- **Translations:** `locales/en.json` and `locales/hi.json` – add keys under `common`, `nav`, `footer`, `landing`, or new sections.

## Using translations in a component

```tsx
import { useTranslation } from 'react-i18next';

function MyPage() {
  const { t } = useTranslation();
  return <h1>{t('landing.heroTitle')}</h1>;
}
```

With interpolation: `t('footer.copyrightAfter', { year: 2025 })`.

## Opening the language switcher pop-up

```tsx
import { useLanguage } from '../contexts/LanguageContext';

function MyComponent() {
  const { openLanguageModal } = useLanguage();
  return <Button onClick={openLanguageModal}>Change language</Button>;
}
```

## Adding more site-wide text

1. Add the key in both `locales/en.json` and `locales/hi.json`.
2. In the component, use `const { t } = useTranslation()` and `t('section.key')`.

The language choice is persisted and applies to every component that uses `t()`.
