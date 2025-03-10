import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { signInWithGoogle, signOut, auth, getRedirectResult } from "@/lib/firebase";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User | null, Error, void>;
  logoutMutation: UseMutationResult<void, Error, void>;
  isWebView: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isWebView] = useState(window.parent !== window);

  // Handle initial auth state and redirect result
  useEffect(() => {
    const handleInitialAuth = async () => {
      try {
        // Check for redirect result
        const result = await getRedirectResult(auth);
        if (result?.user) {
          // Handle successful redirect sign-in
          const res = await apiRequest("POST", "/api/auth/login", {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
          });

          const userData = await res.json();
          queryClient.setQueryData(["/api/user"], userData);

          toast({
            title: "Welcome!",
            description: "Successfully logged in.",
          });
        }
      } catch (error: any) {
        console.error("Auth initialization error:", error);
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    handleInitialAuth();
  }, [toast]);

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

      const firebaseUser = await signInWithGoogle();
      if (!firebaseUser) return null;

      // For popup flow, make backend call immediately
      const res = await apiRequest("POST", "/api/auth/login", {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      });

      const userData = await res.json();
      return userData;
    },
    onSuccess: (userData: User | null) => {
      if (userData) {
        queryClient.setQueryData(["/api/user"], userData);
        toast({
          title: "Welcome!",
          description: "Successfully logged in.",
        });
      }
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