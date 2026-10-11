export interface GeocodedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

interface PhotonFeature {
  geometry?: {
    type?: unknown;
    coordinates?: unknown;
  };
  properties?: Record<string, unknown>;
}

const PHOTON_API = 'https://photon.komoot.io/api/';
const MIN_REQUEST_INTERVAL_MS = 1000;
const REQUEST_TIMEOUT_MS = 12000;
let lastRequestAt = 0;

export function isValidCoordinates(latitude: number, longitude: number): boolean {
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90
    && longitude >= -180 && longitude <= 180;
}

export function isConfirmedLocation(
  address: string,
  coordinates: { lat: number; lng: number } | undefined,
  confirmed: boolean
): boolean {
  return confirmed
    && address.trim().length > 0
    && Boolean(coordinates && isValidCoordinates(coordinates.lat, coordinates.lng));
}

export function getGeolocationErrorMessage(code: number): string {
  const recovery = code === 1
    ? 'Allow location access in browser settings, or search for an address or choose a map point.'
    : code === 2
      ? 'Check device location services, or search for an address or choose a map point.'
      : code === 3
        ? 'Try again, or search for an address or choose a map point.'
        : 'Search for an address or choose a map point instead.';
  return `Could not get your current location. ${recovery}`;
}

function readableAddress(properties: Record<string, unknown>): string {
  const parts = [
    properties.name,
    properties.housenumber,
    properties.street,
    properties.locality,
    properties.district,
    properties.city,
    properties.state,
    properties.postcode,
    properties.country,
  ].filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map(part => part.trim());
  const uniqueParts = parts.filter((part, index) =>
    parts.findIndex(candidate => candidate.toLocaleLowerCase() === part.toLocaleLowerCase()) === index
  );
  return uniqueParts.join(', ');
}

function parseFeature(value: unknown): GeocodedLocation | null {
  if (!value || typeof value !== 'object') return null;
  const feature = value as PhotonFeature;
  const coordinates = feature.geometry?.coordinates;
  const properties = feature.properties;
  if (feature.geometry?.type !== 'Point' || !Array.isArray(coordinates)
    || typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number'
    || !properties || !isValidCoordinates(coordinates[1], coordinates[0])) {
    return null;
  }
  const address = readableAddress(properties);
  if (!address) return null;
  return { latitude: coordinates[1], longitude: coordinates[0], address };
}

async function waitForRequestSlot(signal?: AbortSignal): Promise<void> {
  const delay = Math.max(0, lastRequestAt + MIN_REQUEST_INTERVAL_MS - Date.now());
  if (!delay) return;
  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('The request was aborted.', 'AbortError'));
      return;
    }
    const finish = () => signal?.removeEventListener('abort', onAbort);
    const onAbort = () => {
      clearTimeout(timeout);
      finish();
      reject(new DOMException('The request was aborted.', 'AbortError'));
    };
    const timeout = setTimeout(() => {
      finish();
      resolve();
    }, delay);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function requestPhoton(url: URL, signal?: AbortSignal): Promise<unknown> {
  await waitForRequestSlot(signal);
  if (signal?.aborted) throw new DOMException('The request was aborted.', 'AbortError');
  lastRequestAt = Date.now();
  const controller = new AbortController();
  let timedOut = false;
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  try {
    if (signal?.aborted) controller.abort();
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Location service returned ${response.status}.`);
    return await response.json() as unknown;
  } catch (error) {
    if (timedOut) throw new Error('Location service request timed out. Please try again.');
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onAbort);
  }
}

function readFeatures(value: unknown): GeocodedLocation[] {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { features?: unknown }).features)) {
    throw new Error('Location service returned an invalid response.');
  }
  return ((value as { features: unknown[] }).features)
    .map(parseFeature)
    .filter((location): location is GeocodedLocation => location !== null);
}

export const locationService = {
  async search(query: string, signal?: AbortSignal): Promise<GeocodedLocation[]> {
    const url = new URL(PHOTON_API);
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '6');
    url.searchParams.set('lang', 'en');
    const data = await requestPhoton(url, signal);
    return readFeatures(data);
  },

  async reverse(latitude: number, longitude: number, signal?: AbortSignal): Promise<GeocodedLocation> {
    if (!isValidCoordinates(latitude, longitude)) throw new Error('Coordinates are outside valid geographic ranges.');
    const url = new URL(PHOTON_API);
    url.pathname = `${url.pathname.replace(/\/$/, '')}/reverse`;
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    url.searchParams.set('lang', 'en');
    const data = await requestPhoton(url, signal);
    const location = readFeatures(data)[0];
    if (!location) throw new Error('No readable address was found for this map location.');
    return { ...location, latitude, longitude };
  },
};
