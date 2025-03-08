import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/utils/store";

export function MeasurementCard() {
  const { measurementMode } = useAppStore();
  const measurements = useAppStore(state => state.measurements);

  const formatMeasurement = (value: number) => {
    if (measurementMode === 'distance') {
      return `${value.toFixed(2)} miles`;
    } else {
      return `${value.toFixed(2)} acres`;
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-medium mb-2">
          {measurementMode === 'distance' ? 'Distance Measurement' : 'Area Measurement'}
        </h3>
        {measurements.length > 0 ? (
          <ul className="space-y-2">
            {measurements.map((m, i) => (
              <li key={m.id} className="text-sm">
                {`Measurement ${i + 1}: ${formatMeasurement(m.value)}`}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {measurementMode === 'distance' 
              ? 'Click points on the map to measure distance' 
              : 'Click points on the map to measure area'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
