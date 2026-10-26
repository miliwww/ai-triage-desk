import { TestBed } from '@angular/core/testing';
import { I18n, LANGS, type Lang } from './i18n';
import { PORTFOLIO_COPY } from './portfolio-copy';

/** The English KPI unit is an empty string by design; every other showcase string must be translated. */
const EMPTY_BY_DESIGN = new Set(['portfolio.ticketUnit:en']);

describe('Showcase copy in all interface languages', () => {
  let i18n: I18n;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    i18n = TestBed.inject(I18n);
  });

  it('has a non-empty string for every key in every language', () => {
    const gaps: string[] = [];
    for (const { code } of LANGS) {
      i18n.setLang(code);
      for (const key of Object.keys(PORTFOLIO_COPY)) {
        if (EMPTY_BY_DESIGN.has(`${key}:${code}`)) continue;
        const text = i18n.t(key).trim();
        if (text === '' || text === key) gaps.push(`${key}:${code}`);
      }
    }
    expect(gaps).toEqual([]);
  });

  it('does not fall back to English for the non-English languages', () => {
    i18n.setLang('en');
    const english = Object.fromEntries(
      Object.keys(PORTFOLIO_COPY).map((key) => [key, i18n.t(key)]),
    );

    const fallbacks: string[] = [];
    for (const { code } of LANGS) {
      if (code === 'en') continue;
      i18n.setLang(code);
      for (const key of Object.keys(PORTFOLIO_COPY)) {
        if (EMPTY_BY_DESIGN.has(`${key}:${code}`)) continue;
        if (i18n.t(key) === english[key]) fallbacks.push(`${key}:${code}`);
      }
    }
    expect(fallbacks).toEqual([]);
  });

  it('keeps the seven language list and the copy table in step', () => {
    const codes = LANGS.map((entry) => entry.code);
    expect(codes).toEqual<Lang[]>(['zh', 'en', 'de', 'nl', 'es', 'fr', 'it']);
    for (const copy of Object.values(PORTFOLIO_COPY)) {
      expect(Object.keys(copy).sort()).toEqual([...codes].sort());
    }
  });
});
