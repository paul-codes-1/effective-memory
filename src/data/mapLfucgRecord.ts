import type { ContributorRecord, RawContributorRecord } from './types';
import { normalize, parseAmount, buildFullName, buildIdentityKey } from './utils';

/** Maps a raw LFUCG 2026 contributor record to a typed ContributorRecord. */
export const mapLfucgRecord = (raw: RawContributorRecord, index: number): ContributorRecord => {
  const contributorFirstName = normalize(raw['Contributor First Name']);
  const contributorLastName = normalize(raw['Contributor Last Name']);
  const recipientFirstName = normalize(raw['Recipient First Name']);
  const recipientLastName = normalize(raw['Recipient Last Name']);
  const orgName = normalize(raw['From Organization Name']);
  const contributionType = normalize(raw['Contribution Type']);

  const hasName = !!buildFullName(contributorFirstName, contributorLastName);
  const recipientFullName =
    buildFullName(recipientFirstName, recipientLastName) || normalize(raw['To Organization']) || 'Unknown recipient';

  // Build display name based on contribution type for unnamed records
  let contributorFullName: string;
  if (hasName) {
    contributorFullName = buildFullName(contributorFirstName, contributorLastName);
  } else if (orgName) {
    contributorFullName = orgName;
  } else if (contributionType === 'CANDIDATE') {
    contributorFullName = `${recipientFullName} (candidate self-funding)`;
  } else if (contributionType === 'UNITEMIZED') {
    contributorFullName = `Unitemized contributions to ${recipientFullName}`;
  } else if (contributionType === 'ANONYMOUS') {
    contributorFullName = 'Anonymous';
  } else if (contributionType === 'CASH') {
    contributorFullName = 'Unnamed cash contribution';
  } else {
    contributorFullName = 'Name unavailable';
  }

  const identityKey = buildIdentityKey({
    hasName,
    hasOrg: !!orgName,
    contributorFullName,
    contributionType,
    recipientFullName,
    index,
  });

  const isAnonymous = contributionType === 'ANONYMOUS';
  const isNameMissing = !hasName && !orgName;

  let attributionNote: string | null = null;
  if (isAnonymous) {
    attributionNote = 'Filed as anonymous per campaign finance report.';
  } else if (contributionType === 'CANDIDATE' && isNameMissing) {
    attributionNote = "Candidate's own funds contributed to their campaign.";
  } else if (contributionType === 'UNITEMIZED') {
    attributionNote = 'Bundled small-dollar contributions below the itemization threshold.';
  } else if (contributionType === 'CASH' && isNameMissing) {
    attributionNote = 'Cash contribution without an itemized donor name.';
  } else if (isNameMissing) {
    attributionNote = 'Original filing did not include a contributor name.';
  }

  return {
    id: `${index}-${contributorFullName}-${recipientFullName}-${normalize(raw['Receipt Date'])}`,
    toOrganization: normalize(raw['To Organization']),
    fromOrganizationName: orgName,
    contributorFirstName,
    contributorLastName,
    contributorFullName,
    recipientFirstName,
    recipientLastName,
    recipientFullName,
    officeSought: normalize(raw['Office Sought']),
    location: normalize(raw.Location),
    electionDate: normalize(raw['Election Date']),
    electionType: normalize(raw['Election Type']),
    exemptionStatus: normalize(raw['Exemption Status']),
    address1: normalize(raw['Address 1']),
    address2: normalize(raw['Address 2']),
    city: normalize(raw.City),
    state: normalize(raw.State),
    zip: normalize(raw.Zip),
    amount: parseAmount(raw.Amount),
    contributionType,
    contributionMode: normalize(raw['Contribution Mode']),
    occupation: normalize(raw.Occupation),
    otherOccupation: normalize(raw['Other Occupation']),
    employer: normalize(raw.Employer),
    receiptDate: normalize(raw['Receipt Date']),
    identityKey,
    isAnonymous,
    isNameMissing,
    attributionNote,
  };
};
