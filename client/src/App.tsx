import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { queryClient } from "./lib/queryClient";
import { Footer } from "@/components/Footer";
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
import { ProtectedRoute } from "@/components/ProtectedRoute";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Simple static header with no navigation */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <span className="font-bold">LandHacker</span>
        </div>
      </header>

      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/features" component={Features} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/login" component={Login} />
          <Route path="/auth" component={Auth} />
          <Route path="/beta" component={BetaLanding} />
          <ProtectedRoute path="/dashboard" component={Dashboard} />
          <ProtectedRoute path="/app" component={AppPage} />
          <ProtectedRoute path="/team-management" component={TeamManagement} />
          <ProtectedRoute path="/purchase-tokens" component={PurchaseTokens} />
          <ProtectedRoute path="/membership" component={Membership} />
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