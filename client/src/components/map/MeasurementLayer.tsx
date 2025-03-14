import { Layer, Source } from "react-map-gl";
import { useAppStore } from "@/utils/store";
import * as turf from "@turf/turf";
import { useEffect, useState } from "react";

// No props needed anymore as we use store

export function MeasurementLayer() {
  const {
    measurementMode,
    measurementPoints,
    setCurrentMeasurement,
    addMeasurementPoint,
    viewportCenter,
    completedMeasurements
  } = useAppStore();

  // Generate GeoJSON for visualization including both active and completed measurements
  const getGeoJSON = () => {
    // Check if we have any measurements to show at all
    const hasActivePoints = measurementPoints && Array.isArray(measurementPoints) && measurementPoints.length > 0;
    const hasCompletedMeasurements = completedMeasurements && completedMeasurements.length > 0;

    if (!hasActivePoints && !hasCompletedMeasurements && measurementMode === 'none') return null;

    // Create point features for all active measurement points
    const pointFeatures = hasActivePoints ? measurementPoints.map((point) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: point,
      },
      properties: {},
    })) : [];

    // Features for the active measurement
    let mainFeature;
    if (measurementMode === "distance") {
      const coordinates = [...measurementPoints];
      coordinates.push(viewportCenter);

      mainFeature = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates,
        },
        properties: {},
      };
    } else if (measurementMode === "area") {
      const coordinates = [...measurementPoints];
      if (coordinates.length > 0) {
        coordinates.push(viewportCenter);
      }

      // If we have less than 3 points, show a LineString
      if (coordinates.length < 3) {
        mainFeature = {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates,
          },
          properties: {},
        };
      } else {
        // If we have 3 or more points, show a Polygon
        const polygonCoordinates = [...coordinates];
        polygonCoordinates.push(polygonCoordinates[0]); // Close the polygon

        mainFeature = {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [polygonCoordinates],
          },
          properties: {},
        };
      }
    }

    // Create features for completed measurements
    const completedFeatures: any[] = [];

    if (hasCompletedMeasurements) {
      completedMeasurements.forEach(measurement => {
        if (measurement.type === 'distance' && measurement.coordinates.length >= 2) {
          // Line for distance measurement
          completedFeatures.push({
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: measurement.coordinates,
            },
            properties: { completed: true },
          });

          // Points for the distance measurement
          measurement.coordinates.forEach(point => {
            completedFeatures.push({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: point,
              },
              properties: { completed: true },
            });
          });
        } else if (measurement.type === 'area' && measurement.coordinates.length >= 3) {
          // Close the polygon if needed
          const polygonCoordinates = [...measurement.coordinates];
          if (polygonCoordinates[0][0] !== polygonCoordinates[polygonCoordinates.length-1][0] || 
              polygonCoordinates[0][1] !== polygonCoordinates[polygonCoordinates.length-1][1]) {
            polygonCoordinates.push(polygonCoordinates[0]);
          }

          // Polygon for area measurement
          completedFeatures.push({
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [polygonCoordinates],
            },
            properties: { completed: true },
          });

          // Points for the area measurement
          measurement.coordinates.forEach(point => {
            completedFeatures.push({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: point,
              },
              properties: { completed: true },
            });
          });
        }
      });
    }

    // Combine all features
    const allFeatures = [...pointFeatures];
    if (mainFeature) allFeatures.push(mainFeature);
    if (completedFeatures.length > 0) allFeatures.push(...completedFeatures);

    return {
      type: "FeatureCollection",
      features: allFeatures,
    };
  };

  // Calculate measurement
  useEffect(() => {
    // Only calculate if we have active measurement points and are in a measurement mode
    if (measurementMode === 'none' || !measurementPoints || measurementPoints.length === 0) {
      setCurrentMeasurement(null);
      return;
    }

    let measurement: number | null = null;

    // Create a feature for calculation only based on current active points
    if (measurementMode === "distance" && measurementPoints.length >= 1) {
      // For distance, create a LineString with current points plus viewport center
      const coordinates = [...measurementPoints, viewportCenter];
      const lineFeature = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates
        }
      };
      measurement = turf.length(lineFeature as any, { units: "miles" });
    } else if (measurementMode === "area" && measurementPoints.length >= 3) {
      // For area, create a Polygon with current points plus viewport center, closed
      const coordinates = [...measurementPoints, viewportCenter, measurementPoints[0]];
      const polygonFeature = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [coordinates]
        }
      };
      measurement = turf.area(polygonFeature as any) * 0.000247105; // Convert to acres
    }

    setCurrentMeasurement(measurement);
  }, [measurementPoints, viewportCenter, measurementMode]);


  const geojson = getGeoJSON();
  if (!geojson) return null;

  return (
    <Source id="measurement" type="geojson" data={geojson}>
      {/* Active measurement lines/fills */}
      <Layer
        id="measurement-fill-active"
        type={measurementMode === "distance" || (measurementMode === "area" && (!measurementPoints || measurementPoints.length < 3)) ? "line" : "fill"}
        paint={{
          ...(measurementMode === "distance" || (measurementMode === "area" && (!measurementPoints || measurementPoints.length < 3))
            ? {
                "line-color": "#ff0000",
                "line-width": 2,
              }
            : {
                "fill-color": "#ff0000",
                "fill-opacity": 0.2,
              }),
        }}
        filter={["!has", "completed"]}
      />

      {/* Completed measurement lines - for distance measurements */}
      <Layer
        id="measurement-line-completed"
        type="line"
        source="measurement"
        paint={{
          "line-color": "#3b82f6", // Blue for completed measurements
          "line-width": 2,
          "line-dasharray": [1, 1], // Dashed line for completed
        }}
        filter={["all", 
          ["==", "$type", "LineString"],
          ["has", "completed"]
        ]}
      />

      {/* Completed measurement fills - for area measurements */}
      <Layer
        id="measurement-fill-completed"
        type="fill"
        source="measurement"
        paint={{
          "fill-color": "#3b82f6", // Blue for completed
          "fill-opacity": 0.15,
        }}
        filter={["all", 
          ["==", "$type", "Polygon"],
          ["has", "completed"]
        ]}
      />

      {/* Completed measurement outlines - for polygons */}
      <Layer
        id="measurement-outline-completed"
        type="line"
        source="measurement"
        paint={{
          "line-color": "#3b82f6", 
          "line-width": 1.5,
          "line-dasharray": [1, 1], // Dashed line for completed
        }}
        filter={["all", 
          ["==", "$type", "Polygon"],
          ["has", "completed"]
        ]}
      />

      {/* Active points */}
      <Layer
        id="measurement-points-active"
        type="circle"
        source="measurement"
        paint={{
          "circle-radius": 6,
          "circle-color": "#10b981", // Match primary green color
          "circle-stroke-width": 2,
          "circle-stroke-color": "#FFFFFF",
          "circle-opacity": 0.9,
        }}
        // Only show active Point features
        filter={["all", 
          ["==", "$type", "Point"],
          ["!has", "completed"]
        ]}
      />

      {/* Completed points - show in a different color */}
      <Layer
        id="measurement-points-completed"
        type="circle"
        source="measurement"
        paint={{
          "circle-radius": 4,
          "circle-color": "#3b82f6", // Blue for completed points
          "circle-stroke-width": 1,
          "circle-stroke-color": "#FFFFFF",
          "circle-opacity": 0.8,
        }}
        // Only show completed Point features
        filter={["all", 
          ["==", "$type", "Point"],
          ["has", "completed"]
        ]}
      />
    </Source>
  );
}