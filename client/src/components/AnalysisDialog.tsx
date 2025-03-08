import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { useAppStore } from "@/utils/store";
import { Loader2 } from "lucide-react";
import type { PropertyDetailsResponse, PriceEstimate } from "types";

interface AnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyDetailsResponse | null;
}

export function AnalysisDialog({ isOpen, onClose, property }: AnalysisDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { removeRunningProperty } = useAppStore();
  const [priceEstimates, setPriceEstimates] = useState<PriceEstimate[]>([]);
  const [prediction, setPrediction] = useState<{
    predicted_price: string;
    confidence_score: string;
    reasoning: string;
  } | null>(null);

  useEffect(() => {
    async function analyzeProperty() {
      if (!property?.address?.streetAddress) return;

      console.log("Starting property analysis in dialog:", property);
      setLoading(true);
      setError(null);

      try {
        // Get price estimates
        console.log("Fetching price estimates...");
        const estimatesResponse = await fetch('/api/scrape/estimates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: property.address.streetAddress,
            city: property.address.city,
            state: property.address.state
          })
        });

        if (!estimatesResponse.ok) {
          throw new Error('Failed to fetch price estimates');
        }

        const estimates = await estimatesResponse.json();
        console.log("Received price estimates:", estimates);
        setPriceEstimates(estimates);

        // Get price prediction
        console.log("Requesting price prediction...");
        const predictionResponse = await fetch('/api/scrape/predict-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: property.address.streetAddress,
            priceComparisons: estimates
          })
        });

        if (!predictionResponse.ok) {
          throw new Error('Failed to generate price prediction');
        }

        const predictionResult = await predictionResponse.json();
        console.log("Received price prediction:", predictionResult);
        setPrediction(predictionResult);

      } catch (err) {
        console.error("Analysis error:", err);
        setError(err instanceof Error ? err.message : 'Failed to analyze property');
      } finally {
        setLoading(false);
        if (property.address.streetAddress) {
          removeRunningProperty(property.address.streetAddress);
        }
      }
    }

    if (isOpen && property) {
      analyzeProperty();
    }
  }, [isOpen, property]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Property Analysis</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span>Analyzing property...</span>
            </div>
          ) : error ? (
            <div className="text-destructive">{error}</div>
          ) : (
            <div className="space-y-6">
              {/* Price Estimates */}
              <div>
                <h3 className="font-semibold mb-2">Price Comparisons</h3>
                <div className="space-y-2">
                  {priceEstimates.map((estimate, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span>{estimate.website_name || 'Source ' + (idx + 1)}</span>
                      <span className="font-medium">{estimate.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Prediction */}
              {prediction && (
                <div>
                  <h3 className="font-semibold mb-2">AI Analysis</h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-muted-foreground">Predicted Price:</span>
                      <span className="ml-2 font-medium">{prediction.predicted_price}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Confidence Score:</span>
                      <span className="ml-2 font-medium">{prediction.confidence_score}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reasoning:</span>
                      <p className="mt-1">{prediction.reasoning}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}