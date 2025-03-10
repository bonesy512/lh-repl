import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import PropertyMap from "@/components/Map";
import { PropertyCard } from "@/components/PropertyCard";
import { AIAnalysis } from "@/components/AIAnalysis";
import { MarketingTools } from "@/components/MarketingTools";
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
import { CreditCard, Activity, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

interface User {
  id: number;
  username: string;
  credits: number;
}

interface Invoice {
  id: number;
  date: string;
  amount: number;
  description: string;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [activeDialog, setActiveDialog] = useState<"analysis" | "marketing" | null>(null);
  const [location, navigate] = useLocation();
  const { user: authUser, isLoading: authLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !authUser) {
      navigate("/login");
      return;
    }
  }, [authUser, authLoading, navigate]);

  // Only proceed with other queries if authenticated
  const { data: user, isLoading: loadingUser } = useQuery<User>({
    queryKey: ["/api/user"],
    enabled: !!authUser,
  });

  const { data: parcels = [], isLoading: loadingParcels } = useQuery<Parcel[]>({
    queryKey: ["/api/parcels"],
    enabled: !!authUser,
    onSuccess: (data) => {
      console.log("Fetched parcels:", data);
    },
  });

  // Show loading state for the entire dashboard
  if (authLoading || loadingUser || loadingParcels) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show error state
  if (!authUser) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Available Credits
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user?.credits || 0}</div>
              <p className="text-xs text-muted-foreground">
                Used for AI analysis and marketing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Properties Analyzed</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parcels.length}</div>
              <p className="text-xs text-muted-foreground">
                Total properties analyzed
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="map">
          <TabsList>
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="billing">Billing & Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-8">
            {/* Map Component */}
            <PropertyMap
              parcels={parcels}
              onParcelSelect={setSelectedParcel}
              loading={loadingParcels}
            />

            {/* Property Card */}
            {selectedParcel && (
              <PropertyCard
                parcel={selectedParcel}
                onAnalyze={() => setActiveDialog("analysis")}
                onCreateCampaign={() => setActiveDialog("marketing")}
              />
            )}
          </TabsContent>

          <TabsContent value="billing" className="space-y-8">
            <div className="grid gap-4">
              {/* Properties Analyzed Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Properties Analyzed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {parcels.map((parcel) => (
                      <div key={parcel.id} className="flex items-start space-x-4 border-b pb-4 last:border-0">
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {parcel.address}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {parcel.acres} acres {parcel.price && `• $${parcel.price.toLocaleString()}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedParcel(parcel);
                            }}
                          >
                            View Analysis
                          </Button>
                        </div>
                      </div>
                    ))}
                    {parcels.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        No properties analyzed yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
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