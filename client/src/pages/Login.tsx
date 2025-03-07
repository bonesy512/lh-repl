import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { signInWithGoogle } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleLogin() {
    try {
      setLoading(true);
      const user = await signInWithGoogle();

      // Create or verify user in our backend
      await apiRequest("POST", "/api/auth/login", {
        firebaseUid: user.uid,
        email: user.email,
        username: user.displayName,
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login failed:", error);

      // Show user-friendly error message
      if (error.code === "auth/unauthorized-domain") {
        toast({
          title: "Login Error",
          description: `This domain is not authorized for login. Please add "${window.location.hostname}" to Firebase authorized domains in your Firebase Console under Authentication > Settings.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Failed",
          description: "An error occurred during login. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Welcome to LandHacker</CardTitle>
          <CardDescription>
            Sign in to access AI-powered land investment tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue with Google
          </Button>
          <p className="mt-4 text-sm text-muted-foreground text-center">
            Domain to authorize: {window.location.hostname}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}