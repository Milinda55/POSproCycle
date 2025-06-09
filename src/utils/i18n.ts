import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from '../../public/locales/en.json';
import siTranslations from '../../public/locales/si.json';

const resources = {
    en: { translations: enTranslations },
    si: { translations: siTranslations }
} as const;

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'en',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        },
        ns: ['translations'],
        defaultNS: 'translations',
    });

export default i18n;
