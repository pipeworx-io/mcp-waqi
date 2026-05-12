interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * WAQI MCP — World Air Quality Index (free key)
 *
 * 12,000+ monitoring stations worldwide. Complements `airquality` (Open-Meteo
 * gridded forecast) and `openaq` (open dataset) with WAQI's real-time station
 * readings + AQI category (Good / Moderate / Unhealthy / Hazardous).
 *
 * API: https://aqicn.org/api/
 * Auth: ?token=<key> query param. Register at https://aqicn.org/data-platform/token/
 *
 * Tools:
 * - get_aqi_by_city:     AQI for a city by name
 * - get_aqi_by_location: AQI for the station nearest a lat/lon
 * - get_aqi_by_station:  AQI for a specific WAQI station UID
 * - search_stations:     find stations by keyword
 */


const BASE_URL = 'https://api.waqi.info';

const tools: McpToolExport['tools'] = [
  {
    name: 'get_aqi_by_city',
    description:
      'Real-time AQI for a city. Returns AQI value, dominant pollutant, individual pollutant readings (PM2.5, PM10, O3, NO2, SO2, CO), temperature/humidity/pressure, and station info.',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name (e.g., "beijing", "los-angeles", "new-delhi")' },
      },
      required: ['city'],
    },
  },
  {
    name: 'get_aqi_by_location',
    description: 'Real-time AQI for the WAQI station nearest a lat/lon.',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: 'Latitude' },
        longitude: { type: 'number', description: 'Longitude' },
      },
      required: ['latitude', 'longitude'],
    },
  },
  {
    name: 'get_aqi_by_station',
    description: 'Real-time AQI for a specific WAQI station by UID (numeric).',
    inputSchema: {
      type: 'object',
      properties: {
        station_id: { type: 'number', description: 'WAQI station UID (returned by search_stations)' },
      },
      required: ['station_id'],
    },
  },
  {
    name: 'search_stations',
    description: 'Search stations by keyword (city/region name). Returns station UID, name, current AQI, and location.',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'Search keyword' },
      },
      required: ['keyword'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = (args._apiKey as string | undefined)?.trim();
  if (!apiKey) {
    throw new Error(
      'WAQI requires an API token. Contact the operator about platform credentials, or BYO via ?_apiKey=<token> after registering at https://aqicn.org/data-platform/token/.',
    );
  }
  switch (name) {
    case 'get_aqi_by_city':
      return getAqi(apiKey, `/feed/${encodeURIComponent(reqStr(args, 'city', '"beijing"'))}`);
    case 'get_aqi_by_location':
      return getAqi(apiKey, `/feed/geo:${args.latitude};${args.longitude}`);
    case 'get_aqi_by_station':
      return getAqi(apiKey, `/feed/@${args.station_id}`);
    case 'search_stations':
      return searchStations(apiKey, reqStr(args, 'keyword', '"tokyo" or "delhi"'));
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing or empty. Pass a string like ${example}.`);
  }
  return v;
}

async function waqiFetch<T>(apiKey: string, path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}/?token=${encodeURIComponent(apiKey)}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`WAQI error: ${res.status} ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

interface WaqiFeed {
  status?: string;
  data?: {
    aqi?: number;
    idx?: number;
    dominentpol?: string;
    time?: { s?: string; tz?: string; v?: number; iso?: string };
    city?: { name?: string; geo?: number[]; url?: string };
    iaqi?: Record<string, { v?: number }>;
    attributions?: { name?: string; url?: string }[];
    forecast?: { daily?: Record<string, { avg?: number; min?: number; max?: number; day?: string }[]> };
  };
  msg?: string;
}

function aqiCategory(aqi: number | null | undefined): string | null {
  if (aqi == null) return null;
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for sensitive groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

async function getAqi(apiKey: string, path: string) {
  const data = await waqiFetch<WaqiFeed>(apiKey, path);
  if (data.status !== 'ok' || !data.data) {
    throw new Error(`WAQI: ${data.msg ?? 'unknown error'}`);
  }
  const d = data.data;
  const iaqi = d.iaqi ?? {};
  const valueOf = (k: string) => iaqi[k]?.v ?? null;

  return {
    aqi: d.aqi ?? null,
    category: aqiCategory(d.aqi),
    dominant_pollutant: d.dominentpol ?? null,
    station: {
      id: d.idx ?? null,
      name: d.city?.name ?? null,
      latitude: d.city?.geo?.[0] ?? null,
      longitude: d.city?.geo?.[1] ?? null,
      url: d.city?.url ?? null,
    },
    measurements: {
      pm25: valueOf('pm25'),
      pm10: valueOf('pm10'),
      o3: valueOf('o3'),
      no2: valueOf('no2'),
      so2: valueOf('so2'),
      co: valueOf('co'),
      temperature_c: valueOf('t'),
      humidity_pct: valueOf('h'),
      pressure_hpa: valueOf('p'),
      wind_speed: valueOf('w'),
    },
    measured_at: d.time?.iso ?? d.time?.s ?? null,
    timezone: d.time?.tz ?? null,
    attributions: (d.attributions ?? []).map((a) => ({ name: a.name ?? null, url: a.url ?? null })),
  };
}

interface SearchResult {
  uid?: number;
  aqi?: string;
  station?: { name?: string; geo?: number[]; url?: string; country?: string };
  time?: { stime?: string; tz?: string };
}

async function searchStations(apiKey: string, keyword: string) {
  const data = await waqiFetch<{ status?: string; data?: SearchResult[]; msg?: string }>(
    apiKey,
    `/search/?keyword=${encodeURIComponent(keyword)}`,
  );
  if (data.status !== 'ok') {
    throw new Error(`WAQI: ${data.msg ?? 'unknown error'}`);
  }
  return {
    keyword,
    count: data.data?.length ?? 0,
    stations: (data.data ?? []).map((s) => ({
      station_id: s.uid ?? null,
      name: s.station?.name ?? null,
      aqi: s.aqi != null && s.aqi !== '-' ? Number(s.aqi) : null,
      country: s.station?.country ?? null,
      latitude: s.station?.geo?.[0] ?? null,
      longitude: s.station?.geo?.[1] ?? null,
      last_seen: s.time?.stime ?? null,
      timezone: s.time?.tz ?? null,
      url: s.station?.url ?? null,
    })),
  };
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
