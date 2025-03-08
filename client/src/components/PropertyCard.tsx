import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/utils/store";
import { Card } from "@/components/ui/card";
import { HomeIcon, ExternalLinkIcon, XIcon, UserIcon, BrainIcon } from "lucide-react";
import { toast } from "sonner";

export interface Props {
  onViewMore?: () => void;
}

export function PropertyCard({ onViewMore }: Props) {
  const { 
    setPropertyCardVisible, 
    isLoadingProperty, 
    selectedProperty, 
    userProfile,
    addRunningProperty,
    runningProperties 
  } = useAppStore();

  const handleViewMore = () => {
    if (userProfile?.subscriptionTier === "monthly" || userProfile?.subscriptionStatus === "active" || userProfile?.subscriptionStatus === "cancelled_active") {
      onViewMore?.();
    } else {
      toast.error("You need an active subscription to view detailed property analysis", {
        duration: 5000,
        description: "Subscribe in your profile to unlock all features",
        action: {
          label: "Profile",
          onClick: () => {
            const event = new CustomEvent("open-user-dialog");
            window.dispatchEvent(event);
          }
        }
      });
    }
  };

  const handleAnalyze = () => {
    if (!selectedProperty?.address?.streetAddress) return;

    if (userProfile?.subscriptionTier === "monthly" || userProfile?.subscriptionStatus === "active" || userProfile?.subscriptionStatus === "cancelled_active") {
      const address = selectedProperty.address.streetAddress;
      addRunningProperty(address);

      // Open analysis dialog
      const event = new CustomEvent("open-analysis-dialog", { 
        detail: { property: selectedProperty }
      });
      window.dispatchEvent(event);
    } else {
      toast.error("You need an active subscription to analyze properties", {
        duration: 5000,
        description: "Subscribe in your profile to unlock all features",
        action: {
          label: "Profile",
          onClick: () => {
            const event = new CustomEvent("open-user-dialog");
            window.dispatchEvent(event);
          }
        }
      });
    }
  };

  const isAnalyzing = selectedProperty?.address?.streetAddress && 
    runningProperties.includes(selectedProperty.address.streetAddress);

  return (
    <Card className="bg-card shadow-lg rounded-sm">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            Property Details
          </h2>
          <div className="flex items-center gap-1">
            {selectedProperty && !isLoadingProperty && selectedProperty.propertyId && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Analyze Property"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  <BrainIcon className={`w-4 h-4 ${isAnalyzing ? 'animate-pulse' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="View Details"
                  onClick={handleViewMore}
                >
                  <ExternalLinkIcon className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              title="Hide Card"
              onClick={() => setPropertyCardVisible(false)}
            >
              <XIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isLoadingProperty ? (
          <div className="space-y-4">
            {/* Address */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <HomeIcon className="w-4 h-4" />
                Address
              </div>
              <Skeleton className="h-5 w-full" />
            </div>

            {/* Owner */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <UserIcon className="w-4 h-4" />
                Owner
              </div>
              <Skeleton className="h-5 w-full" />
            </div>
          </div>
        ) : selectedProperty ? (
          <div className="space-y-4">
            {/* Address */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <HomeIcon className="w-4 h-4" />
                Address
              </div>
              <p className="text-sm font-medium break-words">
                {selectedProperty.address?.streetAddress}, {selectedProperty.address?.city}, {selectedProperty.address?.state} {selectedProperty.address?.zipcode}
              </p>
            </div>

            {/* Owner */}
            {selectedProperty.ownerName && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <UserIcon className="w-4 h-4" />
                  Owner
                </div>
                <p className="text-sm font-medium break-words">
                  {selectedProperty.ownerName}
                </p>
              </div>
            )}

            {/* Analysis Status */}
            {isAnalyzing && (
              <div className="text-sm text-muted-foreground animate-pulse">
                Analyzing property...
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <p className="text-md text-muted-foreground">Please select a valid property</p>
          </div>
        )}
      </div>
    </Card>
  );
}