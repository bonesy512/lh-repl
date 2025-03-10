
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

export default function TeamMembersCard() {
  const { data: teamData, isLoading } = useQuery({
    queryKey: ["/api/team"],
  });

  const availableSeats = teamData ? 3 - (teamData.members?.length || 1) : 0;
  const totalSeats = 3;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Team Members</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-12 flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">
              {totalSeats - availableSeats}/{totalSeats}
            </div>
            <p className="text-xs text-muted-foreground">
              {availableSeats} available seats
            </p>
            <Link href="/team-management" className="text-xs text-primary mt-2 block">
              Manage team →
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
