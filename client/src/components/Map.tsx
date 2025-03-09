import { useEffect, useRef, useState } from 'react';
import type { MapRef } from 'react-map-gl';
import ReactMapGL, { NavigationControl, GeolocateControl, Marker, Source, Layer, Popup } from 'react-map-gl';
import { MeasurementLayer } from "./map/MeasurementLayer";
import { MeasurementControls } from "./map/MeasurementControls";
import { MeasurementCard } from "./map/MeasurementCard";
import { PropertyCard } from "./PropertyCard";
import { SearchBar } from "./SearchBar";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Parcel } from '@shared/schema';
import { useAppStore } from "@/utils/store";
import { LayerControl } from "./map/LayerControl";

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
  const [viewport, setViewport] = useState({
    latitude: 39.8283,
    longitude: -98.5795,
    zoom: 3
  });

  console.log("PropertyMap render:", { 
    parcelCount: parcels?.length || 0,
    loading,
    viewPort: viewport 
  });

  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const mapRef = useRef<MapRef>(null);

  const {
    measurementMode,
    setMeasurementMode,
    addCompletedMeasurement,
    clearMeasurements,
    setViewportCenter,
    addMeasurementPoint,
    propertyCardVisible,
    selectedProperty,
    setPropertyCardVisible,
    setSelectedProperty,
    shouldCenterMap,
    setShouldCenterMap,
    setIsLoadingProperty
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

  // Safeguard against no parcels array
  if (!Array.isArray(parcels)) {
    console.error("Invalid parcels data:", parcels);
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-muted">
        <p>No parcel data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] relative">
      {/* Search Bar */}
      <div className="absolute top-4 left-0 right-0 mx-4 md:left-4 md:right-auto md:mx-0 z-[3] md:w-[400px]">
        <SearchBar mapRef={mapRef} />
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-[175px] left-2.5 z-[1] flex flex-col gap-2">
        <LayerControl />
        <MeasurementControls />
      </div>

      {measurementMode !== 'none' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl pl-8 z-[2]">
          <MeasurementCard />
        </div>
      )}

      {/* Property Card */}
      {propertyCardVisible && selectedProperty && (
        <div className="absolute top-4 right-0 left-0 mx-4 md:right-4 md:left-auto md:mx-0 z-[3] md:w-[400px]">
          <PropertyCard parcel={selectedParcel} onViewMore={onViewMore} />
        </div>
      )}

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
        onClick={(evt) => {
          if (measurementMode !== 'none') {
            addMeasurementPoint([evt.lngLat.lng, evt.lngLat.lat]);
          }
        }}
      >
        {/* Measurement Layer */}
        <MeasurementLayer />

        {/* Map Controls */}
        <NavigationControl position="bottom-left" />
        <GeolocateControl
          position="bottom-left"
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={true}
        />

        {/* Property Markers */}
        {parcels.map((parcel) => {
          // Add type checking for required parcel properties
          if (!parcel?.latitude || !parcel?.longitude) {
            console.error("Invalid parcel data:", parcel);
            return null;
          }

          return (
            <Marker
              key={parcel.id}
              latitude={Number(parcel.latitude)}
              longitude={Number(parcel.longitude)}
              onClick={(evt) => {
                evt.preventDefault(); // Prevent event bubbling
                if (measurementMode !== 'none') {
                  if (evt.lngLat) {
                    addMeasurementPoint([evt.lngLat.lng, evt.lngLat.lat]);
                  }
                } else {
                  setSelectedParcel(parcel);
                  setSelectedProperty({
                    propertyId: parcel.id,
                    address: {
                      streetAddress: parcel.address,
                      city: parcel.city || '',
                      state: parcel.state || '',
                      zipcode: parcel.zipcode || ''
                    },
                    ownerName: parcel.ownerName || '',
                    latitude: Number(parcel.latitude),
                    longitude: Number(parcel.longitude)
                  });
                  setPropertyCardVisible(true);
                  if (onParcelSelect) {
                    onParcelSelect(parcel);
                  }
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