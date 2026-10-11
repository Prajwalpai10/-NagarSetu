import React, { useEffect, useRef, useState } from 'react';
import {
  GeocodedLocation,
  getGeolocationErrorMessage,
  isValidCoordinates,
  locationService,
} from '../../services/locationService';
import { LocationMapPicker } from './LocationMapPicker';

export interface ComplaintLocationDraft {
  address: string;
  gpsCoords?: { lat: number; lng: number };
  locationSource: 'gps' | 'map' | 'manual';
  confirmed: boolean;
}

interface ComplaintLocationPickerProps {
  initialQuery: string;
  onChange: (location: ComplaintLocationDraft) => void;
}

type Coordinates = { lat: number; lng: number };

export const ComplaintLocationPicker: React.FC<ComplaintLocationPickerProps> = ({ initialQuery, onChange }) => {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<GeocodedLocation[]>([]);
  const [searchState, setSearchState] = useState<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('idle');
  const [retrySearch, setRetrySearch] = useState(0);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [selection, setSelection] = useState<GeocodedLocation | null>(null);
  const [mapCoordinates, setMapCoordinates] = useState<Coordinates>();
  const [source, setSource] = useState<ComplaintLocationDraft['locationSource']>('manual');
  const [confirmed, setConfirmed] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const searchEnabled = useRef(true);
  const searchRequest = useRef(0);
  const reverseRequest = useRef(0);
  const searchController = useRef<AbortController | null>(null);
  const reverseController = useRef<AbortController | null>(null);
  const geolocationRequest = useRef(0);

  const publish = (
    address: string,
    location: GeocodedLocation | null,
    nextSource: ComplaintLocationDraft['locationSource'],
    isConfirmed: boolean
  ) => {
    onChange({
      address,
      ...(location ? { gpsCoords: { lat: location.latitude, lng: location.longitude } } : {}),
      locationSource: nextSource,
      confirmed: isConfirmed,
    });
  };

  useEffect(() => {
    if (!searchEnabled.current || query.trim().length < 3) {
      setSuggestions([]);
      setSearchState('idle');
      setActiveSuggestion(-1);
      return;
    }

    const requestId = ++searchRequest.current;
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    const timer = window.setTimeout(async () => {
      setSearchState('loading');
      setLocationError('');
      try {
        const results = await locationService.search(query.trim(), controller.signal);
        if (requestId !== searchRequest.current) return;
        setSuggestions(results);
        setSearchState(results.length > 0 ? 'ready' : 'empty');
        setActiveSuggestion(-1);
      } catch (error) {
        if (controller.signal.aborted || requestId !== searchRequest.current) return;
        setSearchState('error');
        setLocationError(error instanceof Error ? error.message : 'Location search failed. Please try again.');
      }
    }, 500);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, retrySearch]);

  useEffect(() => () => {
    searchRequest.current++;
    reverseRequest.current++;
    geolocationRequest.current++;
    searchController.current?.abort();
    reverseController.current?.abort();
  }, []);

  const clearPendingLocationRequests = () => {
    searchEnabled.current = false;
    searchRequest.current++;
    searchController.current?.abort();
    reverseRequest.current++;
    reverseController.current?.abort();
    geolocationRequest.current++;
    setSuggestions([]);
    setSearchState('idle');
    setActiveSuggestion(-1);
  };

  const handleQueryChange = (value: string) => {
    clearPendingLocationRequests();
    searchEnabled.current = true;
    setQuery(value);
    setSelection(null);
    setMapCoordinates(undefined);
    setConfirmed(false);
    setMapVisible(false);
    setIsResolvingAddress(false);
    setIsLocating(false);
    setLocationError('');
    publish(value, null, 'manual', false);
  };

  const selectSuggestion = (location: GeocodedLocation) => {
    clearPendingLocationRequests();
    searchEnabled.current = false;
    setQuery(location.address);
    setSuggestions([]);
    setSearchState('idle');
    setSelection(location);
    setMapCoordinates({ lat: location.latitude, lng: location.longitude });
    setSource('manual');
    setConfirmed(false);
    setMapVisible(true);
    setLocationError('');
    setIsResolvingAddress(false);
    setIsLocating(false);
    publish(location.address, location, 'manual', false);
  };

  const resolveCoordinates = async (coordinates: Coordinates, locationSource: 'gps' | 'map') => {
    reverseRequest.current++;
    const requestId = reverseRequest.current;
    reverseController.current?.abort();
    const controller = new AbortController();
    reverseController.current = controller;
    setIsResolvingAddress(true);
    setLocationError('');
    try {
      const result = await locationService.reverse(coordinates.lat, coordinates.lng, controller.signal);
      if (requestId !== reverseRequest.current) return;
      const selected = { ...result, latitude: coordinates.lat, longitude: coordinates.lng };
      setSelection(selected);
      setQuery(selected.address);
      setSource(locationSource);
      setConfirmed(false);
      setIsResolvingAddress(false);
      setLocationError('');
      publish(selected.address, selected, locationSource, false);
    } catch (error) {
      if (controller.signal.aborted || requestId !== reverseRequest.current) return;
      setSelection(null);
      setConfirmed(false);
      setIsResolvingAddress(false);
      setLocationError(error instanceof Error
        ? `We couldn't find an address for that point. ${error.message} Search for an address or choose another point.`
        : 'We couldn’t find an address for that point. Search for an address or choose another point.');
      publish('', null, locationSource, false);
    }
  };

  const handleMapChange = (coordinates: Coordinates) => {
    if (!isValidCoordinates(coordinates.lat, coordinates.lng)) return;
    clearPendingLocationRequests();
    setQuery('');
    setSelection(null);
    setMapCoordinates(coordinates);
    setSource('map');
    setConfirmed(false);
    setMapVisible(true);
    setIsLocating(false);
    publish('', null, 'map', false);
    void resolveCoordinates(coordinates, 'map');
  };

  const handleUseCurrentLocation = () => {
    clearPendingLocationRequests();
    setQuery('');
    setSelection(null);
    setMapCoordinates(undefined);
    setConfirmed(false);
    setSource('gps');
    setMapVisible(false);
    setLocationError('');
    setIsResolvingAddress(false);
    publish('', null, 'gps', false);

    if (!navigator.geolocation) {
      setIsLocating(false);
      setLocationError('This browser does not provide location access. Search for an address or select a point on the map.');
      return;
    }

    const requestId = geolocationRequest.current;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (requestId !== geolocationRequest.current) return;
      const coordinates = { lat: coords.latitude, lng: coords.longitude };
      if (!isValidCoordinates(coordinates.lat, coordinates.lng)) {
        setIsLocating(false);
        setLocationError('The device returned invalid coordinates. Search for an address or select a point on the map.');
        return;
      }
      setMapCoordinates(coordinates);
      setMapVisible(true);
      setIsLocating(false);
      void resolveCoordinates(coordinates, 'gps');
    }, error => {
      if (requestId !== geolocationRequest.current) return;
      setIsLocating(false);
      setLocationError(getGeolocationErrorMessage(error.code));
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  };

  const confirmSelection = () => {
    if (!selection || !isValidCoordinates(selection.latitude, selection.longitude) || isResolvingAddress) return;
    setConfirmed(true);
    publish(selection.address, selection, source, true);
  };

  const changeSelection = () => {
    clearPendingLocationRequests();
    setSelection(null);
    setMapCoordinates(undefined);
    setConfirmed(false);
    setSource('manual');
    setLocationError('');
    setQuery('');
    setMapVisible(false);
    publish('', null, 'manual', false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && suggestions.length > 0) {
      event.preventDefault();
      setActiveSuggestion(index => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp' && suggestions.length > 0) {
      event.preventDefault();
      setActiveSuggestion(index => (index - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === 'Enter' && activeSuggestion >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeSuggestion]);
    } else if (event.key === 'Escape') {
      setSuggestions([]);
      setActiveSuggestion(-1);
    }
  };

  const searchStatus = searchState === 'loading'
    ? 'Searching addresses…'
    : searchState === 'empty'
      ? 'No matching places found. Try a street, landmark, or Bengaluru locality.'
      : searchState === 'error'
        ? locationError
        : '';

  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-3">
        <label htmlFor="complaint-location" className="text-sm font-bold text-on-surface">
          4. Location / Street Address <span className="text-error">*</span>
        </label>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating || isResolvingAddress}
          className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-sm">my_location</span>
          <span>{isLocating ? 'Getting location…' : 'Use Current Location'}</span>
        </button>
      </div>

      <div className="relative">
        <span aria-hidden="true" className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-lg">
          location_on
        </span>
        <input
          id="complaint-location"
          type="search"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={suggestions.length > 0}
          aria-controls={suggestions.length > 0 ? 'complaint-location-suggestions' : undefined}
          aria-activedescendant={activeSuggestion >= 0 ? `complaint-location-option-${activeSuggestion}` : undefined}
          aria-describedby="complaint-location-status"
          value={query}
          onChange={event => handleQueryChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search a street, landmark, or Bengaluru locality"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-surface-container bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none text-sm transition-all"
        />
        {suggestions.length > 0 && (
          <ul
            id="complaint-location-suggestions"
            role="listbox"
            aria-label="Address suggestions"
            className="absolute z-[1000] mt-1 w-full max-h-64 overflow-auto rounded-xl border border-surface-container bg-surface-container-lowest shadow-lg"
          >
            {suggestions.map((suggestion, index) => (
              <li
                id={`complaint-location-option-${index}`}
                key={`${suggestion.latitude}:${suggestion.longitude}:${suggestion.address}`}
                role="option"
                aria-selected={index === activeSuggestion}
              >
                <button
                  type="button"
                  className={`w-full px-4 py-3 text-left text-sm text-on-surface hover:bg-surface-container ${index === activeSuggestion ? 'bg-surface-container' : ''}`}
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => selectSuggestion(suggestion)}
                >
                  {suggestion.address}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-2 text-[11px] text-on-surface-variant">
        Address search by <a className="underline" href="https://photon.komoot.io/" target="_blank" rel="noreferrer">Photon</a>;
        map data © OpenStreetMap contributors.
      </p>
      <p id="complaint-location-status" role="status" aria-live="polite" className="mt-2 text-xs text-on-surface-variant">
        {searchStatus || (isLocating
          ? 'Requesting your device location…'
          : isResolvingAddress
            ? 'Finding the address for this map point…'
            : 'Search and select an address, use current location, or select a map point. A location must be confirmed before submission.')}
      </p>
      {searchState === 'error' && (
        <button
          type="button"
          onClick={() => setRetrySearch(retry => retry + 1)}
          className="mt-1 text-xs font-semibold text-secondary hover:underline"
        >
          Retry address search
        </button>
      )}
      {locationError && <p role="alert" className="mt-2 text-sm text-error">{locationError}</p>}

      <button
        type="button"
        onClick={() => setMapVisible(visible => !visible)}
        className="mt-2 text-xs font-semibold text-secondary hover:underline"
      >
        {mapVisible ? 'Hide map' : 'Choose a point on the map'}
      </button>
      {mapVisible && (
        <div className="mt-3 overflow-hidden rounded-xl border border-surface-container">
          <LocationMapPicker value={mapCoordinates} onChange={handleMapChange} />
          <p className="p-2 text-xs text-on-surface-variant">
            Map data © OpenStreetMap contributors. This starts at a general Bengaluru map view, not your location.
            Click the map to place or move the incident pin; its address will be looked up again.
          </p>
        </div>
      )}

      {selection && (
        <div className="mt-3 rounded-xl border border-surface-container p-4">
          <p className="text-sm font-semibold text-on-surface">{selection.address}</p>
          {confirmed ? (
            <p className="mt-2 text-sm font-semibold text-green-700" role="status">Location confirmed for this complaint.</p>
          ) : (
            <p className="mt-2 text-xs text-on-surface-variant">
              Review the map pin and confirm that this is where the issue occurred.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {!confirmed && (
              <button
                type="button"
                onClick={confirmSelection}
                disabled={isResolvingAddress}
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-60"
              >
                Confirm this location
              </button>
            )}
            <button
              type="button"
              onClick={changeSelection}
              className="rounded-lg border border-surface-container px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container"
            >
              Change location
            </button>
          </div>
        </div>
      )}

      {!selection && mapCoordinates && !isLocating && !isResolvingAddress && (
        <button
          type="button"
          onClick={changeSelection}
          className="mt-2 text-xs font-semibold text-secondary hover:underline"
        >
          Search for an address instead
        </button>
      )}
    </div>
  );
};
