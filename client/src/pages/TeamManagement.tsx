
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { PlusCircle, MinusCircle, Loader2, Mail, Users, Users2 } from "lucide-react";

interface TeamMember {
  id: number;
  email: string;
  name: string;
  role: string;
  allocatedCredits: number;
}

export default function TeamManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");

  const { data: teamData, isLoading } = useQuery({
    queryKey: ["/api/team"],
    enabled: !!user,
  });

  const addSeatMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/team/seats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await user?.getIdToken()}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to add seat");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["/api/team"]});
      toast({
        title: "Seat Added",
        description: "Successfully purchased an additional team member seat.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add seat",
        variant: "destructive"
      });
    }
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    // TODO: Implement team member invitation API
    toast({
      title: "Invitation Sent",
      description: `An invitation has been sent to ${inviteEmail}`,
    });
    setInviteEmail("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const availableSeats = 3 - (teamData?.members?.length || 1);
  const teamMembers = teamData?.members || [];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Team Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
          <CardDescription>
            Manage your team members and token allocations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground">
                Available Seats: {availableSeats} of 3
              </p>
              <p className="text-xs text-muted-foreground">
                Base membership includes 1 seat, purchase up to 2 additional seats
              </p>
            </div>
            {availableSeats > 0 && (
              <Button onClick={() => addSeatMutation.mutate()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Seat ($10/month)
              </Button>
            )}
          </div>

          {/* Invite Form */}
          <form onSubmit={handleInvite} className="flex gap-2 mb-6">
            <Input
              type="email"
              placeholder="Email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <Mail className="mr-2 h-4 w-4" />
              Invite
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage team members and their token allocation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {teamMembers && teamMembers.length > 0 ? (
              teamMembers.map((member: TeamMember) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback>
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {member.allocatedCredits} credits
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">No team members</h3>
                <p className="text-sm text-muted-foreground">
                  Start by inviting your first team member
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
