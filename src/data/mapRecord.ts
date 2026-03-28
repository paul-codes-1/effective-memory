import type { ContributorRecord, RawContributorRecord } from './types';
import { normalize, parseAmount, buildFullName, slugify } from './utils';

/** Maps a raw historical (2022-2024) contributor record to a typed ContributorRecord. */
export const mapRecord = (raw: RawContributorRecord, index: number): ContributorRecord => {
  const contributorFirstName = normalize(raw['Contributor First Name']);
  const contributorLastName = normalize(raw['Contributor Last Name']);
  const recipientFirstName = normalize(raw['Recipient First Name']);
  const recipientLastName = normalize(raw['Recipient Last Name']);
  const orgName = normalize(raw['From Organization Name']);
  const contributorFullName =
    buildFullName(contributorFirstName, contributorLastName) || orgName || 'Unknown contributor';
  const recipientFullName =
    buildFullName(recipientFirstName, recipientLastName) || normalize(raw['To Organization']) || 'Unknown recipient';

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
    contributionType: normalize(raw['Contribution Type']),
    contributionMode: normalize(raw['Contribution Mode']),
    occupation: normalize(raw.Occupation),
    otherOccupation: normalize(raw['Other Occupation']),
    employer: normalize(raw.Employer),
    receiptDate: normalize(raw['Receipt Date']),
    identityKey: slugify(contributorFullName) || `missing-${index}`,
    isAnonymous: false,
    isNameMissing: !buildFullName(contributorFirstName, contributorLastName) && !orgName,
    attributionNote: null,
  };
};
