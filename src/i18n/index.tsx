/**
 * Minimal i18n: ES (default) + EN, persisted in AsyncStorage.
 * Usage: const { t, lang, setLang } = useI18n();  t('nearest_stop')
 * Interpolation: t('min_ago', { n: 5 }) -> "Hace 5 min"
 * GTFS proper nouns (stop names, line names, destinations) are never routed
 * through this system — only UI chrome is translated.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { es, type Dict } from './es';
import { en } from './en';

export type Lang = 'es' | 'en';

const DICTS: Record<Lang, Dict> = { es, en };
const STORAGE_KEY = '@dbus/lang';

type Params = Record<string, string | number>;

export interface I18n {
  t: (key: keyof Dict, params?: Params) => string;
  lang: Lang;
  setLang: (l: Lang) => void;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es');

  // Cargar idioma persistido al arrancar.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'es' || v === 'en') setLangState(v);
      })
      .catch(() => undefined);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => undefined);
  };

  const t = (key: keyof Dict, params?: Params): string => {
    let s: string = DICTS[lang][key] ?? DICTS.es[key] ?? String(key);
    if (params) {
      for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, String(v));
    }
    return s;
  };

  return <I18nContext.Provider value={{ t, lang, setLang }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
