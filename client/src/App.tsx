import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/hooks/use-theme";
import { queryClient } from "./lib/queryClient";
import Home from "@/pages/Home";
import Features from "@/pages/Features";
import Pricing from "@/pages/Pricing";
import Dashboard from "@/pages/Dashboard";
import AppPage from "@/pages/App";
import TeamManagement from "@/pages/TeamManagement";
import Login from "@/pages/Login";
import Auth from "@/pages/Auth";
import BetaLanding from "@/pages/BetaLanding";
import NotFound from "@/pages/not-found";
import PurchaseTokens from "@/pages/PurchaseTokens";
import Membership from "@/pages/Membership";
import Settings from "@/pages/Settings";

function Router() {
  return (
    <div className="min-h-screen">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/features" component={Features} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/login" component={Login} />
        <Route path="/auth" component={Auth} />
        <Route path="/beta" component={BetaLanding} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/app" component={AppPage} />
        <Route path="/team-management" component={TeamManagement} />
        <Route path="/purchase-tokens" component={PurchaseTokens} />
        <Route path="/membership" component={Membership} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <Router />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;