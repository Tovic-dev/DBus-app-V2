/**
 * Minimal i18n: ES (default) + EN + EU, persisted in AsyncStorage.
 * Usage: const { t, lang, setLang } = useI18n();  t('in_min', { n: 5 })
 * The first launch follows the device language when it is one of the three.
 * GTFS proper nouns (stop names, line names, destinations) are never routed
 * through this system — only UI chrome is translated.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { es, type Dict } from './es';
import { en } from './en';
import { eu } from './eu';

export type Lang = 'es' | 'en' | 'eu';

export const LANGS: { code: Lang; name: string }[] = [
  { code: 'es', name: 'Español' },
  { code: 'eu', name: 'Euskara' },
  { code: 'en', name: 'English' },
];

const DICTS: Record<Lang, Dict> = { es, en, eu };
const STORAGE_KEY = '@dbus/lang';

type Params = Record<string, string | number>;

export interface I18n {
  t: (key: keyof Dict, params?: Params) => string;
  lang: Lang;
  setLang: (l: Lang) => void;
}

function isLang(v: unknown): v is Lang {
  return v === 'es' || v === 'en' || v === 'eu';
}

function deviceLang(): Lang {
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    if (tag.startsWith('eu')) return 'eu';
    if (tag.startsWith('en')) return 'en';
  } catch {
    // Intl unavailable: keep the default.
  }
  return 'es';
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (process.env.NODE_ENV === 'test' ? 'es' : deviceLang()));

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (isLang(v)) setLangState(v);
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
