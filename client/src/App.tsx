import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { queryClient } from "./lib/queryClient";
import { Navigation } from "@/components/Navigation";
import Home from "@/pages/Home";
import Features from "@/pages/Features";
import Pricing from "@/pages/Pricing";
import Dashboard from "@/pages/Dashboard";
import TeamMembers from "@/pages/TeamMembers";
import Login from "@/pages/Login";
import BetaLanding from "@/pages/BetaLanding";
import NotFound from "@/pages/not-found";
import './App.css';

function Router() {
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    return auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        // Add Firebase ID token to API requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
          const [resource, config] = args;

          // Only intercept API requests
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

          // Pass through non-API requests unchanged
          return originalFetch(resource, config);
        };
      }
    });
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
        <Route component={NotFound} />
      </Switch>
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