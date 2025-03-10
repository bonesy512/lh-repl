import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { signInWithGoogle, signOut, auth, getRedirectResult, onAuthChange } from "@/lib/firebase";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: any;
  logoutMutation: any;
  isWebView: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isWebView] = useState(window.parent !== window);

  // Handle auth state changes and redirect results
  useEffect(() => {
    let mounted = true;

    // Check for redirect result and handle initial auth state
    const handleAuth = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!mounted) return;

        if (result?.user) {
          // Handle successful redirect sign-in
          try {
            const res = await apiRequest("POST", "/api/auth/login", {
              uid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName,
            });

            if (!mounted) return;

            const userData = await res.json();
            queryClient.setQueryData(["/api/user"], userData);

            toast({
              title: "Welcome!",
              description: "Successfully logged in.",
            });
          } catch (error) {
            console.error("Error syncing redirect user:", error);
            toast({
              title: "Error",
              description: "Failed to complete sign-in process.",
              variant: "destructive",
            });
          }
        }
      } catch (error: any) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          toast({
            title: "Login Error",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    };

    // Set up auth state observer
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (!mounted) return;

      if (firebaseUser && !isLoading) {
        // Only sync with backend for non-redirect auth changes
        try {
          const res = await apiRequest("POST", "/api/auth/login", {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          });

          const userData = await res.json();
          queryClient.setQueryData(["/api/user"], userData);
        } catch (error) {
          console.error("Error syncing user:", error);
        }
      }

      setIsLoading(false);
    });

    handleAuth();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [toast, isLoading]);

  // Get user data
  const { data: user, error } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async () => {
      if (isWebView) {
        const newTabUrl = window.location.origin + "/auth";
        console.log("Opening auth in new tab:", newTabUrl);
        window.open(newTabUrl, "_blank");
        toast({
          title: "Authentication",
          description: "Please complete login in the new tab.",
        });
        return null;
      }

      return await signInWithGoogle();
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await signOut();
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "Successfully logged out.",
      });
    },
    onError: (error: Error) => {
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
        isWebView,
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