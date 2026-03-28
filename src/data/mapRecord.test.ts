import { describe, it, expect } from 'vitest';
import { mapRecord } from './mapRecord';
import { rawRecords } from '../test/fixtures/contributors';

describe('mapRecord (historical)', () => {
  it('maps standard fields correctly', () => {
    const result = mapRecord(rawRecords[0], 0);
    expect(result.contributorFullName).toBe('John Smith');
    expect(result.recipientFullName).toBe('Jane Doe');
    expect(result.amount).toBe(100);
    expect(result.identityKey).toBe('john-smith');
  });

  it('falls back to org name when name parts are empty', () => {
    const result = mapRecord(rawRecords[3], 3);
    expect(result.contributorFullName).toBe('Protect Lex PAC');
  });

  it('falls back to "Unknown contributor" when no name or org', () => {
    const result = mapRecord(rawRecords[4], 4);
    // Historical mapper doesn't have ANONYMOUS logic — falls back to Unknown
    expect(result.contributorFullName).toBe('Unknown contributor');
  });

  it('sets isAnonymous to false for all historical records', () => {
    const result = mapRecord(rawRecords[4], 4);
    expect(result.isAnonymous).toBe(false);
  });

  it('sets isNameMissing when no name or org', () => {
    const result = mapRecord(rawRecords[4], 4);
    expect(result.isNameMissing).toBe(true);
  });

  it('sets attributionNote to null', () => {
    const result = mapRecord(rawRecords[0], 0);
    expect(result.attributionNote).toBeNull();
  });
});
