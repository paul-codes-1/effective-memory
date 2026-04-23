import { describe, it, expect } from 'vitest';
import { slugify, normalizeEmployerKey, normalize, parseAmount, buildFullName, buildIdentityKey } from './utils';

describe('slugify', () => {
  it('lowercases and hyphenates normal names', () => {
    expect(slugify('John Smith')).toBe('john-smith');
  });

  it('trims leading/trailing whitespace', () => {
    expect(slugify('  Jane Doe  ')).toBe('jane-doe');
  });

  it('strips special characters', () => {
    expect(slugify("O'Brien & Associates")).toBe('o-brien-associates');
  });

  it('collapses multiple non-alphanumeric chars into one hyphen', () => {
    expect(slugify('Hello---World!!!')).toBe('hello-world');
  });

  it('returns "unknown" for empty string', () => {
    expect(slugify('')).toBe('unknown');
  });

  it('returns "unknown" for whitespace-only string', () => {
    expect(slugify('   ')).toBe('unknown');
  });

  it('is idempotent on already-slugified input', () => {
    expect(slugify('john-smith')).toBe('john-smith');
  });
});

describe('normalizeEmployerKey', () => {
  it('lowercases and trims', () => {
    expect(normalizeEmployerKey('  Brown & Associates  ')).toBe('brown & associates');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeEmployerKey('Brown   &   Associates')).toBe('brown & associates');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeEmployerKey('')).toBe('');
  });

  it('returns empty string for "unknown"', () => {
    expect(normalizeEmployerKey('unknown')).toBe('');
  });

  it('returns empty string for "n/a"', () => {
    expect(normalizeEmployerKey('N/A')).toBe('');
  });

  it('returns empty string for "retired"', () => {
    expect(normalizeEmployerKey('Retired')).toBe('');
    expect(normalizeEmployerKey('retired')).toBe('');
  });

  it('returns empty string for "not employed"', () => {
    expect(normalizeEmployerKey('Not Employed')).toBe('');
    expect(normalizeEmployerKey('Not employed')).toBe('');
  });

  it('normalizes FCPS to Fayette County Public Schools', () => {
    expect(normalizeEmployerKey('FCPS')).toBe('Fayette County Public Schools');
  });

  it('normalizes "Fayette County Public Schools" to same canonical form', () => {
    expect(normalizeEmployerKey('Fayette County Public Schools')).toBe('Fayette County Public Schools');
  });

  it('normalizes KBJ variants', () => {
    expect(normalizeEmployerKey('Kbj')).toBe('KBJ');
    expect(normalizeEmployerKey('KBJ')).toBe('KBJ');
  });

  it('normalizes GALLS variants', () => {
    expect(normalizeEmployerKey('GALLS')).toBe('Galls');
    expect(normalizeEmployerKey('Galls')).toBe('Galls');
  });

  it('normalizes Kentucky for Kentucky variants', () => {
    expect(normalizeEmployerKey('Kentucky for Kentucky')).toBe('Kentucky for Kentucky');
    expect(normalizeEmployerKey('Kentucky For Kentucky')).toBe('Kentucky for Kentucky');
  });

  it('extracts employer from "Self Employed, X" compounds', () => {
    expect(normalizeEmployerKey('Self Employed, Guide Realty')).toBe('guide realty');
    expect(normalizeEmployerKey('Self employed, Guide Realty')).toBe('guide realty');
    expect(normalizeEmployerKey('Self-Employed, Guide Realty')).toBe('guide realty');
  });

  it('all self-employed variants for same employer normalize to same key', () => {
    const key1 = normalizeEmployerKey('Self Employed, Guide Realty');
    const key2 = normalizeEmployerKey('Self employed, Guide Realty');
    const key3 = normalizeEmployerKey('Self-Employed, Guide Realty');
    const key4 = normalizeEmployerKey('Guide Realty');
    expect(key1).toBe(key2);
    expect(key2).toBe(key3);
    expect(key3).toBe(key4);
  });

  it('extracts and normalizes employer from self-employed compounds', () => {
    expect(normalizeEmployerKey('Self Employed, Hoop Dreams')).toBe('hoop dreams');
    expect(normalizeEmployerKey('Self employed, REAL')).toBe('real');
    expect(normalizeEmployerKey('Self Employed, Bluegrass Properties')).toBe('bluegrass properties');
  });

  it('returns empty for bare "Self Employed" with no actual employer', () => {
    expect(normalizeEmployerKey('Self Employed')).toBe('');
    expect(normalizeEmployerKey('Self-Employed')).toBe('');
  });

  it('passes through other employer names lowercased', () => {
    expect(normalizeEmployerKey('Brown & Associates')).toBe('brown & associates');
  });

  it('merges UK variants with University of Kentucky', () => {
    expect(normalizeEmployerKey('UK')).toBe('University of Kentucky');
    expect(normalizeEmployerKey('uk')).toBe('University of Kentucky');
    expect(normalizeEmployerKey('University of Kentucky')).toBe('University of Kentucky');
    expect(normalizeEmployerKey('University of kentucky')).toBe('University of Kentucky');
    expect(normalizeEmployerKey('University of Kentucky ')).toBe('University of Kentucky');
  });

  it('keeps UK HealthCare and UK Credit Union distinct from University of Kentucky', () => {
    expect(normalizeEmployerKey('UK HealthCare')).toBe('uk healthcare');
    expect(normalizeEmployerKey('UK Credit Union')).toBe('uk credit union');
  });
});

describe('normalize', () => {
  it('trims whitespace from strings', () => {
    expect(normalize('  hello  ')).toBe('hello');
  });

  it('converts numbers to trimmed strings', () => {
    expect(normalize(42)).toBe('42');
  });

  it('returns empty string for undefined', () => {
    expect(normalize(undefined)).toBe('');
  });

  it('returns empty string for null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(normalize(null as any)).toBe('');
  });
});

describe('parseAmount', () => {
  it('parses string numbers', () => {
    expect(parseAmount('100')).toBe(100);
  });

  it('parses actual numbers', () => {
    expect(parseAmount(250.5)).toBe(250.5);
  });

  it('parses negative amounts', () => {
    expect(parseAmount('-50')).toBe(-50);
  });

  it('returns 0 for empty string', () => {
    expect(parseAmount('')).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(parseAmount(undefined)).toBe(0);
  });

  it('returns 0 for NaN-producing input', () => {
    expect(parseAmount('not a number')).toBe(0);
  });

  it('returns 0 for null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(parseAmount(null as any)).toBe(0);
  });
});

describe('buildFullName', () => {
  it('joins first and last', () => {
    expect(buildFullName('John', 'Smith')).toBe('John Smith');
  });

  it('returns first only if last is empty', () => {
    expect(buildFullName('John', '')).toBe('John');
  });

  it('returns last only if first is empty', () => {
    expect(buildFullName('', 'Smith')).toBe('Smith');
  });

  it('returns empty string when both are empty', () => {
    expect(buildFullName('', '')).toBe('');
  });
});

describe('buildIdentityKey', () => {
  it('returns slugified name for named contributors', () => {
    expect(
      buildIdentityKey({
        hasName: true,
        hasOrg: false,
        contributorFullName: 'John Smith',
        contributionType: 'MONETARY',
        recipientFullName: 'Jane Doe',
        index: 0,
      }),
    ).toBe('john-smith');
  });

  it('returns slugified org name for org-only contributors', () => {
    expect(
      buildIdentityKey({
        hasName: false,
        hasOrg: true,
        contributorFullName: 'Protect Lex PAC',
        contributionType: 'MONETARY',
        recipientFullName: 'Jane Doe',
        index: 3,
      }),
    ).toBe('protect-lex-pac');
  });

  it('scopes CANDIDATE self-funding by recipient', () => {
    expect(
      buildIdentityKey({
        hasName: false,
        hasOrg: false,
        contributorFullName: 'Christopher Shafer (candidate self-funding)',
        contributionType: 'CANDIDATE',
        recipientFullName: 'Christopher Shafer',
        index: 1,
      }),
    ).toBe('candidate-self-christopher-shafer');
  });

  it('scopes UNITEMIZED contributions by recipient', () => {
    expect(
      buildIdentityKey({
        hasName: false,
        hasOrg: false,
        contributorFullName: 'Unitemized contributions to Raquel Carter',
        contributionType: 'UNITEMIZED',
        recipientFullName: 'Raquel Carter',
        index: 2,
      }),
    ).toBe('unitemized-raquel-carter');
  });

  it('makes each ANONYMOUS contribution unique', () => {
    const key1 = buildIdentityKey({
      hasName: false,
      hasOrg: false,
      contributorFullName: 'Anonymous',
      contributionType: 'ANONYMOUS',
      recipientFullName: 'Bob Jones',
      index: 5,
    });
    const key2 = buildIdentityKey({
      hasName: false,
      hasOrg: false,
      contributorFullName: 'Anonymous',
      contributionType: 'ANONYMOUS',
      recipientFullName: 'Bob Jones',
      index: 6,
    });
    expect(key1).toBe('anonymous-5');
    expect(key2).toBe('anonymous-6');
    expect(key1).not.toBe(key2);
  });

  it('makes CASH unnamed contributions unique', () => {
    expect(
      buildIdentityKey({
        hasName: false,
        hasOrg: false,
        contributorFullName: 'Unnamed cash contribution',
        contributionType: 'CASH',
        recipientFullName: 'Raquel Carter',
        index: 10,
      }),
    ).toBe('cash-unnamed-10');
  });

  it('falls back to unnamed-index for unknown types without names', () => {
    expect(
      buildIdentityKey({
        hasName: false,
        hasOrg: false,
        contributorFullName: 'Name unavailable',
        contributionType: 'OTHER',
        recipientFullName: 'Someone',
        index: 99,
      }),
    ).toBe('unnamed-99');
  });
});
