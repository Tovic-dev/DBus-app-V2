import { es } from '../src/i18n/es';
import { en } from '../src/i18n/en';
import { eu } from '../src/i18n/eu';

const dicts = { es, en, eu } as Record<string, Record<string, string>>;

describe('UI copy', () => {
  it('has every key in the three languages with the same placeholders', () => {
    for (const key of Object.keys(es)) {
      const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
      for (const [lang, d] of Object.entries(dicts)) {
        expect([lang, key, typeof d[key]]).toEqual([lang, key, 'string']);
        expect([lang, key, ph(d[key])]).toEqual([lang, key, ph((es as Record<string, string>)[key])]);
      }
    }
  });

  it('uses no em dashes and no fake personal data', () => {
    for (const d of Object.values(dicts)) {
      for (const v of Object.values(d)) {
        expect(v).not.toMatch(/—/);
        expect(v).not.toMatch(/Mikel|Aitor|@aitor|Cerrar sesión/);
      }
    }
  });
});
