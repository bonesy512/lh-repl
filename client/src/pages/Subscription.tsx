import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TokenPurchase } from "@/components/TokenPurchase";
import { CreditCard, Users, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Subscription() {
  const { toast } = useToast();
  
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: subscription } = useQuery({
    queryKey: ["/api/subscription"],
  });

  const { data: invoices } = useQuery({
    queryKey: ["/api/invoices"],
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Manage your subscription and team member seats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Professional Plan</h3>
                <p className="text-sm text-muted-foreground">$20/month</p>
              </div>
              <Button variant="outline">Change Plan</Button>
            </div>
            
            <div className="flex items-start space-x-4 border-t pt-4">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-medium">Team Members</h4>
                <p className="text-sm text-muted-foreground">
                  Base plan includes 1 seat
                </p>
                <p className="text-sm text-muted-foreground">
                  Additional seats: {subscription?.additionalSeats || 0} ($10/month each)
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-medium">Available Credits</h4>
                <p className="text-sm text-muted-foreground">
                  {user?.credits || 0} tokens remaining
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Purchase */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Tokens</CardTitle>
          <CardDescription>
            Add more tokens to your account for property analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TokenPurchase />
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View your recent transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices?.map((invoice: any) => (
              <div key={invoice.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{invoice.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(invoice.date).toLocaleDateString()}
                  </p>
                </div>
                <p className="font-medium">${invoice.amount}</p>
              </div>
            ))}
            {!invoices?.length && (
              <div className="flex items-center text-muted-foreground">
                <AlertCircle className="h-4 w-4 mr-2" />
                No billing history available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
