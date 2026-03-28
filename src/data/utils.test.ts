import { describe, it, expect } from 'vitest';
import { slugify, normalizeEmployerKey, normalize, parseAmount, buildFullName } from './utils';

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

  it('normalizes FCPS to fayette county public schools', () => {
    expect(normalizeEmployerKey('FCPS')).toBe('fayette county public schools');
  });

  it('normalizes "Fayette County Public Schools" to same key', () => {
    expect(normalizeEmployerKey('Fayette County Public Schools')).toBe('fayette county public schools');
  });

  it('passes through other employer names lowercased', () => {
    expect(normalizeEmployerKey('University of Kentucky')).toBe('university of kentucky');
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
