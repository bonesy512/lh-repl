import { useEffect, useRef, useState } from 'react';
import type { MapRef } from 'react-map-gl';
import ReactMapGL, { Marker, Popup } from 'react-map-gl';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Parcel } from '@shared/schema';

interface PropertyMapProps {
  parcels?: Parcel[];
  onParcelSelect?: (parcel: Parcel) => void;
  loading?: boolean;
}

export default function PropertyMap({ 
  parcels = [], 
  onParcelSelect,
  loading = false
}: PropertyMapProps) {
  const [viewport, setViewport] = useState({
    latitude: 39.8283,
    longitude: -98.5795,
    zoom: 3
  });

  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const mapRef = useRef<MapRef>(null);

  if (!import.meta.env.VITE_MAPBOX_TOKEN) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-muted">
        <p>Mapbox token not configured</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] relative">
      <ReactMapGL
        ref={mapRef}
        {...viewport}
        onMove={evt => setViewport(evt.viewState)}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        style={{width: '100%', height: '100%'}}
      >
        {parcels.map((parcel) => (
          <Marker
            key={parcel.id}
            latitude={Number(parcel.latitude)}
            longitude={Number(parcel.longitude)}
            onClick={e => {
              e.originalEvent.stopPropagation();
              setSelectedParcel(parcel);
            }}
          >
            <div className="text-primary cursor-pointer">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          </Marker>
        ))}

        {selectedParcel && (
          <Popup
            latitude={Number(selectedParcel.latitude)}
            longitude={Number(selectedParcel.longitude)}
            onClose={() => setSelectedParcel(null)}
            closeButton={true}
          >
            <div className="p-2">
              <h3 className="font-semibold">{selectedParcel.address}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedParcel.acres} acres
              </p>
              {selectedParcel.price && (
                <p className="text-sm font-medium">
                  ${selectedParcel.price.toLocaleString()}
                </p>
              )}
              <Button
                className="mt-2 w-full"
                onClick={() => {
                  onParcelSelect?.(selectedParcel);
                  setSelectedParcel(null);
                }}
              >
                View Details
              </Button>
            </div>
          </Popup>
        )}
      </ReactMapGL>
    </div>
  );
}