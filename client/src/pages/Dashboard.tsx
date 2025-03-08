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
import { CreditCard, Users, Activity, Map } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  });

  const { data: invoices } = useQuery({
    queryKey: ["/api/invoices"],
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
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Available Tokens
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
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">
                Add members for $10/month each
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Properties Analyzed
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parcels?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total properties analyzed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscription</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Professional</div>
              <p className="text-xs text-muted-foreground">
                $20/month • Renews Mar 28
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

          <TabsContent value="billing" className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Invoice History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {invoices?.map((invoice: any) => (
                      <div key={invoice.id} className="flex items-center">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {invoice.description}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(invoice.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-auto font-medium">
                          ${invoice.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Token Purchase</CardTitle>
                </CardHeader>
                <CardContent>
                  <TokenPurchase />
                </CardContent>
              </Card>
            </div>

            {/* Properties Analyzed Section */}
            <Card>
              <CardHeader>
                <CardTitle>Properties Analyzed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {parcels?.map((parcel) => (
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
                            handleAnalyze();
                          }}
                        >
                          View Analysis
                        </Button>
                      </div>
                    </div>
                  ))}

                  {!parcels?.length && (
                    <div className="text-center py-6 text-muted-foreground">
                      No properties analyzed yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
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