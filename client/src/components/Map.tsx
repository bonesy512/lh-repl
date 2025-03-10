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
import { GeolocateControl, NavigationControl, Source, Layer } from "react-map-gl";

interface PropertyMapProps {
  parcels?: Parcel[];
  onParcelSelect?: (parcel: Parcel) => void;
  loading?: boolean;
  onViewMore?: () => void;
}

interface MapSourceLayer {
  id: string;
  type: "fill" | "line" | "symbol" | "circle" | "heatmap";
  paint: any;
  layout?: any;
  filter?: any[];
}

const LAYER_STYLES: Record<string, MapSourceLayer[]> = {
  "parcel-boundaries": [
    {
      id: "parcel-lines",
      type: "line",
      paint: {
        "line-color": "#4A90E2",
        "line-width": 2,
        "line-opacity": 0.8
      }
    }
  ],
  "building-footprints": [
    {
      id: "building-fills",
      type: "fill",
      paint: {
        "fill-color": "#FF9800",
        "fill-opacity": 0.2
      }
    },
    {
      id: "building-lines",
      type: "line",
      paint: {
        "line-color": "#FF9800",
        "line-width": 1
      }
    }
  ],
  "zoning": [
    {
      id: "zoning-fills",
      type: "fill",
      paint: {
        "fill-color": [
          "match",
          ["get", "zone_type"],
          "residential", "#A5D6A7",
          "commercial", "#90CAF9",
          "industrial", "#FFCC80",
          "agricultural", "#C5E1A5",
          "#E0E0E0" // default color
        ],
        "fill-opacity": 0.3
      }
    }
  ]
};

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
    setIsLoadingProperty,
    activeLayers
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

  const renderMapLayers = () => {
    return activeLayers.map(layerId => {
      if (LAYER_STYLES[layerId]) {
        return (
          <Source
            key={layerId}
            id={`source-${layerId}`}
            type="geojson"
            data={`/api/geojson/${layerId}`}
          >
            {LAYER_STYLES[layerId].map(layer => (
              <Layer key={layer.id} {...layer} />
            ))}
          </Source>
        );
      }
      return null;
    });
  };

  return (
    <div className="w-full h-[600px] relative">
      {/* Search Bar - Updated with better mobile responsiveness */}
      <div className="absolute top-0 left-0 right-0 p-4 md:top-4 md:left-4 md:right-auto md:p-0 z-[3] md:w-[400px]">
        <SearchBar mapRef={mapRef} />
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-[175px] left-2.5 z-[1] flex flex-col gap-2">
        <LayerControl />
        <NavigationControl />
        <GeolocateControl
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation
          showUserLocation
          showAccuracyCircle
        />
        <MeasurementControls />
      </div>

      {measurementMode !== 'none' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl pl-8 z-[2]">
          <MeasurementCard />
        </div>
      )}

      {/* Property Card - Updated to match search bar responsive styling */}
      {propertyCardVisible && selectedProperty && (
        <div className="absolute top-0 right-0 left-0 p-4 md:top-4 md:right-4 md:left-auto md:p-0 z-[3] md:w-[400px]">
          <PropertyCard parcel={selectedParcel} onViewMore={onViewMore} />
        </div>
      )}

      <ReactMapGL
        ref={mapRef}
        {...viewport}
        onMove={evt => setViewport(evt.viewState)}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        style={{ width: '100%', height: '100%' }}
        onClick={(evt) => {
          if (measurementMode !== 'none') {
            addMeasurementPoint([evt.lngLat.lng, evt.lngLat.lat]);
          }
        }}
      >
        {renderMapLayers()}
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