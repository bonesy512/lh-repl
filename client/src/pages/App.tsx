import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import PropertyMap from "@/components/Map";
import { useQuery } from "@tanstack/react-query";
import { type Parcel } from "@shared/schema";

export default function App() {
  const { user, isLoading: authLoading } = useAuth();
  
  const { data: parcels = [], isLoading: loadingParcels } = useQuery<Parcel[]>({
    queryKey: ["/api/parcels"],
    enabled: !!user
  });

  if (authLoading || loadingParcels) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Map Component */}
          <PropertyMap
            parcels={parcels}
            onParcelSelect={() => {}}
            loading={loadingParcels}
          />
          
          {/* Analysis Tools Section - To be implemented */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-4">Comp Generation</h2>
              <p className="text-muted-foreground">Select a property on the map to generate comps.</p>
            </div>
            
            <div className="p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-4">Analysis Tools</h2>
              <p className="text-muted-foreground">Advanced AI-powered analysis coming soon.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
