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
};

const AVAILABLE_LAYERS: MapLayer[] = [
  {
    id: "parcel-boundaries",
    name: "Parcel Boundaries",
    description: "Show property parcel boundaries"
  },
  {
    id: "terrain",
    name: "Terrain",
    description: "Show terrain and elevation data"
  },
  {
    id: "satellite",
    name: "Satellite",
    description: "Show satellite imagery"
  },
  {
    id: "zoning",
    name: "Zoning",
    description: "Show zoning districts and land use"
  }
];

export function LayerControl() {
  const { activeLayers, toggleLayer } = useAppStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10">
          <Layers className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Map Layers</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {AVAILABLE_LAYERS.map((layer) => (
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
