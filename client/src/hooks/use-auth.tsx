import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, type User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { signInWithGoogle } from "@/lib/firebase";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, void>;
  logoutMutation: UseMutationResult<void, Error, void>;
  isWebView: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Helper to detect if we're in a webview
const isWebView = () => {
  const isEmbedded = window.parent !== window;
  console.log("Webview detection:", { isEmbedded, userAgent: window.navigator.userAgent });
  return isEmbedded;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isInWebView] = useState(isWebView());

  // Log the environment on mount
  useEffect(() => {
    console.log("Auth environment:", {
      isWebView: isInWebView,
      href: window.location.href,
      origin: window.location.origin,
      parent: window.parent !== window
    });
  }, [isInWebView]);

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      console.log("Fetching user data...");
      try {
        const response = await fetch("/api/user", {
          credentials: "include",
        });
        if (response.status === 401) {
          console.log("User not authenticated");
          return null;
        }
        if (!response.ok) {
          throw new Error(`Failed to fetch user: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("User data response:", data);
        return data;
      } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
      }
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      console.log("Login mutation started:", { isInWebView });

      if (isInWebView) {
        console.log("Detected webview, showing open in new tab message");
        toast({
          title: "Authentication Notice",
          description: (
            <div>
              Please{" "}
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-primary"
              >
                open in a new tab
              </a>{" "}
              to login.
            </div>
          ),
        });
        throw new Error("Please open in a new tab to login");
      }

      console.log("Proceeding with Google sign in");
      try {
        const googleUser = await signInWithGoogle();
        console.log("Google sign in completed:", { uid: googleUser.uid });

        const res = await apiRequest("POST", "/api/auth/login", {
          uid: googleUser.uid,
          email: googleUser.email,
          displayName: googleUser.displayName,
        });
        return await res.json();
      } catch (error: any) {
        console.error("Login error:", error);
        throw error;
      }
    },
    onSuccess: (user: User) => {
      console.log("Login successful:", user);
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Welcome!",
        description: "You have been successfully logged in.",
      });
    },
    onError: (error: Error) => {
      console.error("Login mutation error:", error);
      if (!error.message.includes("Please open in a new tab")) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      console.error("Logout mutation error:", error);
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
        isWebView: isInWebView,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within a AuthProvider");
  }

  return context;
}