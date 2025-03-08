import { useEffect, useRef, useState } from 'react';
import type { MapRef } from 'react-map-gl';
import ReactMapGL, { NavigationControl, GeolocateControl, Marker, Source, Layer, Popup } from 'react-map-gl';
import { MeasurementLayer } from "./map/MeasurementLayer";
import { MeasurementControls } from "./map/MeasurementControls";
import { MeasurementCard } from "./map/MeasurementCard";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Parcel } from '@shared/schema';
import { useAppStore } from "@/utils/store";

interface PropertyMapProps {
  parcels?: Parcel[];
  onParcelSelect?: (parcel: Parcel) => void;
  loading?: boolean;
}

// Custom control for MapboxDraw
interface DrawControlProps {
  displayControlsDefault: boolean;
  controls: {
    point: boolean;
    line_string: boolean;
    polygon: boolean;
    trash: boolean;
  };
  defaultMode?: string;
  onCreate?: (e: { features: any[] }) => void;
  onUpdate?: (e: { features: any[] }) => void;
  onDelete?: () => void;
  drawRef: React.MutableRefObject<MapboxDraw | undefined>;
}

function DrawControl(props: DrawControlProps) {
  useEffect(() => {
    if (!props.drawRef.current) {
      props.drawRef.current = new MapboxDraw({
        displayControlsDefault: props.displayControlsDefault,
        controls: props.controls,
        defaultMode: props.defaultMode
      });
    }
  }, []);

  return null;
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
  const drawRef = useRef<MapboxDraw>();

  const {
    measurementMode,
    setMeasurementMode,
    addCompletedMeasurement,
    clearMeasurements,
    setViewportCenter,
    addMeasurementPoint, // Assuming this function exists
    fetchPropertyDetails // Assuming this function exists
  } = useAppStore();

  // Get user's location on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setViewport(prev => ({
            ...prev,
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
            zoom: 14
          }));
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
        }
      );
    }
  }, []);

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
      {/* Measurement Controls */}
      <div className="absolute bottom-[175px] left-2.5 z-[1]">
        <MeasurementControls />
      </div>

      {measurementMode !== 'none' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl pl-8 z-[2]">
          <MeasurementCard />
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
        {parcels.map((parcel) => (
          <Marker
            key={parcel.id}
            latitude={Number(parcel.latitude)}
            longitude={Number(parcel.longitude)}
            onClick={evt => {
              if (measurementMode !== 'none') {
                addMeasurementPoint([evt.lngLat.lng, evt.lngLat.lat]);
              } else {
                if (mapRef.current) {
                  const features = mapRef.current.queryRenderedFeatures(evt.point, {
                    layers: ['layer'] // Assumes a layer named 'layer' exists
                  });
                  if (features.length > 0) {
                    const feature = features[0];
                    fetchPropertyDetails(evt.lngLat.lat, evt.lngLat.lng, feature, true);
                  }
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
        ))}

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

        {/* Draw Control for Measurements */}
        <DrawControl
          displayControlsDefault={false}
          controls={{
            point: false,
            line_string: true,
            polygon: true,
            trash: true
          }}
          defaultMode={measurementMode === 'distance' ? 'draw_line_string' : 'draw_polygon'}
          onCreate={e => {
            const feature = e.features[0];
            if (feature) {
              addCompletedMeasurement({
                id: feature.id,
                type: feature.geometry.type === 'LineString' ? 'distance' : 'area',
                coordinates: feature.geometry.coordinates
              });
            }
          }}
          onDelete={clearMeasurements}
          drawRef={drawRef}
        />
      </ReactMapGL>
    </div>
  );
}