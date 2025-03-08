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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreditCard, Settings, Users, LogOut } from "lucide-react";
import { signOut } from "@/lib/firebase";
import { useQuery } from "@tanstack/react-query";

export function Navigation() {
  const [location, navigate] = useLocation();
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  // Get user initials for avatar fallback
  const userInitials = user?.username
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          {/* Logo */}
          <div className="font-bold text-xl">LandHacker</div>
          
          {/* Main Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <Button
              variant={location === "/" ? "default" : "ghost"}
              onClick={() => navigate("/")}
            >
              Home
            </Button>
            <Button
              variant={location === "/dashboard" ? "default" : "ghost"}
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </Button>
          </nav>
        </div>

        {/* User Menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl} alt={user.username} />
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
                <Users className="mr-2 h-4 w-4" />
                <span>Team Members</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/dashboard?tab=billing")}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Subscription</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/dashboard?tab=billing")}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Purchase Tokens</span>
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
        )}
      </div>
    </header>
  );
}
