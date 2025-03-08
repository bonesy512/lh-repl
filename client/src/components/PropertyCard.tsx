import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { HomeIcon, ExternalLink as ExternalLinkIcon, X as XIcon, User as UserIcon, Brain as BrainIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Parcel } from "@shared/schema";

export interface PropertyCardProps {
  parcel: Parcel;
  onAnalyze?: () => void;
  onCreateCampaign?: () => void;
}

export function PropertyCard({ parcel, onAnalyze, onCreateCampaign }: PropertyCardProps) {
  const { toast } = useToast();

  return (
    <Card className="bg-card shadow-lg rounded-sm">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            Property Details
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              title="Analyze Property"
              onClick={onAnalyze}
            >
              <BrainIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Create Campaign"
              onClick={onCreateCampaign}
            >
              <ExternalLinkIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <HomeIcon className="w-4 h-4" />
              Address
            </div>
            <p className="text-sm font-medium break-words">
              {parcel.address}
            </p>
          </div>

          {parcel.acres && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <UserIcon className="w-4 h-4" />
                Size
              </div>
              <p className="text-sm font-medium break-words">
                {parcel.acres} acres
              </p>
            </div>
          )}

          {parcel.price && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <UserIcon className="w-4 h-4" />
                Listed Price
              </div>
              <p className="text-sm font-medium break-words">
                ${parcel.price.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}