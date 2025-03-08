import { Button } from "@/components/ui/button";
import { useAppStore } from "@/utils/store";
import { RulerIcon, Maximize2, X } from "lucide-react";

export function MeasurementControls() {
  const { measurementMode, setMeasurementMode, clearMeasurements } = useAppStore();

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="icon"
        variant={measurementMode === 'distance' ? 'default' : 'outline'}
        onClick={() => setMeasurementMode(measurementMode === 'distance' ? 'none' : 'distance')}
        title="Measure Distance"
      >
        <RulerIcon className="h-4 w-4" />
      </Button>
      
      <Button
        size="icon"
        variant={measurementMode === 'area' ? 'default' : 'outline'}
        onClick={() => setMeasurementMode(measurementMode === 'area' ? 'none' : 'area')}
        title="Measure Area"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>

      {measurementMode !== 'none' && (
        <Button
          size="icon"
          variant="outline"
          onClick={clearMeasurements}
          title="Clear Measurements"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
