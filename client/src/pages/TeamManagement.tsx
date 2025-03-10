import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  const [inviteEmail, setInviteEmail] = useState("");

  const { data: teamMembers, isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team/members"],
    enabled: !!user,
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement team member invitation
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your team members and token allocation
          </p>
        </div>
        <Button onClick={() => window.location.href = "/purchase-seats"}>
          <Plus className="mr-2 h-4 w-4" /> Add Seats ($10/month)
        </Button>
      </div>

      <div className="grid gap-8">
        {/* Invite Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Invite Team Members</CardTitle>
            <CardDescription>
              Send invitations to new team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="email" className="sr-only">
                  Email
                </Label>
                <Input
                  id="email"
                  placeholder="colleague@company.com"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit">Send Invite</Button>
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
              {teamMembers?.map((member) => (
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
                      <p className="text-xs text-muted-foreground">
                        {member.role}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                </div>
              ))}

              {(!teamMembers || teamMembers.length === 0) && (
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
    </div>
  );
}
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, MinusCircle, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

export default function TeamManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState("");

  const { data: teamData, isLoading, refetch } = useQuery({
    queryKey: ["/api/team"],
    enabled: !!user,
  });

  const addSeatMutation = useMutation({
    mutationFn: async () => {
      // Implementation for adding a seat
      // This will be connected to your API later
      return new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Seat Added",
        description: "Successfully purchased an additional team member seat.",
      });
      refetch();
    },
  });

  const removeSeatMutation = useMutation({
    mutationFn: async (memberId: string) => {
      // Implementation for removing a seat
      // This will be connected to your API later
      return new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Seat Removed",
        description: "Successfully removed team member seat.",
      });
      refetch();
    },
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async (email: string) => {
      // Implementation for inviting a member
      // This will be connected to your API later
      return new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Invitation Sent",
        description: `An invitation has been sent to ${inviteEmail}`,
      });
      setInviteEmail("");
      refetch();
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail) {
      inviteMemberMutation.mutate(inviteEmail);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const availableSeats = 3 - (teamData?.members?.length || 1);

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

          {/* Invite Member Form */}
          <form onSubmit={handleInvite} className="mb-6">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Colleague's email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
              <Button 
                type="submit" 
                disabled={inviteMemberMutation.isPending || availableSeats === 0}
              >
                {inviteMemberMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Invite
              </Button>
            </div>
          </form>

          {/* Team Members Table */}
          <div>
            <h3 className="text-lg font-medium mb-3">Team Members</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Owner (current user) */}
                <TableRow>
                  <TableCell className="font-medium">
                    {user?.name || "You"} (Owner)
                  </TableCell>
                  <TableCell>{user?.email || "Loading..."}</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
                
                {/* Team members (if any) */}
                {teamData?.members?.map((member: any) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>Member</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeSeatMutation.mutate(member.id)}
                        disabled={removeSeatMutation.isPending}
                      >
                        <MinusCircle className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
