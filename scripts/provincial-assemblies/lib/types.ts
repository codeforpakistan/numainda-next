export type Assembly = "kp" | "balochistan" | "sindh" | "punjab";

export type SeatType = "general" | "women_reserved" | "minority_reserved";

export type Province =
  | "Khyber Pakhtunkhwa"
  | "Balochistan"
  | "Sindh"
  | "Punjab";

export interface ProvincialMember {
  assembly: Assembly;
  province: Province;
  sequenceNumber: number;

  name: string;
  nameClean: string;
  fatherName: string | null;

  party: string;
  partyCode: string;

  seatType: SeatType;
  constituencyCode: string | null;
  constituencyName: string | null;
  district: string | null;

  email: string | null;
  phone: string | null;
  facebookHandle: string | null;
  age: number | null;
  oathTakingDate: string | null;

  profileUrl: string | null;
  profileSourceId: string | null;

  imageSourcePath: string | null;
  imageLocalPath: string | null;

  provenanceNote: string | null;
}
