import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CoinsIcon, Loader2, Check, DollarSign, AlertTriangle } from 'lucide-react';
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

  // Get user profile data (credits, etc.)
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["/api/user"],
  });

  // Initialize state if property has existing price data
  useEffect(() => {
    if (selectedProperty?.acre_prices) {
      setShowAnalysis(true);
      setAcrePrices(selectedProperty.acre_prices);

      if (
        selectedProperty.predicted_price &&
        selectedProperty.confidence_score &&
        selectedProperty.price_reasoning
      ) {
        setPredictedPrice({
          predicted_price: selectedProperty.predicted_price,
          confidence_score: selectedProperty.confidence_score,
          reasoning: selectedProperty.price_reasoning,
        });
      }
    }
  }, [selectedProperty]);

  if (!selectedProperty?.address) return null;

  async function handleGenerate() {
    setIsGenerating(true);
    setShowAnalysis(true);
    setError(null);

    try {
      // Get acre prices for properties in the area
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

      // Generate AI analysis using correct property values
      setIsPredicting(true);
      const analysis = await analyzeProperty(
        `${selectedProperty.address.streetAddress}, ${selectedProperty.address.city}, ${selectedProperty.address.state} ${selectedProperty.address.zipcode}`,
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

      // Save analysis
      await apiRequest("POST", "/api/analyses", {
        parcelId: selectedProperty.id,
        analysis,
        creditsUsed: 50, 
      });

      if (onAnalysisComplete) {
        onAnalysisComplete(analysis);
      }
    } catch (error: any) {
      console.error("Error generating price:", error);
      setError(error.message || "Failed to generate analysis");
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to generate analysis",
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
        <h3 className="text-lg font-semibold">Generate Price</h3>
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!showAnalysis && (
          <div className="flex flex-col items-center gap-4">
            {userProfile?.credits === 0 && (
              <Alert variant="destructive" className="max-w-sm">
                <CoinsIcon className="h-4 w-4" />
                <AlertDescription>
                  You're out of tokens. Purchase more tokens to analyze properties.
                </AlertDescription>
              </Alert>
            )}
            {userProfile?.credits < 50 ? (
              <Alert className="max-w-sm bg-amber-500/20 text-amber-500 border-amber-500">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You need at least 50 tokens to generate a price analysis. Please purchase more tokens.
                </AlertDescription>
              </Alert>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || userProfile?.credits === 0 || isLoadingProfile}
                className="w-full max-w-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate"
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Acre Prices */}
      {showAnalysis && (
        isFetchingAcrePrices ? (
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 p-4 border-b">
              <div className="h-6 w-6 flex items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <h4 className="text-base font-semibold">Loading Comparable Properties</h4>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto w-[min(63vw,400px)]">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Address</TableHead>
                      <TableHead className="text-right text-muted-foreground">Size (Acres)</TableHead>
                      <TableHead className="text-right text-muted-foreground">Price (USD)</TableHead>
                      <TableHead className="text-right text-muted-foreground">Price/Acre</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1, 2, 3].map((_, index) => (
                      <TableRow key={index} className="hover:bg-transparent">
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : !acrePrices ? null : acrePrices.length === 0 ? (
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 p-4 border-b">
              <div className="h-6 w-6 flex items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <h4 className="text-base font-semibold">No Properties Found</h4>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground">
                Unable to find properties for sale nearby to estimate price. The AI analysis will proceed with estimated values.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 p-4 border-b">
              <div className="h-6 w-6 flex items-center justify-center rounded-full bg-primary/10">
                <Check className="h-4 w-4" />
              </div>
              <h4 className="text-base font-semibold">Comparable Properties</h4>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto w-[min(63vw,400px)]">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Address</TableHead>
                      <TableHead className="text-right text-muted-foreground">Size (Acres)</TableHead>
                      <TableHead className="text-right text-muted-foreground">Price (USD)</TableHead>
                      <TableHead className="text-right text-muted-foreground">Price/Acre</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {acrePrices.map((property, index) => (
                      <TableRow key={index} className="hover:bg-transparent">
                        <TableCell className="font-medium break-words whitespace-normal">
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
            </div>
          </div>
        )
      )}

      {/* Predicted Price */}
      {showAnalysis && (
        isPredicting ? (
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 p-4 border-b">
              <div className="h-6 w-6 flex items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <h4 className="text-base font-semibold">Generating AI Analysis</h4>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground">
                Analyzing property data and market trends...
              </p>
            </div>
          </div>
        ) : predictedPrice ? (
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 p-4 border-b">
              <div className="h-6 w-6 flex items-center justify-center rounded-full bg-primary/10">
                <DollarSign className="h-4 w-4" />
              </div>
              <h4 className="text-base font-semibold">AI Analysis Results</h4>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="text-3xl font-bold">{predictedPrice.predicted_price}</span>
                <Badge variant="outline">
                  Confidence: {predictedPrice.confidence_score}%
                </Badge>
              </div>
              <Separator />
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{predictedPrice.reasoning}</ReactMarkdown>
              </div>
            </div>
          </div>
        ) : null
      )}

      {/* Share and Regenerate Buttons */}
      {selectedProperty.predicted_price && !isGenerating && (
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={handleGenerate}
            disabled={isGenerating || userProfile?.credits === 0 || userProfile?.credits < 50 || isLoadingProfile}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              "Regenerate"
            )}
          </Button>
          <Button
            onClick={async () => {
              const address = `${selectedProperty.address.streetAddress}, ${selectedProperty.address.city}, ${selectedProperty.address.state} ${selectedProperty.address.zipcode}`;
              const shareUrl = `${window.location.origin}?id=${selectedProperty.id}`;
              try {
                await navigator.share({
                  title: 'Landhacker',
                  text: address,
                  url: shareUrl,
                });
              } catch (error: any) {
                console.log('Share URL:', shareUrl);
              }
            }}
          >
            Share Analysis
          </Button>
        </div>
      )}
    </div>
  );
}