import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { queryClient } from "./lib/queryClient";
import { Navigation } from "@/components/Navigation";
import { AnalysisDialog } from "@/components/AnalysisDialog";
import { useAppStore } from "@/utils/store";
import Home from "@/pages/Home";
import Features from "@/pages/Features";
import Pricing from "@/pages/Pricing";
import Dashboard from "@/pages/Dashboard";
import TeamMembers from "@/pages/TeamMembers";
import Login from "@/pages/Login";
import BetaLanding from "@/pages/BetaLanding";
import NotFound from "@/pages/not-found";
import Subscription from "@/pages/Subscription";
import PurchaseTokens from "@/pages/PurchaseTokens";
import type { PropertyDetailsResponse } from "types";
import './App.css';

function Router() {
  const [user, setUser] = useState(auth.currentUser);
  const { 
    setPropertyForAnalysis, 
    setAnalysisDialogOpen,
    analysisDialogOpen,
    propertyForAnalysis 
  } = useAppStore();

  useEffect(() => {
    return auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
          const [resource, config] = args;

          if (typeof resource === 'string' && resource.startsWith('/api')) {
            try {
              const token = await user.getIdToken();
              const modifiedConfig = {
                ...config,
                headers: {
                  ...config?.headers,
                  "Authorization": `Bearer ${token}`,
                },
              };
              return originalFetch(resource, modifiedConfig);
            } catch (error) {
              console.error("Error getting Firebase token:", error);
              return originalFetch(resource, config);
            }
          }

          return originalFetch(resource, config);
        };
      }
    });
  }, []);

  useEffect(() => {
    const handleAnalysisDialog = (event: Event) => {
      console.log("Received analysis dialog event");
      const customEvent = event as CustomEvent<{ property: PropertyDetailsResponse }>;
      console.log("Property data:", customEvent.detail.property);
      setPropertyForAnalysis(customEvent.detail.property);
      setAnalysisDialogOpen(true);
    };

    window.addEventListener('open-analysis-dialog', handleAnalysisDialog);
    return () => {
      window.removeEventListener('open-analysis-dialog', handleAnalysisDialog);
    };
  }, []);

  return (
    <>
      <Navigation />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/features" component={Features} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/login" component={Login} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/team" component={TeamMembers} />
        <Route path="/beta" component={BetaLanding} />
        <Route path="/subscription" component={Subscription} />
        <Route path="/purchase-tokens" component={PurchaseTokens} />
        <Route component={NotFound} />
      </Switch>

      <AnalysisDialog 
        isOpen={analysisDialogOpen} 
        onClose={() => {
          setAnalysisDialogOpen(false);
          setPropertyForAnalysis(null);
        }}
        property={propertyForAnalysis}
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;