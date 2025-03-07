import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { type Parcel, type Analysis } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface PropertyCardProps {
  parcel: Parcel;
  onAnalyze?: () => void;
  onCreateCampaign?: () => void;
}

export function PropertyCard({ parcel, onAnalyze, onCreateCampaign }: PropertyCardProps) {
  const { data: analyses, isLoading } = useQuery({
    queryKey: [`/api/analyses/${parcel.id}`]
  });

  const latestAnalysis = analyses?.[0] as Analysis | undefined;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{parcel.address}</CardTitle>
        <div className="flex gap-2 mt-2">
          <Badge variant="outline">{parcel.acres} acres</Badge>
          {parcel.price && (
            <Badge variant="secondary">
              ${parcel.price.toLocaleString()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : latestAnalysis ? (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">AI Analysis</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Value</p>
                  <p className="text-lg font-semibold">
                    ${latestAnalysis.analysis.estimatedValue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confidence</p>
                  <p className="text-lg font-semibold">
                    {(latestAnalysis.analysis.confidenceScore * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Key Features</h4>
              <ul className="list-disc list-inside space-y-1">
                {latestAnalysis.analysis.keyFeatures.map((feature, i) => (
                  <li key={i} className="text-sm">{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              No analysis available for this property
            </p>
            <Button onClick={onAnalyze}>
              Analyze Property
            </Button>
          </div>
        )}
        
        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCreateCampaign}
          >
            Create Campaign
          </Button>
          {latestAnalysis && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={onAnalyze}
            >
              New Analysis
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
