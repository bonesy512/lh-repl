import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { signInWithGoogle, signOut, auth } from "@/lib/firebase";
import { useLocation } from "wouter";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: any;
  logoutMutation: any;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [, navigate] = useLocation();

  // Handle Firebase auth state changes
  useEffect(() => {
    console.log("Setting up auth state listener");
    let mounted = true;

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? "User logged in" : "User logged out");

      if (!mounted) return;

      try {
        if (firebaseUser) {
          console.log("Syncing Firebase user with backend:", firebaseUser.email);
          const res = await apiRequest("POST", "/api/auth/login", {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          });

          const userData = await res.json();
          console.log("Backend sync successful:", userData);

          queryClient.setQueryData(["/api/user"], userData);
          console.log("Redirecting to dashboard...");
          navigate("/dashboard");

          toast({
            title: "Welcome!",
            description: "Successfully logged in.",
          });
        } else {
          console.log("No Firebase user, clearing user data");
          queryClient.setQueryData(["/api/user"], null);
        }
      } catch (error) {
        console.error("Auth state sync failed:", error);
        toast({
          title: "Authentication Error",
          description: "Failed to complete sign-in process.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [toast, navigate]);

  // Get user data from backend
  const { data: user, error } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const response = await getQueryFn({ on401: "returnNull" })();
        console.log("User data fetched:", response);
        return response || null;
      } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
      }
    },
    enabled: !isLoading,
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      console.log("Starting Google sign-in...");
      return await signInWithGoogle();
    },
    onError: (error: Error) => {
      console.error("Login mutation failed:", error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("Starting logout process...");
      await signOut();
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      console.log("Logout successful");
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      navigate("/login");
      toast({
        title: "Logged out",
        description: "Successfully logged out.",
      });
    },
    onError: (error: Error) => {
      console.error("Logout failed:", error);
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error: error || null,
        loginMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}