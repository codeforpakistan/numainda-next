export type AssemblyKey = "all" | "national" | "kp" | "balochistan" | "sindh";

export interface AssemblyMeta {
  key: AssemblyKey;
  /** Value to send to the API as ?assembly= (omit for "all"). */
  apiValue: string | null;
  /** Short label shown in tabs. */
  shortLabel: string;
  /** Longer label for badges / detail views. */
  longLabel: string;
  /** "MNA" for national, "MPA" for provincial. */
  memberTitle: string;
}

export const ASSEMBLIES: AssemblyMeta[] = [
  {
    key: "all",
    apiValue: null,
    shortLabel: "All",
    longLabel: "All assemblies",
    memberTitle: "MNAs & MPAs",
  },
  {
    key: "national",
    apiValue: "national",
    shortLabel: "National (MNAs)",
    longLabel: "National Assembly",
    memberTitle: "MNA",
  },
  {
    key: "kp",
    apiValue: "kp",
    shortLabel: "KP MPAs",
    longLabel: "Khyber Pakhtunkhwa Assembly",
    memberTitle: "MPA",
  },
  {
    key: "sindh",
    apiValue: "sindh",
    shortLabel: "Sindh MPAs",
    longLabel: "Sindh Assembly",
    memberTitle: "MPA",
  },
  {
    key: "balochistan",
    apiValue: "balochistan",
    shortLabel: "Balochistan MPAs",
    longLabel: "Balochistan Assembly",
    memberTitle: "MPA",
  },
];

export function getAssemblyMeta(value: string | null | undefined): AssemblyMeta {
  if (!value) return ASSEMBLIES[0];
  return ASSEMBLIES.find((a) => a.apiValue === value) ?? ASSEMBLIES[0];
}

export function getAssemblyLongLabel(value: string | null | undefined): string {
  return getAssemblyMeta(value).longLabel;
}

export function getAssemblyMemberTitle(
  value: string | null | undefined,
): string {
  return getAssemblyMeta(value).memberTitle;
}
