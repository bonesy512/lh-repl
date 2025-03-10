import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  Map, 
  Users2, 
  CreditCard,
  Wallet
} from "lucide-react";
import { signOut, signInWithGoogle } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";

export function Navigation() {
  const [location, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const [isWebView, setIsWebView] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    // Check if we're in a webview context (iframe)
    const isEmbedded = window.parent !== window;
    const userAgent = navigator.userAgent;
    setIsWebView(isEmbedded);
    setCurrentUrl(window.location.href);
    
    console.log("Navigation render state:", {
      user,
      isLoading,
      location,
      isWebView: isEmbedded,
      currentUrl: window.location.href
    });
  }, [user, isLoading, location]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleSignIn = async () => {
    try {
      console.log("Auth button clicked:", { isWebView });
      
      // Use the improved signInWithGoogle that handles webview context
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const userInitials = user?.username
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Public Links */}
        <div className="flex items-center space-x-8">
          <div 
            className="font-bold text-xl cursor-pointer" 
            onClick={() => navigate("/")}
          >
            LandHacker
          </div>

          {!user && !isLoading && (
            <nav className="hidden md:flex items-center space-x-4">
              <Button
                variant={location === "/features" ? "default" : "ghost"}
                onClick={() => navigate("/features")}
              >
                Features
              </Button>
              <Button
                variant={location === "/pricing" ? "default" : "ghost"}
                onClick={() => navigate("/pricing")}
              >
                Pricing
              </Button>
            </nav>
          )}
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <>
              <div className="text-sm text-muted-foreground">
                Credits: {user.credits || 0}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/app")}>
                    <Map className="mr-2 h-4 w-4" />
                    <span>App</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/team-management")}>
                    <Users2 className="mr-2 h-4 w-4" />
                    <span>Team Management</span>
                    <span className="ml-auto text-xs text-muted-foreground">$10/seat</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/purchase-tokens")}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Purchase Tokens</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/membership")}>
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>Membership</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button 
              variant="ghost" 
              className="relative h-8 w-8 rounded-full"
              onClick={handleSignIn}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}