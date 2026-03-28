import { describe, it, expect } from 'vitest';
import { mapLfucgRecord } from './mapLfucgRecord';
import { rawRecords } from '../test/fixtures/contributors';

describe('mapLfucgRecord', () => {
  it('maps standard contributor fields correctly', () => {
    const result = mapLfucgRecord(rawRecords[0], 0);
    expect(result.contributorFirstName).toBe('John');
    expect(result.contributorLastName).toBe('Smith');
    expect(result.contributorFullName).toBe('John Smith');
    expect(result.recipientFullName).toBe('Jane Doe');
    expect(result.officeSought).toBe('MAYOR');
    expect(result.amount).toBe(100);
    expect(result.contributionType).toBe('MONETARY');
    expect(result.contributionMode).toBe('CHECK');
    expect(result.employer).toBe('FCPS');
    expect(result.occupation).toBe('Engineer');
    expect(result.city).toBe('Lexington');
    expect(result.state).toBe('KY');
  });

  it('generates a stable id from index, names, and date', () => {
    const result = mapLfucgRecord(rawRecords[0], 0);
    expect(result.id).toBe('0-John Smith-Jane Doe-1/15/2026');
  });

  it('sets identityKey as slugified full name for named contributors', () => {
    const result = mapLfucgRecord(rawRecords[0], 0);
    expect(result.identityKey).toBe('john-smith');
  });

  it('falls back to org name when name parts are empty', () => {
    const result = mapLfucgRecord(rawRecords[3], 3);
    expect(result.contributorFullName).toBe('Protect Lex PAC');
    expect(result.identityKey).toBe('protect-lex-pac');
    expect(result.isNameMissing).toBe(false);
  });

  it('marks anonymous contributions with unique identity keys', () => {
    const result = mapLfucgRecord(rawRecords[4], 4);
    expect(result.contributorFullName).toBe('Anonymous');
    expect(result.isAnonymous).toBe(true);
    expect(result.isNameMissing).toBe(true);
    expect(result.attributionNote).toBe('Filed as anonymous per campaign finance report.');
    expect(result.identityKey).toBe('anonymous-4');
  });

  it('gives different anonymous contributions different identity keys', () => {
    const r1 = mapLfucgRecord(rawRecords[4], 4);
    const r2 = mapLfucgRecord(rawRecords[4], 5);
    expect(r1.identityKey).not.toBe(r2.identityKey);
  });

  it('handles negative amounts (refunds)', () => {
    const result = mapLfucgRecord(rawRecords[5], 5);
    expect(result.amount).toBe(-50);
    expect(result.contributionType).toBe('REFUND');
  });

  it('handles zero amounts', () => {
    const result = mapLfucgRecord(rawRecords[6], 6);
    expect(result.amount).toBe(0);
    expect(result.contributionType).toBe('IN-KIND');
  });

  it('labels CANDIDATE self-funding with descriptive name and scoped key', () => {
    const candidateRecord = {
      ...rawRecords[4],
      'Contribution Type': 'CANDIDATE',
      'Recipient First Name': 'Chris',
      'Recipient Last Name': 'Shafer',
    };
    const result = mapLfucgRecord(candidateRecord, 99);
    expect(result.contributorFullName).toBe('Chris Shafer (candidate self-funding)');
    expect(result.identityKey).toBe('candidate-self-chris-shafer');
    expect(result.attributionNote).toBe("Candidate's own funds contributed to their campaign.");
  });

  it('labels UNITEMIZED contributions with descriptive name and scoped key', () => {
    const unitemizedRecord = {
      ...rawRecords[4],
      'Contribution Type': 'UNITEMIZED',
      'Recipient First Name': 'Raquel',
      'Recipient Last Name': 'Carter',
    };
    const result = mapLfucgRecord(unitemizedRecord, 99);
    expect(result.contributorFullName).toBe('Unitemized contributions to Raquel Carter');
    expect(result.identityKey).toBe('unitemized-raquel-carter');
    expect(result.attributionNote).toBe('Bundled small-dollar contributions below the itemization threshold.');
  });

  it('sets attributionNote to null for normal contributors', () => {
    const result = mapLfucgRecord(rawRecords[0], 0);
    expect(result.attributionNote).toBeNull();
  });
});
