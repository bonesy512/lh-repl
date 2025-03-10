import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { queryClient } from "./lib/queryClient";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
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
import Settings from "@/pages/Settings";
import './App.css';

function Router() {
  const { 
    setPropertyForAnalysis, 
    setAnalysisDialogOpen,
    analysisDialogOpen,
    propertyForAnalysis 
  } = useAppStore();

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
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
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />

      <AnalysisDialog 
        isOpen={analysisDialogOpen} 
        onClose={() => {
          setAnalysisDialogOpen(false);
          setPropertyForAnalysis(null);
        }}
        property={propertyForAnalysis}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;