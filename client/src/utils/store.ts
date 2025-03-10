import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SavedQuery, UserProfile } from './firebase';
import { Measurement, MeasurementMode, MeasurementUnits } from './store-types';
import type { PropertyDetailsResponse } from 'types';

type MapState = {
  selectedProperty: PropertyDetailsResponse | null;
  setSelectedProperty: (property: PropertyDetailsResponse | null) => void;
  isLoadingProperty: boolean;
  setIsLoadingProperty: (loading: boolean) => void;
  shouldCenterMap: boolean;
  setShouldCenterMap: (center: boolean) => void;
  measurementMode: MeasurementMode;
  setMeasurementMode: (mode: MeasurementMode) => void;
  measurementUnits: MeasurementUnits;
  setMeasurementUnits: (units: MeasurementUnits) => void;
  measurements: Measurement[];
  completedMeasurements: Measurement[];
  addCompletedMeasurement: (measurement: Measurement) => void;
  clearMeasurements: () => void;
  clearCompletedMeasurements: () => void;
  measurementPoints: number[][];
  addMeasurementPoint: (point: number[]) => void;
  currentMeasurement: number | null;
  setCurrentMeasurement: (value: number | null) => void;
  viewportCenter: [number, number];
  setViewportCenter: (center: [number, number]) => void;
  mapStyle: string;
  setMapStyle: (style: string) => void;
  propertyCardVisible: boolean;
  setPropertyCardVisible: (visible: boolean) => void;
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  savedProperties: SavedQuery[] | null;
  setSavedProperties: (properties: SavedQuery[] | null) => void;
  runningProperties: string[];
  addRunningProperty: (address: string) => void;
  removeRunningProperty: (address: string) => void;
  analysisDialogOpen: boolean;
  setAnalysisDialogOpen: (open: boolean) => void;
  propertyForAnalysis: PropertyDetailsResponse | null;
  setPropertyForAnalysis: (property: PropertyDetailsResponse | null) => void;
  activeLayers: string[];
  toggleLayer: (layerId: string) => void;
  setActiveLayers: (layers: string[]) => void;
};

export const useAppStore = create<MapState>()(
  persist(
    (set) => ({
      selectedProperty: null,
      setSelectedProperty: (property) => set({ selectedProperty: property }),
      isLoadingProperty: false,
      setIsLoadingProperty: (loading) => set({ isLoadingProperty: loading }),
      shouldCenterMap: false,
      setShouldCenterMap: (center) => set({ shouldCenterMap: center }),
      measurementMode: 'none',
      setMeasurementMode: (mode) => set({ measurementMode: mode }),
      measurementUnits: 'metric',
      setMeasurementUnits: (units) => set({ measurementUnits: units }),
      measurements: [],
      completedMeasurements: [],
      addCompletedMeasurement: (measurement) =>
        set((state) => ({
          completedMeasurements: [...state.completedMeasurements, measurement],
        })),
      clearMeasurements: () => set({ 
        measurementPoints: [],
        currentMeasurement: null
      }),
      clearCompletedMeasurements: () => set({ completedMeasurements: [] }),
      measurementPoints: [],
      addMeasurementPoint: (point) =>
        set((state) => ({
          measurementPoints: [...state.measurementPoints, point],
        })),
      currentMeasurement: null,
      setCurrentMeasurement: (value) => set({ currentMeasurement: value }),
      viewportCenter: [-96.7970, 32.7767],
      setViewportCenter: (center) => set({ viewportCenter: center }),
      mapStyle: 'mapbox://styles/mapbox/streets-v11',
      setMapStyle: (style) => set({ mapStyle: style }),
      propertyCardVisible: true,
      setPropertyCardVisible: (visible) => set({ propertyCardVisible: visible }),
      userProfile: null,
      setUserProfile: (profile) => set({ userProfile: profile }),
      savedProperties: null,
      setSavedProperties: (properties) => set({ savedProperties: properties }),
      runningProperties: [],
      addRunningProperty: (address) => 
        set((state) => ({
          runningProperties: [...state.runningProperties, address]
        })),
      removeRunningProperty: (address) =>
        set((state) => ({
          runningProperties: state.runningProperties.filter(p => p !== address)
        })),
      analysisDialogOpen: false,
      setAnalysisDialogOpen: (open) => set({ analysisDialogOpen: open }),
      propertyForAnalysis: null,
      setPropertyForAnalysis: (property) => set({ propertyForAnalysis: property }),
      activeLayers: ["parcel-boundaries"],
      toggleLayer: (layerId) =>
        set((state) => ({
          activeLayers: state.activeLayers.includes(layerId)
            ? state.activeLayers.filter((id) => id !== layerId)
            : [...state.activeLayers, layerId],
        })),
      setActiveLayers: (layers) => set({ activeLayers: layers }),
    }),
    {
      name: 'map-storage',
      partialize: (state) => ({
        mapStyle: state.mapStyle,
        viewportCenter: state.viewportCenter,
        measurementUnits: state.measurementUnits,
        activeLayers: state.activeLayers,
      }),
    }
  )
);
