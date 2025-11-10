export interface RawContributorRecord {
  [key: string]: string | undefined;
}

export interface ContributorRecord {
  id: string;
  toOrganization: string;
  fromOrganizationName: string;
  contributorFirstName: string;
  contributorLastName: string;
  contributorFullName: string;
  recipientFirstName: string;
  recipientLastName: string;
  recipientFullName: string;
  officeSought: string;
  location: string;
  electionDate: string;
  electionType: string;
  exemptionStatus: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  amount: number;
  contributionType: string;
  contributionMode: string;
  occupation: string;
  otherOccupation: string;
  employer: string;
  receiptDate: string;
}

export interface ContributorTotal {
  key: string;
  fullName: string;
  totalAmount: number;
  contributionCount: number;
}

export type ContributorTotalsMap = Record<string, ContributorTotal>;

export interface ContributorsState {
  data: ContributorRecord[];
  totals: ContributorTotalsMap;
  loading: boolean;
  error: string | null;
}
