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
import { CreditCard, Users, Activity, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  console.log("Dashboard component rendering");
  const { toast } = useToast();
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [activeDialog, setActiveDialog] = useState<"analysis" | "marketing" | null>(null);
  const [location, navigate] = useLocation();
  const { user: authUser, isLoading: authLoading } = useAuth();

  console.log("Auth state:", { authUser, authLoading });

  // Redirect to login if not authenticated
  useEffect(() => {
    console.log("Auth check effect running", { authUser, authLoading });
    if (!authLoading && !authUser) {
      console.log("No authenticated user, redirecting to /auth");
      navigate("/auth");
    }
  }, [authUser, authLoading, navigate]);

  // Only proceed with other queries if authenticated
  const { data: user, isLoading: loadingUser, error: userError } = useQuery<User>({
    queryKey: ["/api/user"],
    enabled: !!authUser,
  });

  const { data: parcels = [], isLoading: loadingParcels, error: parcelsError } = useQuery<Parcel[]>({
    queryKey: ["/api/parcels"],
    enabled: !!authUser,
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    enabled: !!authUser,
  });

  console.log("Query states:", {
    user,
    loadingUser,
    userError,
    parcelsCount: parcels.length,
    loadingParcels,
    parcelsError,
    invoicesCount: invoices.length,
    loadingInvoices
  });

  function handleParcelSelect(parcel: Parcel) {
    setSelectedParcel(parcel);
  }

  function handleAnalyze() {
    if (!selectedParcel) return;
    if (!user?.credits || user.credits < 1) {
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

  // Show loading state
  if (authLoading || loadingUser || loadingParcels) {
    console.log("Showing loading state");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show error state
  if (!authUser) {
    console.log("No auth user, returning null for redirect");
    return null; // Will be redirected by useEffect
  }

  if (userError) {
    console.error("User data error:", userError);
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            {userError instanceof Error 
              ? userError.message 
              : "Failed to load user data. Please try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (parcelsError) {
    console.error("Parcels data error:", parcelsError);
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            {parcelsError instanceof Error 
              ? parcelsError.message 
              : "Failed to load dashboard data. Please try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  console.log("Rendering dashboard content");
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <div className="text-2xl font-bold">{parcels.length}</div>
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
            {/* Map Component */}
            <PropertyMap
              parcels={parcels}
              onParcelSelect={handleParcelSelect}
              loading={loadingParcels}
            />

            {/* Property Card */}
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
              {/* Invoice History */}
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Invoice History</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingInvoices ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {invoices.map((invoice) => (
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
                      {invoices.length === 0 && (
                        <p className="text-center text-muted-foreground">
                          No invoices found
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Current Plan */}
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Professional Plan</h3>
                      <p className="text-sm text-muted-foreground">$20/month</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/subscription")}
                    >
                      Manage Subscription
                    </Button>
                  </div>
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
                            handleAnalyze();
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