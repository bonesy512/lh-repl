import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { type Parcel } from '@shared/schema';
import { analyzeProperty, type PropertyAnalysis } from '@/lib/openai';
import { apiRequest } from '@/lib/queryClient';

interface AIAnalysisProps {
  parcel: Parcel;
  onAnalysisComplete?: (analysis: PropertyAnalysis) => void;
}

export function AIAnalysis({ parcel, onAnalysisComplete }: AIAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  async function handleAnalyze() {
    try {
      setLoading(true);
      setError(null);

      // Perform AI analysis
      const analysis = await analyzeProperty(
        parcel.address,
        Number(parcel.acres),
        Number(parcel.latitude),
        Number(parcel.longitude),
        parcel.price
      );

      // Save analysis to backend
      await apiRequest('POST', '/api/analyses', {
        parcelId: parcel.id,
        analysis,
        creditsUsed: 1, // Base credit cost
      });

      toast({
        title: 'Analysis Complete',
        description: 'Property analysis has been completed successfully.',
      });

      onAnalysisComplete?.(analysis);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Analysis Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Property Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use AI to analyze this property's potential value, risks, and opportunities.
            This will use 1 credit.
          </p>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Analyzing...' : 'Start Analysis'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}