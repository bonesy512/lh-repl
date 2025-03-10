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
import { CreditCard, Activity, Loader2, Plus, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

interface User {
  id: number;
  username: string;
  credits: number;
}

// Added TeamMembersCard component
const TeamMembersCard = () => {
  const [teamMembers, setTeamMembers] = useState<string[]>([]); // Placeholder data

  useEffect(() => {
    // Fetch team members data from API here.  This is a placeholder.
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch('/api/team'); // Replace with your actual API endpoint
        const data = await response.json();
        setTeamMembers(data.members);
      } catch (error) {
        console.error("Error fetching team members:", error);
      }
    };
    fetchTeamMembers();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Team Members</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <ul>
          {teamMembers.map((member) => (
            <li key={member}>{member}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};


export default function Dashboard() {
  const { toast } = useToast();
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [activeDialog, setActiveDialog] = useState<"analysis" | "marketing" | null>(null);
  const [, navigate] = useLocation();
  const { user: authUser, isLoading: authLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !authUser) {
      console.log("No authenticated user, redirecting to login");
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
    enabled: !!authUser
  });

  // Show loading state for the entire dashboard
  if (authLoading || loadingUser || loadingParcels) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 w-full"
                onClick={() => navigate("/purchase-tokens")}
              >
                Purchase More
              </Button>
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
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 w-full"
                onClick={() => setActiveDialog("analysis")}
              >
                New Analysis
              </Button>
            </CardContent>
          </Card>

          <TeamMembersCard />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Marketing Campaigns</CardTitle>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Create New</div>
              <p className="text-xs text-muted-foreground">
                Generate AI-powered marketing materials
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 w-full"
                onClick={() => setActiveDialog("marketing")}
              >
                Start Campaign
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="map" className="space-y-6">
          <TabsList>
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="list">Property List</TabsTrigger>
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

          <TabsContent value="list" className="space-y-8">
            <div className="grid gap-4">
              {parcels.map((parcel) => (
                <Card key={parcel.id} className="hover:bg-accent/5">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {typeof parcel.address === 'string' 
                            ? JSON.parse(parcel.address).street 
                            : parcel.address.street}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {parcel.acres} acres • ${parcel.price?.toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedParcel(parcel)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
              {parcels.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <h3 className="text-lg font-semibold mb-2">No Properties Yet</h3>
                  <p>Start by analyzing your first property</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Usage History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {parcels.map((parcel) => (
                    <div key={parcel.id} className="flex items-start space-x-4 border-b pb-4 last:border-0">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Property Analysis
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {typeof parcel.address === 'string' 
                            ? JSON.parse(parcel.address).street 
                            : parcel.address.street}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">5 credits</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedParcel(parcel);
                            setActiveDialog("analysis");
                          }}
                        >
                          View Analysis
                        </Button>
                      </div>
                    </div>
                  ))}
                  {parcels.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      No usage history yet
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
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import TeamMembersCard from "@/components/TeamMembersCard";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: parcels, isLoading } = useQuery({
    queryKey: ["/api/parcels"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="col-span-2 space-y-6">
          {/* Parcels Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Properties</h2>
            {parcels && parcels.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Parcel cards would go here */}
              </div>
            ) : (
              <div className="bg-muted rounded-lg p-6 text-center">
                <p className="text-muted-foreground">No properties added yet</p>
                <button className="mt-4 bg-primary text-white px-4 py-2 rounded-md">
                  Add Your First Property
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Credits Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="font-medium mb-2">Available Credits</h3>
            <p className="text-2xl font-bold">{user?.credits || 0}</p>
            <button className="mt-4 w-full bg-primary text-white px-4 py-2 rounded-md">
              Purchase Credits
            </button>
          </div>
          
          {/* Team Members Card */}
          <TeamMembersCard />
        </div>
      </div>
    </div>
  );
}
