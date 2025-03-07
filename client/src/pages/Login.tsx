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
import { Loader2 } from "lucide-react";
import { signInWithGoogle } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);

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
        </CardContent>
      </Card>
    </div>
  );
}
