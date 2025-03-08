import { useState } from "react";
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
import { PlusCircle, MinusCircle, CreditCard } from "lucide-react";
import { TokenPurchase } from "@/components/TokenPurchase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TeamMembers() {
  const { toast } = useToast();
  const [showTokenPurchase, setShowTokenPurchase] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const { data: teamData } = useQuery({
    queryKey: ["/api/team"],
  });

  const addSeatMutation = useMutation({
    mutationFn: async () => {
      // Implementation for adding a seat
    },
    onSuccess: () => {
      toast({
        title: "Seat Added",
        description: "Successfully purchased an additional team member seat.",
      });
    },
  });

  const removeSeatMutation = useMutation({
    mutationFn: async (memberId: string) => {
      // Implementation for removing a seat
    },
    onSuccess: () => {
      toast({
        title: "Seat Removed",
        description: "Successfully removed team member seat.",
      });
    },
  });

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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Token Balance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Owner Row */}
              <TableRow>
                <TableCell className="font-medium">
                  {teamData?.owner?.username || "Owner"}
                </TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>{teamData?.owner?.credits || 0} tokens</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMember(teamData?.owner);
                      setShowTokenPurchase(true);
                    }}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Add Tokens
                  </Button>
                </TableCell>
              </TableRow>

              {/* Additional Members */}
              {teamData?.members?.map((member: any) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.username}
                  </TableCell>
                  <TableCell>Member</TableCell>
                  <TableCell>{member.credits || 0} tokens</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMember(member);
                          setShowTokenPurchase(true);
                        }}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Add Tokens
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeSeatMutation.mutate(member.id)}
                      >
                        <MinusCircle className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Token Purchase Dialog */}
      <Dialog open={showTokenPurchase} onOpenChange={setShowTokenPurchase}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Purchase Tokens for {selectedMember?.username}
            </DialogTitle>
          </DialogHeader>
          <TokenPurchase
            onSuccess={() => setShowTokenPurchase(false)}
            memberId={selectedMember?.id}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
