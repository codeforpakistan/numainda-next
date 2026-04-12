const CANONICAL: Record<string, string> = {
  "pakistan tehreek-e-insaf": "PTI",
  "pakistan tehreek e insaf": "PTI",
  "pti": "PTI",
  "pakistan tehreek-e-insaaf parliamentarians": "PTIP",
  "pakistan tehreek e insaaf parliamentarians": "PTIP",
  "pakistan tehreek-e-insaaf parliamentarians (ptip)": "PTIP",

  "pakistan muslim league (n)": "PMLN",
  "pakistan muslim league(n)": "PMLN",
  "pakistan muslim league (nawaz)": "PMLN",
  "pml(n)": "PMLN",
  "pml (n)": "PMLN",
  "pml-n": "PMLN",
  "pmln": "PMLN",

  "pakistan muslim league (z)": "PMLZ",
  "pml (z)": "PMLZ",
  "pml(z)": "PMLZ",
  "pmlz": "PMLZ",

  "pakistan muslim league (q)": "PMLQ",
  "pakistan muslim league": "PMLQ",
  "pml": "PMLQ",

  "pakistan peoples party parliamentarians": "PPPP",
  "pakistan peoples party": "PPP",
  "ppp": "PPP",
  "pppp": "PPPP",

  "muttahida qomi movement pakistan": "MQMP",
  "muttahida quami movement pakistan": "MQMP",
  "mqm": "MQMP",
  "mqm-p": "MQMP",
  "mqmp": "MQMP",

  "jamiat ulema islam (f)": "JUIF",
  "jamiat-e-ulema islam (f)": "JUIF",
  "jamiat e ulema islam (f)": "JUIF",
  "jui(f)": "JUIF",
  "jui (f)": "JUIF",
  "jui-f": "JUIF",
  "juif": "JUIF",

  "jamiat ulema islam (p)": "JUIP",
  "jui(p)": "JUIP",
  "jui (p)": "JUIP",
  "juip": "JUIP",

  "awami national party": "ANP",
  "anp": "ANP",

  "balochistan awami party": "BAP",
  "bap": "BAP",

  "national party": "NP",

  "jamaat-e-islami": "JI",
  "jamaat e islami": "JI",
  "jamaat-e-islami pakistan": "JI",
  "ji": "JI",

  "haq do tehreek": "HDT",
  "hazara democratic party": "HDP",

  "balochistan national party": "BNP",
  "bnp": "BNP",
  "balochistan national party (mengal)": "BNPM",
  "balochistan national party (awami)": "BNPA",
  "pakhtunkhwa milli awami party": "PKMAP",
  "pashtoonkhwa milli awami party": "PKMAP",
  "pkmap": "PKMAP",
  "np": "NP",

  "majlis wahdat e muslimeen pakistan": "MWMP",
  "majlis-e-wahdat-ul-muslimeen pakistan": "MWMP",
  "mwmp": "MWMP",
  "mwm": "MWMP",

  "istehkam-e-pakistan party": "IPP",
  "istehkam e pakistan party": "IPP",
  "ipp": "IPP",

  "sunni ittehad council": "SIC",
  "sic": "SIC",

  "independent": "IND",
  "independents": "IND",
  "ind": "IND",
};

const norm = (s: string): string =>
  s.toLowerCase().replace(/\s+/g, " ").trim();

export function normalizeParty(raw: string): string {
  const key = norm(raw);
  const code = CANONICAL[key];
  if (!code) {
    throw new Error(`Unknown party string: "${raw}" (normalized: "${key}")`);
  }
  return code;
}

export function tryNormalizeParty(raw: string): string | null {
  const key = norm(raw);
  return CANONICAL[key] ?? null;
}
