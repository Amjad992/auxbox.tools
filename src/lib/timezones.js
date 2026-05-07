// Shared timezone utilities. Provides both a curated short list and a
// full IANA zone list with search, for tools that need a zone picker.

// ─── Curated short list ──────────────────────────────────────────────────────
// Tools that want a simple dropdown use ZONE_OPTIONS and ZONE_VALUES.

export const ZONE_OPTIONS = [
  {value: 'utc', label: 'UTC'},
  {value: 'America/Los_Angeles', label: 'America/Los_Angeles (PT)'},
  {value: 'America/Denver', label: 'America/Denver (MT)'},
  {value: 'America/Chicago', label: 'America/Chicago (CT)'},
  {value: 'America/New_York', label: 'America/New_York (ET)'},
  {value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (BRT)'},
  {value: 'Europe/London', label: 'Europe/London (GMT/BST)'},
  {value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)'},
  {value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)'},
  {value: 'Africa/Lagos', label: 'Africa/Lagos (WAT)'},
  {value: 'Africa/Cairo', label: 'Africa/Cairo (EET)'},
  {value: 'Asia/Riyadh', label: 'Asia/Riyadh (AST · Arabia)'},
  {value: 'Asia/Dubai', label: 'Asia/Dubai (GST)'},
  {value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)'},
  {value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)'},
  {value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong (HKT)'},
  {value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)'},
  {value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST)'},
  {value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)'},
  {value: 'Pacific/Auckland', label: 'Pacific/Auckland (NZST)'},
];

export const ZONE_VALUES = ZONE_OPTIONS.map((z) => z.value);

// ─── Abbreviation lookup ─────────────────────────────────────────────────────
// Maps common timezone abbreviations to matching IANA zone names.
// A zone can appear under multiple abbreviations (e.g. America/New_York → ET, EST, EDT).

const ABBREV_MAP = {
  // UTC / GMT
  UTC: ['utc', 'Etc/UTC', 'Etc/GMT'],
  GMT: ['Europe/London', 'utc', 'Etc/GMT'],
  // North America (ET, CT, MT, PT, AKT, HST)
  ET: ['America/New_York', 'America/Toronto', 'America/Detroit'],
  EST: ['America/New_York', 'America/Toronto', 'America/Detroit'],
  EDT: ['America/New_York', 'America/Toronto', 'America/Detroit'],
  CT: ['America/Chicago', 'America/Winnipeg', 'America/Mexico_City'],
  CST: ['America/Chicago', 'America/Winnipeg', 'America/Mexico_City'],
  CDT: ['America/Chicago', 'America/Winnipeg', 'America/Mexico_City'],
  MT: ['America/Denver', 'America/Edmonton', 'America/Boise'],
  MST: ['America/Denver', 'America/Edmonton', 'America/Phoenix'],
  MDT: ['America/Denver', 'America/Edmonton', 'America/Boise'],
  PT: ['America/Los_Angeles', 'America/Vancouver', 'America/Tijuana'],
  PST: ['America/Los_Angeles', 'America/Vancouver', 'America/Tijuana'],
  PDT: ['America/Los_Angeles', 'America/Vancouver', 'America/Tijuana'],
  AKT: ['America/Anchorage', 'America/Juneau', 'America/Nome'],
  AKST: ['America/Anchorage', 'America/Juneau', 'America/Nome'],
  AKDT: ['America/Anchorage', 'America/Juneau', 'America/Nome'],
  HST: ['Pacific/Honolulu', 'America/Adak'],
  HAST: ['America/Adak'],
  HADT: ['America/Adak'],
  // Atlantic
  AT: ['America/Halifax', 'America/Puerto_Rico', 'America/Barbados'],
  AST: ['America/Halifax', 'America/Puerto_Rico', 'America/Barbados', 'Asia/Riyadh'],
  ADT: ['America/Halifax'],
  NDT: ['America/St_Johns'],
  NST: ['America/St_Johns'],
  // South America
  BRT: ['America/Sao_Paulo', 'America/Manaus', 'America/Fortaleza'],
  ART: ['America/Argentina/Buenos_Aires'],
  COT: ['America/Bogota'],
  CLT: ['America/Santiago'],
  PET: ['America/Lima'],
  VET: ['America/Caracas'],
  // Europe
  BST: ['Europe/London'],
  WET: ['Europe/Lisbon', 'Europe/Reykjavik'],
  WEST: ['Europe/Lisbon'],
  CET: ['Europe/Paris', 'Europe/Berlin', 'Europe/Rome', 'Europe/Madrid', 'Europe/Amsterdam'],
  CEST: ['Europe/Paris', 'Europe/Berlin', 'Europe/Rome', 'Europe/Madrid', 'Europe/Amsterdam'],
  EET: ['Europe/Helsinki', 'Europe/Bucharest', 'Europe/Kiev', 'Africa/Cairo'],
  EEST: ['Europe/Helsinki', 'Europe/Bucharest', 'Europe/Kiev'],
  MSK: ['Europe/Moscow', 'Europe/Minsk'],
  MSD: ['Europe/Moscow'],
  TRT: ['Europe/Istanbul'],
  // Africa
  WAT: ['Africa/Lagos', 'Africa/Bangui', 'Africa/Douala'],
  CAT: ['Africa/Harare', 'Africa/Lusaka', 'Africa/Maputo'],
  EAT: ['Africa/Nairobi', 'Africa/Addis_Ababa', 'Africa/Kampala'],
  SAST: ['Africa/Johannesburg'],
  // Middle East / Arabia
  GST: ['Asia/Dubai', 'Asia/Muscat'],
  // Asia
  IST: ['Asia/Kolkata', 'Asia/Calcutta'],
  PKT: ['Asia/Karachi'],
  BST_BD: ['Asia/Dhaka'],
  BDT: ['Asia/Dhaka'],
  ICT: ['Asia/Bangkok', 'Asia/Ho_Chi_Minh', 'Asia/Phnom_Penh'],
  SGT: ['Asia/Singapore'],
  HKT: ['Asia/Hong_Kong'],
  JST: ['Asia/Tokyo'],
  KST: ['Asia/Seoul'],
  CST_CN: ['Asia/Shanghai', 'Asia/Chongqing', 'Asia/Taipei'],
  // Australia
  AEST: ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane'],
  AEDT: ['Australia/Sydney', 'Australia/Melbourne'],
  ACST: ['Australia/Darwin', 'Australia/Adelaide'],
  ACDT: ['Australia/Adelaide'],
  AWST: ['Australia/Perth'],
  // Pacific
  NZST: ['Pacific/Auckland'],
  NZDT: ['Pacific/Auckland'],
  FJST: ['Pacific/Fiji'],
  // Named aliases
  'GMT-5': ['America/New_York'],
  'GMT+5': ['Asia/Karachi', 'Asia/Tashkent'],
};

// ─── Region aliases ──────────────────────────────────────────────────────────
// Maps colloquial region names to IANA zone prefixes or full names.

const REGION_KEYWORDS = {
  eastern: ['America/New_York', 'America/Toronto', 'America/Detroit'],
  central: ['America/Chicago', 'America/Winnipeg'],
  mountain: ['America/Denver', 'America/Edmonton'],
  pacific: ['America/Los_Angeles', 'America/Vancouver'],
  atlantic: ['America/Halifax', 'America/Puerto_Rico'],
  hawaii: ['Pacific/Honolulu'],
  alaska: ['America/Anchorage'],
  arabian: ['Asia/Riyadh', 'Asia/Dubai', 'Asia/Kuwait'],
  india: ['Asia/Kolkata'],
  pakistan: ['Asia/Karachi'],
  china: ['Asia/Shanghai', 'Asia/Chongqing'],
  japan: ['Asia/Tokyo'],
  korea: ['Asia/Seoul'],
  australia: ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth'],
  europe: ['Europe/London', 'Europe/Paris', 'Europe/Berlin'],
  africa: ['Africa/Lagos', 'Africa/Cairo', 'Africa/Nairobi'],
  asia: ['Asia/Tokyo', 'Asia/Singapore', 'Asia/Kolkata'],
  americas: ['America/New_York', 'America/Los_Angeles', 'America/Sao_Paulo'],
};

// Build an inverted index: zone → set of search tokens (abbrevs + regions)
let _zoneTokenIndex = null;

function buildTokenIndex() {
  if (_zoneTokenIndex) return _zoneTokenIndex;
  _zoneTokenIndex = new Map();

  const addTokens = (zone, tokens) => {
    if (!_zoneTokenIndex.has(zone)) _zoneTokenIndex.set(zone, new Set());
    const s = _zoneTokenIndex.get(zone);
    tokens.forEach((t) => s.add(t.toLowerCase()));
  };

  // Abbreviations
  for (const [abbrev, zones] of Object.entries(ABBREV_MAP)) {
    zones.forEach((z) => addTokens(z, [abbrev]));
  }

  // Regions
  for (const [region, zones] of Object.entries(REGION_KEYWORDS)) {
    zones.forEach((z) => addTokens(z, [region]));
  }

  return _zoneTokenIndex;
}

// ─── getAllZones ─────────────────────────────────────────────────────────────

/**
 * Returns the full IANA timezone list via `Intl.supportedValuesOf('timeZone')`
 * if available in this runtime; falls back to the curated ZONE_VALUES list.
 */
export function getAllZones() {
  if (
    typeof Intl !== 'undefined' &&
    typeof Intl.supportedValuesOf === 'function'
  ) {
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch {
      // Fall through to fallback.
    }
  }
  // Fallback: curated list plus 'utc'.
  return ZONE_VALUES;
}

// ─── searchZones ─────────────────────────────────────────────────────────────

/**
 * Search the full IANA zone list by:
 *   - Full IANA name (e.g. "Europe/London")
 *   - Last segment / city name (e.g. "London", "New_York")
 *   - Common abbreviations (e.g. "BST", "ET", "JST")
 *   - Region/colloquial names (e.g. "Eastern", "Pacific")
 *
 * Results ranked: exact > prefix > contains.
 * Returns up to `limit` results (default 20).
 *
 * @param {string} query
 * @param {number} [limit=20]
 * @returns {{ value: string, label: string }[]}
 */
export function searchZones(query, limit = 20) {
  if (typeof query !== 'string' || query.trim() === '') return [];
  const q = query.trim().toLowerCase();
  const allZones = getAllZones();
  const tokenIndex = buildTokenIndex();

  // Score each zone.
  const scored = [];
  const seen = new Set();

  const addZone = (zone, score) => {
    if (seen.has(zone)) {
      // Keep highest score.
      const existing = scored.find((s) => s.zone === zone);
      if (existing && score > existing.score) existing.score = score;
      return;
    }
    seen.add(zone);
    scored.push({zone, score});
  };

  for (const zone of allZones) {
    const zoneLower = zone.toLowerCase();
    const city = zone.split('/').pop().replace(/_/g, ' ').toLowerCase();
    const tokens = tokenIndex.get(zone) || new Set();

    // IANA name match
    if (zoneLower === q) {
      addZone(zone, 100);
    } else if (zoneLower.startsWith(q)) {
      addZone(zone, 80);
    } else if (zoneLower.includes(q)) {
      addZone(zone, 50);
    }

    // City (last segment) match
    if (city === q) {
      addZone(zone, 95);
    } else if (city.startsWith(q)) {
      addZone(zone, 75);
    } else if (city.includes(q)) {
      addZone(zone, 45);
    }

    // Token (abbreviation + region) match
    for (const token of tokens) {
      if (token === q) {
        addZone(zone, 90);
        break;
      } else if (token.startsWith(q)) {
        addZone(zone, 70);
        break;
      } else if (token.includes(q)) {
        addZone(zone, 40);
        break;
      }
    }
  }

  // Sort by score descending, then alphabetically for stable ordering.
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.zone.localeCompare(b.zone);
  });

  return scored.slice(0, limit).map(({zone}) => ({
    value: zone,
    label: zone,
  }));
}
