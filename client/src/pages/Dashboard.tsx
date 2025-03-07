import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PropertyMap from "@/components/Map";
import { PropertyCard } from "@/components/PropertyCard";
import { AIAnalysis } from "@/components/AIAnalysis";
import { MarketingTools } from "@/components/MarketingTools";
import { TokenPurchase } from "@/components/TokenPurchase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { type Parcel } from "@shared/schema";
import { auth } from "@/lib/firebase";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [activeDialog, setActiveDialog] = useState<"analysis" | "marketing" | null>(
    null
  );

  const { data: parcels, isLoading: loadingParcels } = useQuery({
    queryKey: ["/api/parcels"],
  });

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    queryFn: undefined,
  });

  function handleParcelSelect(parcel: Parcel) {
    setSelectedParcel(parcel);
  }

  function handleAnalyze() {
    if (!selectedParcel) return;
    if (user?.credits < 1) {
      toast({
        title: "Insufficient Credits",
        description: "Please purchase more credits to perform analysis.",
        variant: "destructive",
      });
      return;
    }
    setActiveDialog("analysis");
  }

  function handleCreateCampaign() {
    if (!selectedParcel) return;
    setActiveDialog("marketing");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">LandHacker</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Credits: {user?.credits || 0}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                auth.signOut();
                navigate("/login");
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="map">
          <TabsList>
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="tokens">Purchase Tokens</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-8">
            <PropertyMap
              parcels={parcels}
              onParcelSelect={handleParcelSelect}
              loading={loadingParcels}
            />

            {selectedParcel && (
              <PropertyCard
                parcel={selectedParcel}
                onAnalyze={handleAnalyze}
                onCreateCampaign={handleCreateCampaign}
              />
            )}
          </TabsContent>

          <TabsContent value="tokens">
            <TokenPurchase />
          </TabsContent>
        </Tabs>

        {/* Analysis Dialog */}
        <Dialog
          open={activeDialog === "analysis"}
          onOpenChange={() => setActiveDialog(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Property Analysis</DialogTitle>
            </DialogHeader>
            {selectedParcel && (
              <AIAnalysis
                parcel={selectedParcel}
                onAnalysisComplete={() => setActiveDialog(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Marketing Dialog */}
        <Dialog
          open={activeDialog === "marketing"}
          onOpenChange={() => setActiveDialog(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Marketing Campaign</DialogTitle>
            </DialogHeader>
            {selectedParcel && (
              <MarketingTools
                parcel={selectedParcel}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
