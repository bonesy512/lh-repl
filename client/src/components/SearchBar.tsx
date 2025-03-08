import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useAppStore } from "@/utils/store";
import { useState, useEffect, useRef } from "react";
import type { MapRef } from 'react-map-gl';
import { Loader2 } from 'lucide-react';

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
  const { 
    setSelectedProperty, 
    setIsLoadingProperty, 
    setShouldCenterMap, 
    setPropertyCardVisible 
  } = useAppStore();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
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

      // Process results and get distances
      const transformedResults = await Promise.all(data.features.map(async (feature, index) => {
        const cityContext = feature.context?.find(ctx => ctx.id.startsWith('place.'));
        const stateContext = feature.context?.find(ctx => ctx.id.startsWith('region.'));
        const zipcodeContext = feature.context?.find(ctx => ctx.id.startsWith('postcode.'));

        const result = {
          propertyId: `mb_${Date.now()}_${index}`,
          address: {
            streetAddress: feature.place_name || feature.text,
            city: cityContext?.text || '',
            state: stateContext?.text || '',
            zipcode: zipcodeContext?.text || ''
          },
          latitude: feature.center[1],
          longitude: feature.center[0]
        };

        try {
          const distanceResponse = await fetch('/api/distance-to-city', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              origins: `${result.latitude},${result.longitude}`,
              destination: result.address.city || 'nearest city'
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
          disabled={loading}
          className="h-10 bg-background/90 backdrop-blur-sm w-full text-base"
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => setFocused(false), 200);
          }}
        />
        {focused && (
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </div>
              ) : 'No results found.'}
            </CommandEmpty>
            <CommandGroup>
              {searchResults.map((result, idx) => (
                <CommandItem
                  key={result.propertyId}
                  value={result.propertyId.toString()}
                  onSelect={() => {
                    setFocused(false);
                    setIsLoadingProperty(true);
                    setShouldCenterMap(true);
                    setSelectedProperty(result);
                    setPropertyCardVisible(true);
                    setIsLoadingProperty(false);
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <div className="font-medium text-base">
                      {result.address.streetAddress}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {[result.address.city, result.address.state, result.address.zipcode]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                    {result.distanceToCity && (
                      <div className="text-sm text-muted-foreground">
                        {result.distanceToCity} ({result.durationToCity}) to {result.address.city}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        )}
      </Command>
    </div>
  );
}