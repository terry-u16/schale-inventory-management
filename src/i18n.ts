import { initReactI18next } from 'react-i18next';

import i18n from 'i18next';
import Backend from 'i18next-http-backend';

i18n
  // loads translations from your server
  .use(Backend)
  // init i18next
  .use(initReactI18next)
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    // set to true if you want to see console.log
    debug: false,
    fallbackLng: ['en'],
    supportedLngs: ['jp', 'en'],
    load: 'languageOnly',
    // default language if not found
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    // namespace to use (json filename in public/locales)
    ns: ['Header'],
  });

export default i18n;
