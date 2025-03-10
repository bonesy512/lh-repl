import { useEffect, useRef, useState } from 'react';
import type { MapRef } from 'react-map-gl';
import ReactMapGL, { NavigationControl, GeolocateControl, Marker, Popup } from 'react-map-gl';
import { SearchBar } from "./SearchBar";
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Parcel } from '@shared/schema';
import { useAppStore } from "@/utils/store";

interface PropertyMapProps {
  parcels?: Parcel[];
  onParcelSelect?: (parcel: Parcel) => void;
  loading?: boolean;
  onViewMore?: () => void;
}

export default function PropertyMap({
  parcels = [],
  onParcelSelect,
  loading = false,
  onViewMore
}: PropertyMapProps) {
  console.log("PropertyMap received parcels:", parcels); // Debug log

  // Center on Texas by default
  const [viewport, setViewport] = useState({
    latitude: 31.9686,
    longitude: -99.9018,
    zoom: 5
  });

  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const mapRef = useRef<MapRef>(null);

  const {
    setViewportCenter,
    propertyCardVisible,
    selectedProperty,
    setPropertyCardVisible,
    setSelectedProperty,
    shouldCenterMap,
    setShouldCenterMap,
  } = useAppStore();

  // Center map when requested (e.g. after search)
  useEffect(() => {
    if (shouldCenterMap && selectedProperty) {
      setViewport({
        latitude: selectedProperty.latitude,
        longitude: selectedProperty.longitude,
        zoom: 14
      });
      setShouldCenterMap(false);
    }
  }, [shouldCenterMap, selectedProperty]);

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
      {/* Search Bar */}
      <div className="absolute top-4 left-4 z-[3] w-[400px] max-w-[calc(100vw-2rem)]">
        <SearchBar mapRef={mapRef} />
      </div>

      <ReactMapGL
        ref={mapRef}
        {...viewport}
        onMove={evt => {
          setViewport(evt.viewState);
          setViewportCenter([evt.viewState.longitude, evt.viewState.latitude]);
        }}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Map Controls */}
        <NavigationControl position="bottom-left" />
        <GeolocateControl
          position="bottom-left"
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={true}
        />

        {/* Property Markers */}
        {parcels.map((parcel) => {
          const lat = Number(parcel.latitude);
          const lng = Number(parcel.longitude);
          console.log(`Rendering marker for parcel ${parcel.id} at ${lat}, ${lng}`); // Debug log

          if (isNaN(lat) || isNaN(lng)) {
            console.warn(`Invalid coordinates for parcel ${parcel.id}`);
            return null;
          }

          return (
            <Marker
              key={parcel.id}
              latitude={lat}
              longitude={lng}
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedParcel(parcel);
                setSelectedProperty({
                  propertyId: parcel.id,
                  address: parcel.address,
                  latitude: lat,
                  longitude: lng
                });
                setPropertyCardVisible(true);
                if (onParcelSelect) {
                  onParcelSelect(parcel);
                }
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
          );
        })}

        {/* Selected Property Popup */}
        {selectedParcel && (
          <Popup
            latitude={Number(selectedParcel.latitude)}
            longitude={Number(selectedParcel.longitude)}
            onClose={() => setSelectedParcel(null)}
            closeButton={true}
          >
            <div className="p-2">
              <h3 className="font-semibold">{
                typeof selectedParcel.address === 'string' 
                  ? JSON.parse(selectedParcel.address).street 
                  : selectedParcel.address.street
              }</h3>
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