
import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreditCard, Users } from "lucide-react";
import { TokenPurchase } from "@/components/TokenPurchase";
import { useAuth } from "@/hooks/use-auth";

export default function Settings() {
  const { user } = useAuth();
  
  // Mock subscription data (replace with real data when available)
  const subscription = {
    plan: "Professional Plan",
    price: "$20/month",
    additionalSeats: 0
  };

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
                <h3 className="text-lg font-semibold">{subscription.plan}</h3>
                <p className="text-sm text-muted-foreground">{subscription.price}</p>
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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Basic</h3>
                <p className="text-sm text-muted-foreground">100 Tokens</p>
              </div>
              <p className="text-2xl font-bold mb-4">$49</p>
              <Button className="w-full" variant="default">Purchase</Button>
            </div>
            
            <div className="border rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Professional</h3>
                <p className="text-sm text-muted-foreground">250 Tokens</p>
              </div>
              <p className="text-2xl font-bold mb-4">$99</p>
              <Button className="w-full" variant="default">Purchase</Button>
            </div>
            
            <div className="border rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Enterprise</h3>
                <p className="text-sm text-muted-foreground">1000 Tokens</p>
              </div>
              <p className="text-2xl font-bold mb-4">$299</p>
              <Button className="w-full" variant="default">Purchase</Button>
            </div>
          </div>
          
          <div className="text-center my-6">or</div>
          
          {/* Solana Payments Section */}
          <div className="border rounded-lg p-6 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Solana Payments</h3>
                <p className="text-sm text-muted-foreground">Purchase tokens using Solana cryptocurrency</p>
              </div>
              <div className="text-sm bg-muted px-2 py-1 rounded">Coming Soon</div>
            </div>
            <Button className="w-full mt-4" variant="outline" disabled>
              Connect Wallet
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View your recent transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            No billing history available
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
