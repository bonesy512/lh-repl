import { Button } from "@/components/ui/button";
import { Layers, Eye, EyeOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/utils/store";

export type MapLayer = {
  id: string;
  name: string;
  description: string;
  category?: string;
};

const AVAILABLE_LAYERS: MapLayer[] = [
  {
    id: "parcel-boundaries",
    name: "Parcel Boundaries",
    description: "Show property parcel boundaries",
    category: "property"
  },
  {
    id: "building-footprints",
    name: "Building Footprints",
    description: "Show building outlines and structures",
    category: "property"
  },
  {
    id: "terrain",
    name: "Terrain",
    description: "Show terrain and elevation data",
    category: "geography"
  },
  {
    id: "satellite",
    name: "Satellite",
    description: "Show satellite imagery",
    category: "imagery"
  },
  {
    id: "zoning",
    name: "Zoning",
    description: "Show zoning districts and land use",
    category: "property"
  },
  {
    id: "county-data",
    name: "County Data",
    description: "Show county assessor boundaries and data",
    category: "government"
  },
  {
    id: "custom-shapes",
    name: "Custom Shapes",
    description: "Show uploaded custom shapefiles",
    category: "custom"
  }
];

export function LayerControl() {
  const { activeLayers, toggleLayer } = useAppStore();

  // Group layers by category
  const groupedLayers = AVAILABLE_LAYERS.reduce((acc, layer) => {
    const category = layer.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(layer);
    return acc;
  }, {} as Record<string, MapLayer[]>);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10">
          <Layers className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Map Layers</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(groupedLayers).map(([category, layers]) => (
          <div key={category}>
            <DropdownMenuLabel className="text-xs text-muted-foreground capitalize">
              {category}
            </DropdownMenuLabel>
            {layers.map((layer) => (
              <DropdownMenuCheckboxItem
                key={layer.id}
                checked={activeLayers.includes(layer.id)}
                onCheckedChange={() => toggleLayer(layer.id)}
              >
                <div className="flex items-center">
                  {activeLayers.includes(layer.id) ? (
                    <Eye className="mr-2 h-4 w-4" />
                  ) : (
                    <EyeOff className="mr-2 h-4 w-4" />
                  )}
                  <div>
                    <div className="font-medium">{layer.name}</div>
                    <p className="text-xs text-muted-foreground">
                      {layer.description}
                    </p>
                  </div>
                </div>
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}