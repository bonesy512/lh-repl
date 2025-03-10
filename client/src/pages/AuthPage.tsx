import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading, loginMutation } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Welcome to LandHacker</h1>
          <p className="text-muted-foreground">
            Sign in to access powerful land investment tools
          </p>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={() => {
            console.log("Attempting login with popup");
            loginMutation.mutate();
          }}
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in with Google"
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          If a popup doesn't appear, please check your popup blocker settings.
        </p>
      </div>
    </div>
  );
}
