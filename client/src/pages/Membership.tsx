import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Users2, Star, History } from "lucide-react";

export default function Membership() {
  const { user, isLoading: authLoading } = useAuth();
  
  const { data: teamData, isLoading: loadingTeam } = useQuery({
    queryKey: ["/api/team"],
    enabled: !!user
  });

  if (authLoading || loadingTeam) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Membership</h1>
        <Button variant="destructive">Cancel Membership</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your subscription details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <span className="font-medium">Professional Plan</span>
              </div>
              <div className="flex items-center gap-2">
                <Users2 className="h-5 w-5 text-primary" />
                <span>{teamData?.members?.length || 1} Team Members</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <span>{user?.credits || 0} Available Tokens</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>Recent transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">No recent transactions</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
