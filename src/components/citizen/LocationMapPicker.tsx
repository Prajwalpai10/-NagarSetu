import React from 'react';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';

interface LocationMapPickerProps {
  value?: { lat: number; lng: number };
  onChange: (coordinates: { lat: number; lng: number }) => void;
}

const BENGALURU_MAP_OVERVIEW: [number, number] = [12.9716, 77.5946];

const LocationClickHandler: React.FC<{ onChange: LocationMapPickerProps['onChange'] }> = ({ onChange }) => {
  useMapEvents({
    click: event => onChange({ lat: event.latlng.lat, lng: event.latlng.lng }),
  });
  return null;
};

const MapCenterUpdater: React.FC<{ value: LocationMapPickerProps['value'] }> = ({ value }) => {
  const map = useMap();
  React.useEffect(() => {
    if (value) map.setView([value.lat, value.lng], Math.max(map.getZoom(), 15));
  }, [map, value?.lat, value?.lng]);
  return null;
};

export const LocationMapPicker: React.FC<LocationMapPickerProps> = ({ value, onChange }) => (
  <MapContainer
    center={value ? [value.lat, value.lng] : BENGALURU_MAP_OVERVIEW}
    zoom={value ? 15 : 12}
    scrollWheelZoom={false}
    keyboard
    style={{ height: 280, width: '100%' }}
  >
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
    <MapCenterUpdater value={value} />
    <LocationClickHandler onChange={onChange} />
    {value && <CircleMarker center={[value.lat, value.lng]} radius={8} pathOptions={{ color: '#14532d', fillOpacity: 0.8 }} />}
  </MapContainer>
);
