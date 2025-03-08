import { Source, Layer } from "react-map-gl";
import { useAppStore } from "@/utils/store";

export function MeasurementLayer() {
  const measurements = useAppStore(state => state.measurements);
  
  if (measurements.length === 0) return null;

  const features = measurements.map(m => ({
    type: 'Feature',
    geometry: {
      type: m.type === 'distance' ? 'LineString' : 'Polygon',
      coordinates: m.type === 'distance' ? m.coordinates : [m.coordinates]
    },
    properties: {
      value: m.value
    }
  }));

  return (
    <Source
      id="measurements"
      type="geojson"
      data={{
        type: 'FeatureCollection',
        features
      }}
    >
      <Layer
        id="measurement-lines"
        type="line"
        paint={{
          'line-color': '#0066FF',
          'line-width': 2
        }}
      />
      <Layer
        id="measurement-points"
        type="circle"
        paint={{
          'circle-radius': 5,
          'circle-color': '#0066FF'
        }}
      />
    </Source>
  );
}
