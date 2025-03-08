import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useAppStore } from "@/utils/store";
import { useState, useEffect, useRef } from "react";
import type { MapRef } from 'react-map-gl';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface GeocodingFeature {
  id: string;
  type: string;
  place_type: string[];
  relevance: number;
  properties: {
    accuracy?: string;
    address?: string;
    category?: string;
    maki?: string;
  };
  text: string;
  place_name: string;
  center: [number, number];
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  context?: Array<{
    id: string;
    text: string;
  }>;
}

interface GeocodingResponse {
  type: string;
  query: string[];
  features: GeocodingFeature[];
  attribution: string;
}

export interface Props {
  onSearch?: (query: string) => void;
  mapRef?: React.RefObject<MapRef>;
}

export function SearchBar({ onSearch, mapRef }: Props) {
  const [focused, setFocused] = useState(false);
  const { setSelectedProperty, setIsLoadingProperty, setShouldCenterMap, setPropertyCardVisible } = useAppStore();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    if (query.length >= 2) {
      setLoading(true);
    }

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      handleSearch(query);
    }, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query]);

  const isCoordinates = (query: string): Coordinates | null => {
    const coordPattern = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
    const match = query.match(coordPattern);

    if (match) {
      const latitude = parseFloat(match[1]);
      const longitude = parseFloat(match[2]);

      if (latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
        return { latitude, longitude };
      }
    }

    return null;
  };

  const buildMapboxUrl = (base: string, params: Record<string, string>) => {
    const searchParams = new URLSearchParams({
      access_token: import.meta.env.VITE_MAPBOX_TOKEN,
      ...params
    });
    return `${base}?${searchParams.toString()}`;
  };

  const handleSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      // Handle coordinates input
      const coords = isCoordinates(query);
      let url;
      if (coords) {
        url = buildMapboxUrl(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.longitude},${coords.latitude}.json`,
          {
            types: 'address,place,locality,neighborhood',
            limit: '5',
            country: 'us',
          }
        );
      } else {
        url = buildMapboxUrl(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
          {
            types: 'address,place,locality,neighborhood',
            limit: '5',
            country: 'us',
          }
        );
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
      }

      const data: GeocodingResponse = await response.json();

      if (!data?.features?.length) {
        setSearchResults([]);
        return;
      }

      // Transform Mapbox results to match our app's format
      const transformedResults = await Promise.all(data.features.map(async (feature, index) => {
        const result = {
          zpid: `mb_${Date.now()}_${index}`,
          streetAddress: feature.place_name || feature.text,
          city: feature.context?.find(ctx => ctx.id.startsWith('place.'))?.text || '',
          state: feature.context?.find(ctx => ctx.id.startsWith('region.'))?.text || '',
          zipcode: feature.context?.find(ctx => ctx.id.startsWith('postcode.'))?.text || '',
          latitude: feature.center[1],
          longitude: feature.center[0]
        };

        // Get distance to nearest city if coordinates are available
        if (result.latitude && result.longitude) {
          try {
            const distanceResponse = await fetch('/api/distance-to-city', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                origins: `${result.latitude},${result.longitude}`,
                destination: result.city || 'nearest city'
              })
            });

            if (distanceResponse.ok) {
              const distanceData = await distanceResponse.json();
              result.distanceToCity = distanceData.distance_text;
              result.durationToCity = distanceData.duration_text;
            }
          } catch (error) {
            console.error('Error fetching distance:', error);
          }
        }

        return result;
      }));

      setSearchResults(transformedResults);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full">
      <Command className="w-full overflow-hidden rounded-lg" shouldFilter={false}>
        <CommandInput
          placeholder="Search by address"
          value={query}
          onValueChange={setQuery}
          disabled={false}
          className="h-10 bg-background/90 backdrop-blur-sm w-full text-base"
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => setFocused(false), 200);
          }}
        />
        {focused && <CommandList className="max-h-[200px] overflow-y-auto">
          <CommandEmpty>{loading ? 'Searching...' : 'No results found.'}</CommandEmpty>
          <CommandGroup>
            {loading ? (
              <CommandItem value="loading" disabled>
                Searching...
              </CommandItem>
            ) : (searchResults?.length > 0 ? searchResults : []).map((result, idx) => (
              <CommandItem
                key={idx}
                value={result.zpid.toString()}
                onSelect={() => {
                  setFocused(false);
                  setIsLoadingProperty(true);

                  const address = {
                    streetAddress: result.streetAddress,
                    city: result.city,
                    state: result.state,
                    zipcode: result.zipcode
                  };

                  setShouldCenterMap(true);
                  setSelectedProperty({
                    ...result,
                    address,
                    distanceToCity: result.distanceToCity,
                    durationToCity: result.durationToCity
                  });
                  setPropertyCardVisible(true);

                  // Query map layers for additional data if map is available
                  if (mapRef?.current) {
                    const center = mapRef.current.project([result.longitude, result.latitude]);
                    const features = mapRef.current.queryRenderedFeatures(center, {
                      layers: ['layer']
                    });
                    if (features.length > 0) {
                      const feature = features[0];
                      const properties = feature.properties || {};

                      setSelectedProperty(prev => ({
                        ...prev,
                        propertyId: properties?.Prop_ID,
                        ownerName: properties?.NAME_CARE ? `${properties.OWNER_NAME} ${properties.NAME_CARE}` : properties?.OWNER_NAME,
                        legalAreaUnits: properties?.LGL_AREA_U,
                        gisArea: properties?.GIS_AREA ? parseFloat(properties.GIS_AREA) : undefined,
                        gisAreaUnits: properties?.GIS_AREA_U,
                        landValue: properties?.LAND_VALUE ? parseInt(properties.LAND_VALUE) : undefined,
                        improvementValue: properties?.IMP_VALUE ? parseInt(properties.IMP_VALUE) : undefined,
                        marketValue: properties?.MKT_VALUE ? parseInt(properties.MKT_VALUE) : undefined,
                        dateAcquired: properties?.DATE_ACQ ? parseInt(properties.DATE_ACQ) : undefined,
                        fipsCode: properties?.FIPS,
                        county: properties?.COUNTY,
                        taxYear: properties?.TAX_YEAR ? parseInt(properties.TAX_YEAR) : undefined
                      }));
                    }
                  }
                  setIsLoadingProperty(false);
                }}
              >
                <div className="flex flex-col gap-1">
                  <div className="font-medium text-base">{result.streetAddress}</div>
                  <div className="text-base text-muted-foreground">
                    {[result.city, result.state, result.zipcode].filter(Boolean).join(', ')}
                  </div>
                  {result.distanceToCity && (
                    <div className="text-sm text-muted-foreground">
                      {result.distanceToCity} ({result.durationToCity}) to {result.city}
                    </div>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>}
      </Command>
    </div>
  );
}