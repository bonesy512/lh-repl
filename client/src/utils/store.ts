import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Measurement = {
  id: string;
  type: 'distance' | 'area';
  value?: number;
  coordinates: number[][];
};

type MapState = {
  selectedProperty: any | null;
  setSelectedProperty: (property: any | null) => void;
  isLoadingProperty: boolean;
  setIsLoadingProperty: (loading: boolean) => void;
  isStyleLoading: boolean;
  setIsStyleLoading: (loading: boolean) => void;
  shouldCenterMap: boolean;
  setShouldCenterMap: (center: boolean) => void;
  measurementMode: 'none' | 'distance' | 'area';
  setMeasurementMode: (mode: 'none' | 'distance' | 'area') => void;
  measurements: Measurement[];
  addCompletedMeasurement: (measurement: Measurement) => void;
  clearMeasurements: () => void;
  viewportCenter: [number, number];
  setViewportCenter: (center: [number, number]) => void;
  mapStyle: string;
  setMapStyle: (style: string) => void;
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
      isStyleLoading: true,
      setIsStyleLoading: (loading) => set({ isStyleLoading: loading }),
      
      // Map centering
      shouldCenterMap: false,
      setShouldCenterMap: (center) => set({ shouldCenterMap: center }),
      
      // Measurement mode
      measurementMode: 'none',
      setMeasurementMode: (mode) => set({ measurementMode: mode }),
      
      // Measurements
      measurements: [],
      addCompletedMeasurement: (measurement) =>
        set((state) => ({
          measurements: [...state.measurements, measurement],
        })),
      clearMeasurements: () => set({ measurements: [] }),
      
      // Viewport
      viewportCenter: [-96.7970, 32.7767], // Default to Dallas, TX
      setViewportCenter: (center) => set({ viewportCenter: center }),
      
      // Map style
      mapStyle: 'streets-v11',
      setMapStyle: (style) => set({ mapStyle: style }),
    }),
    {
      name: 'map-storage',
      partialize: (state) => ({
        mapStyle: state.mapStyle,
        viewportCenter: state.viewportCenter,
      }),
    }
  )
);
