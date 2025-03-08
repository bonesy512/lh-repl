import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { queryClient } from "./lib/queryClient";
import { Navigation } from "@/components/Navigation";
import { AnalysisDialog } from "@/components/AnalysisDialog";
import { useAppStore } from "@/utils/store";
import Home from "@/pages/Home";
import Features from "@/pages/Features";
import Pricing from "@/pages/Pricing";
import Dashboard from "@/pages/Dashboard";
import TeamMembers from "@/pages/TeamMembers";
import AuthPage from "@/pages/Login";
import BetaLanding from "@/pages/BetaLanding";
import NotFound from "@/pages/not-found";
import Subscription from "@/pages/Subscription";
import PurchaseTokens from "@/pages/PurchaseTokens";
import './App.css';

function Router() {
  const { 
    setPropertyForAnalysis, 
    setAnalysisDialogOpen,
    analysisDialogOpen,
    propertyForAnalysis 
  } = useAppStore();

  return (
    <>
      <Navigation />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/features" component={Features} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/auth" component={AuthPage} />
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
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;