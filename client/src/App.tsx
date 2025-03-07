import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { queryClient } from "./lib/queryClient";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function Router() {
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    return auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        // Add Firebase ID token to all API requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
          const [resource, config] = args;
          const token = await user.getIdToken();
          
          const modifiedConfig = {
            ...config,
            headers: {
              ...config?.headers,
              "x-firebase-uid": user.uid,
              "Authorization": `Bearer ${token}`,
            },
          };

          return originalFetch(resource, modifiedConfig);
        };
      }
    });
  }, []);

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard">
        {user ? <Dashboard /> : () => window.location.replace("/login")}
      </Route>
      <Route component={NotFound} />
    </Switch>
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
