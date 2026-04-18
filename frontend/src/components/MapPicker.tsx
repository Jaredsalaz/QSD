import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leafet default icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerProps {
  onLocationSelect: (lat: string, lng: string) => void;
  initialLat?: string;
  initialLng?: string;
}

const LocationMarker = ({ onLocationSelect, initialLat, initialLng }: MapPickerProps) => {
  const [position, setPosition] = useState<L.LatLng | null>(() => {
     if (initialLat && initialLng) {
        return new L.LatLng(parseFloat(initialLat), parseFloat(initialLng));
     }
     return null;
  });
  
  const map = useMap();

  useEffect(() => {
     if (initialLat && initialLng && !position) {
         const latLng = new L.LatLng(parseFloat(initialLat), parseFloat(initialLng));
         setPosition(latLng);
         map.flyTo(latLng, 14);
     }
  }, [initialLat, initialLng, map, position]);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat.toString(), e.latlng.lng.toString());
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
};

const MapPicker: React.FC<MapPickerProps> = ({ onLocationSelect, initialLat, initialLng }) => {
  const centerLat = initialLat ? parseFloat(initialLat) : 16.7569;
  const centerLng = initialLng ? parseFloat(initialLng) : -93.1292;

  // Key to force re-render map when initial coordinates change significantly
  const mapKey = `${initialLat}-${initialLng}`;

  return (
    <div style={{ height: '300px', width: '100%', marginBottom: '1.5rem', borderRadius: '12px', overflow: 'hidden' }}>
      <p style={{marginBottom: '0.5rem', color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 600}}>
        Selecciona tu ubicación en el mapa:
      </p>
      <div style={{ height: '100%' }}>
        <MapContainer key={mapKey} center={[centerLat, centerLng]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker onLocationSelect={onLocationSelect} initialLat={initialLat} initialLng={initialLng} />
        </MapContainer>
      </div>
    </div>
  );
};

export default MapPicker;
