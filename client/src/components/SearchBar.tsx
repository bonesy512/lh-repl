import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useAppStore } from "@/utils/store";
import { useState, useEffect, useRef } from "react";
import type { MapRef } from 'react-map-gl';
import { Loader2 } from 'lucide-react';

// Define comprehensive property details interface
interface PropertyDetailsResponse {
  id: string;
  propertyId: string;
  address: {
    streetAddress: string;
    city: string;
    state: string;
    zipcode: string;
  };
  owner?: {
    name: string;
    mailingAddress: string;
  };
  parcelInfo?: {
    acreage: number;
    squareFootage: number;
    schoolDistrict: string;
    salePrice?: number;
    saleDate?: string;
    zoning?: string;
  };
  latitude: number;
  longitude: number;
  distanceToCity?: string;
  timeToCity?: string;
  zpid?: number;
  isSaved?: boolean;
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
  const [searchResults, setSearchResults] = useState<PropertyDetailsResponse[]>([]);
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
    }, 300); // Reduced debounce time for better responsiveness

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query]);

  // Check if input is coordinates
  const isCoordinates = (input: string): { lat: number; lng: number } | null => {
    const coordRegex = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
    const match = input.match(coordRegex);

    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
    return null;
  };

  const buildMapboxUrl = (query: string) => {
    const coords = isCoordinates(query);
    const params = new URLSearchParams({
      access_token: import.meta.env.VITE_MAPBOX_TOKEN,
      types: 'address,place,locality,neighborhood',
      limit: '5',
      country: 'us',
    });

    if (coords) {
      return `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?${params.toString()}`;
    }
    return `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`;
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const url = buildMapboxUrl(searchQuery);
      console.log("Fetching search results...");

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch search results: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Search response:", data);

      if (!data?.features?.length) {
        setSearchResults([]);
        return;
      }

      const results = await Promise.all(data.features.map(async (feature: any) => {
        try {
          const cityContext = feature.context?.find((ctx: any) => ctx.id.startsWith('place.'));
          const stateContext = feature.context?.find((ctx: any) => ctx.id.startsWith('region.'));
          const zipcodeContext = feature.context?.find((ctx: any) => ctx.id.startsWith('postcode.'));

          const propertyResult: PropertyDetailsResponse = {
            id: `mb_${Date.now()}_${Math.random()}`,
            propertyId: feature.id,
            address: {
              streetAddress: feature.place_name,
              city: cityContext?.text || '',
              state: stateContext?.text || '',
              zipcode: zipcodeContext?.text || ''
            },
            latitude: feature.center[1],
            longitude: feature.center[0],
            zpid: 0,
            isSaved: false
          };

          // Fetch additional property details
          try {
            const propertyResponse = await fetch(`/api/property-details`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                latitude: propertyResult.latitude,
                longitude: propertyResult.longitude,
                address: propertyResult.address
              })
            });

            if (propertyResponse.ok) {
              const propertyData = await propertyResponse.json();
              Object.assign(propertyResult, propertyData);
            }
          } catch (error) {
            console.error('Failed to fetch property details:', error);
          }

          // Add distance to city information
          try {
            const distanceResponse = await fetch(`/api/distance-to-city`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                origins: `${propertyResult.latitude},${propertyResult.longitude}`,
                destination: propertyResult.address.city || 'nearest city'
              })
            });

            if (distanceResponse.ok) {
              const distanceData = await distanceResponse.json();
              propertyResult.distanceToCity = distanceData.distance_text;
              propertyResult.timeToCity = distanceData.duration_text;
            }
          } catch (error) {
            console.error('Failed to fetch distance:', error);
          }

          return propertyResult;
        } catch (error) {
          console.error('Error processing search result:', error);
          return null;
        }
      }));

      const validResults = results.filter((result): result is PropertyDetailsResponse => result !== null);
      console.log("Transformed results:", validResults);
      setSearchResults(validResults);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full">
      <Command className="w-full overflow-visible rounded-lg border shadow-lg">
        <CommandInput
          placeholder="Search by address or coordinates"
          value={query}
          onValueChange={setQuery}
          disabled={loading}
          className="h-12 md:h-10 bg-background/95 backdrop-blur-sm w-full text-base px-4 rounded-lg focus:ring-2 focus:ring-primary/50"
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => setFocused(false), 200);
          }}
        />
        {focused && (
          <CommandList className="absolute top-full left-0 right-0 mt-1 max-h-[300px] overflow-y-auto bg-background/95 backdrop-blur-sm rounded-lg border shadow-lg">
            <CommandEmpty>
              {loading ? (
                <div className="flex items-center justify-center gap-2 p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching...</span>
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No results found
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {searchResults.map((result) => (
                <CommandItem
                  key={result.id}
                  value={result.id}
                  onSelect={() => {
                    setFocused(false);
                    setIsLoadingProperty(true);
                    setShouldCenterMap(true);
                    setSelectedProperty(result);
                    setPropertyCardVisible(true);
                    setIsLoadingProperty(false);
                  }}
                  className="p-4 hover:bg-accent/50 transition-colors"
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
                    {result.parcelInfo && (
                      <div className="text-sm text-muted-foreground">
                        {result.parcelInfo.acreage} acres • {result.parcelInfo.squareFootage} sq ft
                      </div>
                    )}
                    {result.distanceToCity && result.timeToCity && (
                      <div className="text-sm text-muted-foreground">
                        {result.distanceToCity} ({result.timeToCity} drive)
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