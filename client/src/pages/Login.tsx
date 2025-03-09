import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { signInWithGoogle } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { queryClient } from "@/lib/queryClient";

export default function Login() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Redirect if already logged in
  if (user) {
    navigate("/dashboard");
    return null;
  }

  async function handleLogin() {
    try {
      setLoading(true);
      setError(null);
      console.log("Starting Google sign-in process...");
      const user = await signInWithGoogle();
      console.log("Google sign-in successful:", user);

      // Create or verify user in our backend
      console.log("Verifying user with backend...");
      console.log("Making POST request to /api/auth/login", {
        firebaseUid: user.uid,
        email: user.email,
        username: user.displayName
      });

      const response = await apiRequest("POST", "/api/auth/login", {
        firebaseUid: user.uid,
        email: user.email,
        username: user.displayName,
      });

      const userData = await response.json();
      console.log("Backend authentication response:", userData);

      if (!userData) {
        throw new Error("Failed to authenticate with backend");
      }

      // Update auth state
      queryClient.setQueryData(["/api/user"], userData);
      console.log("Updated query cache with user data");

      console.log("Backend verification successful");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login failed:", error);
      const errorMessage = error.message || "An error occurred during login";
      setError(errorMessage);

      if (error.code === "auth/popup-blocked") {
        toast({
          title: "Login Error",
          description: "Please enable popups for this site to use Google sign-in. Look for the popup blocked icon in your browser's address bar.",
          variant: "destructive",
        });
      } else if (error.code === "auth/unauthorized-domain") {
        toast({
          title: "Login Error",
          description: `This domain is not authorized for login. Please add "${window.location.hostname}" to Firebase authorized domains.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-primary" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          LandHacker
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "LandHacker has revolutionized how we analyze and invest in land properties. The AI-powered insights are invaluable."
            </p>
            <footer className="text-sm">Sofia Davis - Professional Land Investor</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome to LandHacker
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to access AI-powered land investment tools
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            className="w-full"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue with Google
          </Button>
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <a
              href="#"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}