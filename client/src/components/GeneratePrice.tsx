import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type PropertyAnalysis } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { analyzeProperty } from '@/lib/openai';
import { apiRequest } from '@/lib/queryClient';
import { toast } from 'sonner';

interface GeneratePriceProps {
  selectedProperty: any; 
  onAnalysisComplete?: (analysis: PropertyAnalysis) => void;
}

export function GeneratePrice({ selectedProperty, onAnalysisComplete }: GeneratePriceProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictedPrice, setPredictedPrice] = useState<{
    predicted_price: string;
    confidence_score: string;
    reasoning: string;
  } | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [acrePrices, setAcrePrices] = useState<any[]>([]);
  const [isFetchingAcrePrices, setIsFetchingAcrePrices] = useState(false);

  const { data: userProfile } = useQuery({
    queryKey: ["/api/user"],
  });

  useEffect(() => {
    if (selectedProperty?.acre_prices) {
      setShowAnalysis(true);
      setAcrePrices(selectedProperty.acre_prices);
    }
  }, [selectedProperty]);

  if (!selectedProperty?.address) return null;

  async function handleGenerate() {
    setIsGenerating(true);
    setShowAnalysis(true);
    setError(null);

    try {
      // Get acre prices for comparable properties
      setIsFetchingAcrePrices(true);
      const acrePricesResponse = await apiRequest("POST", "/api/acres-prices", {
        city: selectedProperty.address.city,
        state: selectedProperty.address.state,
        acres: selectedProperty.gisArea || selectedProperty.acres || 10,
        zip_code: selectedProperty.address.zipcode,
        radius: 50 
      });

      if (!acrePricesResponse.ok) {
        throw new Error(`Failed to fetch comparable properties: ${await acrePricesResponse.text()}`);
      }

      const acrePricesData = await acrePricesResponse.json();
      console.log("Received acre prices data:", acrePricesData);

      if (!acrePricesData.prices || acrePricesData.prices.length === 0) {
        toast({
          title: "No Comparable Properties",
          description: "We couldn't find similar properties in the area. The AI analysis will continue with estimated values.",
        });
      }
      setAcrePrices(acrePricesData.prices || []);

      // Generate AI analysis
      setIsPredicting(true);
      const analysis = await analyzeProperty(
        selectedProperty.address.streetAddress,
        selectedProperty.gisArea || selectedProperty.acres || 10,
        selectedProperty.latitude,
        selectedProperty.longitude,
        selectedProperty.marketValue || selectedProperty.price
      );

      console.log("Received analysis:", analysis);

      setPredictedPrice({
        predicted_price: `$${analysis.estimatedValue.toLocaleString()}`,
        confidence_score: `${(analysis.confidenceScore * 100).toFixed(0)}`,
        reasoning: analysis.marketTrends.reasoning,
      });

      if (onAnalysisComplete) {
        onAnalysisComplete(analysis);
      }
    } catch (error: any) {
      console.error("Error generating price:", error);
      setError(error.message || "Failed to generate analysis");
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to generate analysis"
      });
    } finally {
      setIsFetchingAcrePrices(false);
      setIsPredicting(false);
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-8 w-full max-w-[100%] overflow-hidden">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Property Analysis</h3>
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Generate Button */}
        {!showAnalysis && (
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Property"
            )}
          </Button>
        )}

        {/* Comparable Properties */}
        {showAnalysis && (
          <div className="space-y-6">
            <h4 className="text-base font-medium">Comparable Properties</h4>
            {isFetchingAcrePrices ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : acrePrices.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Size (Acres)</TableHead>
                      <TableHead className="text-right">Price (USD)</TableHead>
                      <TableHead className="text-right">Price/Acre</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {acrePrices.map((property, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {property.address?.streetAddress || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-right">
                          {property.acre?.toLocaleString() || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          ${property.price?.toLocaleString() || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {property.acre && property.price
                            ? `$${Math.round(property.price / property.acre).toLocaleString()}`
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No comparable properties found in the area. Using market estimates for analysis.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* AI Analysis Results */}
        {showAnalysis && isPredicting && (
          <div className="space-y-4">
            <h4 className="text-base font-medium">Generating Analysis</h4>
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </div>
        )}

        {showAnalysis && !isPredicting && predictedPrice && (
          <div className="space-y-6">
            <div className="text-center">
              <h4 className="text-xl font-semibold mb-2">Estimated Value</h4>
              <div className="text-3xl font-bold mb-2">
                {predictedPrice.predicted_price}
              </div>
              <Badge variant="outline">
                Confidence: {predictedPrice.confidence_score}%
              </Badge>
            </div>

            <Separator />

            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{predictedPrice.reasoning}</ReactMarkdown>
            </div>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  "Regenerate Analysis"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}