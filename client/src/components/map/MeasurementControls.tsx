import { Button } from "@/components/ui/button";
import { RulerIcon } from "lucide-react";
import { useAppStore } from "@/utils/store";

export function MeasurementControls() {
  const { measurementMode, setMeasurementMode } = useAppStore();

  return (
    <Button
      variant="secondary"
      size="icon"
      className="mapboxgl-ctrl-group mapboxgl-ctrl h-[29px] w-[29px] !p-0 z-[2] bg-white text-black hover:bg-gray-100 hover:text-black border border-gray-200 dark:bg-white dark:text-black dark:hover:bg-gray-100 dark:border-gray-200 dark:hover:text-black"
      onClick={() => setMeasurementMode(measurementMode === 'none' ? 'distance' : 'none')}
    >
      <RulerIcon className="h-4 w-4" />
    </Button>
  );
}