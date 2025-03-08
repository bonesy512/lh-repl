import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SavedQuery, UserProfile } from './firebase';
import { Measurement, MeasurementMode, MeasurementUnits } from './store-types';

type MapState = {
  selectedProperty: any | null;
  setSelectedProperty: (property: any | null) => void;
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
};

export const useAppStore = create<MapState>()(
  persist(
    (set) => ({
      // Property selection
      selectedProperty: null,
      setSelectedProperty: (property) => set({ selectedProperty: property }),

      // Loading states
      isLoadingProperty: false,
      setIsLoadingProperty: (loading) => set({ isLoadingProperty: loading }),

      // Map centering
      shouldCenterMap: false,
      setShouldCenterMap: (center) => set({ shouldCenterMap: center }),

      // Measurement mode
      measurementMode: 'none',
      setMeasurementMode: (mode) => set({ measurementMode: mode }),

      // Measurement units
      measurementUnits: 'metric',
      setMeasurementUnits: (units) => set({ measurementUnits: units }),

      // Measurements
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

      // Measurement points
      measurementPoints: [],
      addMeasurementPoint: (point) =>
        set((state) => ({
          measurementPoints: [...state.measurementPoints, point],
        })),

      // Current measurement
      currentMeasurement: null,
      setCurrentMeasurement: (value) => set({ currentMeasurement: value }),

      // Viewport
      viewportCenter: [-96.7970, 32.7767], // Default to Dallas, TX
      setViewportCenter: (center) => set({ viewportCenter: center }),

      // Map style
      mapStyle: 'streets-v11',
      setMapStyle: (style) => set({ mapStyle: style }),

      // Property card visibility
      propertyCardVisible: true,
      setPropertyCardVisible: (visible) => set({ propertyCardVisible: visible }),

      // User profile
      userProfile: null,
      setUserProfile: (profile) => set({ userProfile: profile }),

      // Saved properties
      savedProperties: null,
      setSavedProperties: (properties) => set({ savedProperties: properties }),

      // Running properties for analysis
      runningProperties: [],
      addRunningProperty: (address) => 
        set((state) => ({
          runningProperties: [...state.runningProperties, address]
        })),
      removeRunningProperty: (address) =>
        set((state) => ({
          runningProperties: state.runningProperties.filter(p => p !== address)
        })),
    }),
    {
      name: 'map-storage',
      partialize: (state) => ({
        mapStyle: state.mapStyle,
        viewportCenter: state.viewportCenter,
        measurementUnits: state.measurementUnits,
      }),
    }
  )
);