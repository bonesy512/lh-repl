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
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard">
        {user ? <Dashboard /> : () => {
          window.location.href = "/login";
          return null;
        }}
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
import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to My App</h1>
        <p>This is a React application built with Vite.</p>
      </header>
    </div>
  );
}

export default App;
