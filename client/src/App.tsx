import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { queryClient } from "./lib/queryClient";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import Home from "@/pages/Home";
import Features from "@/pages/Features";
import Pricing from "@/pages/Pricing";
import Dashboard from "@/pages/Dashboard";
import TeamMembers from "@/pages/TeamMembers";
import Login from "@/pages/Login";
import BetaLanding from "@/pages/BetaLanding";
import NotFound from "@/pages/not-found";
import PurchaseTokens from "@/pages/PurchaseTokens";
import TeamManagement from "@/pages/TeamManagement";
import Settings from './pages/Settings';
import { ProtectedRoute } from "@/components/ProtectedRoute";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/features" component={Features} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/login" component={Login} />
          <Route path="/beta" component={BetaLanding} />
          <ProtectedRoute path="/dashboard" component={Dashboard} />
          <ProtectedRoute path="/team" component={TeamMembers} />
          <ProtectedRoute path="/team-management" component={TeamManagement} />
          <ProtectedRoute path="/purchase-tokens" component={PurchaseTokens} />
          <ProtectedRoute path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
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