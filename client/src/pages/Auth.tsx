
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { auth, signInWithGoogle } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("Auth page: User already authenticated");
        setComplete(true);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Auth page: Starting sign in process");
      const result = await signInWithGoogle();
      
      if (result?.user) {
        console.log("Auth page: Sign in successful");
        setComplete(true);
      } else if (!result) {
        // This happens when using redirect method
        console.log("Auth page: Awaiting redirect result");
      }
    } catch (err) {
      console.error("Auth page error:", err);
      setError(`Authentication error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl text-center">
            LandHacker Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {complete ? (
            <div className="text-center space-y-4">
              <p>Authentication successful!</p>
              <p className="text-sm text-muted-foreground">
                You can close this window and return to the application.
              </p>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="p-3 bg-destructive/10 border border-destructive rounded-md text-destructive text-sm">
                {error}
              </div>
              <Button 
                className="w-full" 
                onClick={handleSignIn}
                disabled={loading}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center">
                Please sign in to continue to LandHacker
              </p>
              <Button
                className="w-full"
                onClick={handleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in with Google"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
