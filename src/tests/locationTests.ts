import {
  getGeolocationErrorMessage,
  isConfirmedLocation,
  isValidCoordinates,
  locationService,
} from '../services/locationService';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, name: string): void {
  totalTests++;
  if (!condition) throw new Error(`Test failed: ${name}`);
  passedTests++;
  console.log(`  [PASS] ${name}`);
}

const photonResults = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [77.6412, 12.9716] },
      properties: {
        name: 'Indiranagar',
        street: '100 Feet Road',
        city: 'Bengaluru',
        country: 'India',
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [200, 91] },
      properties: { name: 'Invalid coordinates' },
    },
  ],
};

async function run(): Promise<void> {
  const originalFetch = globalThis.fetch;
  const originalDateNow = Date.now;
  const requestedUrls: URL[] = [];
  let testClockOffset = 0;

  try {
    Date.now = () => originalDateNow() + testClockOffset;
    globalThis.fetch = (async (input: RequestInfo | URL): Promise<Response> => {
      requestedUrls.push(new URL(input instanceof Request ? input.url : String(input)));
      return new Response(JSON.stringify(photonResults), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    assert(isValidCoordinates(12.9716, 77.6412), 'Accept valid Bengaluru coordinates');
    assert(!isValidCoordinates(91, 77.6412), 'Reject latitude outside geographic range');
    assert(!isValidCoordinates(12.9716, Number.NaN), 'Reject non-finite longitude');
    assert(isConfirmedLocation('Indiranagar, Bengaluru', { lat: 12.9716, lng: 77.6412 }, true),
      'Allow explicitly confirmed address and coordinates');
    assert(!isConfirmedLocation('Indiranagar, Bengaluru', { lat: 12.9716, lng: 77.6412 }, false),
      'Do not allow an unconfirmed location');
    assert(!isConfirmedLocation('Indiranagar, Bengaluru', undefined, true),
      'Do not allow a confirmed address without coordinates');
    assert(!isConfirmedLocation('   ', { lat: 12.9716, lng: 77.6412 }, true),
      'Do not allow a blank address');
    assert(getGeolocationErrorMessage(1).includes('Allow location access'),
      'Give permission-denied recovery guidance');
    assert(getGeolocationErrorMessage(2).includes('Check device location services'),
      'Give unavailable-position recovery guidance');
    assert(getGeolocationErrorMessage(3).includes('Try again'),
      'Give geolocation-timeout recovery guidance');

    const matches = await locationService.search('Indiranagar Bengaluru');
    assert(matches.length === 1, 'Filter malformed geocoder results');
    assert(matches[0].latitude === 12.9716 && matches[0].longitude === 77.6412,
      'Convert GeoJSON longitude-latitude order into numeric latitude-longitude');
    assert(matches[0].address === 'Indiranagar, 100 Feet Road, Bengaluru, India',
      'Format a readable address from geocoder fields');
    assert(requestedUrls[0].searchParams.get('q') === 'Indiranagar Bengaluru',
      'Send the typed address to Photon');

    testClockOffset += 1000;
    const reversed = await locationService.reverse(12.9701, 77.6402);
    assert(requestedUrls[1].pathname === '/api/reverse', 'Use Photon reverse geocoding endpoint');
    assert(requestedUrls[1].searchParams.get('lat') === '12.9701'
      && requestedUrls[1].searchParams.get('lon') === '77.6402',
    'Send selected map coordinates for reverse geocoding');
    assert(reversed.latitude === 12.9701 && reversed.longitude === 77.6402,
      'Keep exact selected coordinates alongside the resolved address');

    const controller = new AbortController();
    const cancelledRequest = locationService.search('Cancelled search', controller.signal);
    controller.abort();
    let aborted = false;
    try {
      await cancelledRequest;
    } catch (error) {
      aborted = error instanceof Error && error.name === 'AbortError';
    }
    assert(aborted && requestedUrls.length === 2, 'Abort stale geocoder requests before network dispatch');

    console.log(`\n${passedTests}/${totalTests} location tests passed.`);
  } finally {
    globalThis.fetch = originalFetch;
    Date.now = originalDateNow;
  }
}

void run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
