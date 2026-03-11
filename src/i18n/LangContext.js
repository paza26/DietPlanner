import { createContext, useContext } from 'react';
import { translations } from './translations';

export const LangContext = createContext('it');

export function useLang() {
  const lang = useContext(LangContext);
  return translations[lang] ?? translations.it;
}
