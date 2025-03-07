import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number;
}

const TOKEN_PACKAGES: TokenPackage[] = [
  { id: "basic", name: "Basic", tokens: 100, price: 49 },
  { id: "pro", name: "Professional", tokens: 250, price: 99 },
  { id: "enterprise", name: "Enterprise", tokens: 1000, price: 299 },
];

export function TokenPurchase() {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  async function handlePurchase(packageId: string) {
    try {
      setLoading(packageId);
      
      const response = await apiRequest(
        "POST",
        "/api/create-payment-intent",
        {
          packageId,
        }
      );
      
      const { clientSecret } = await response.json();
      
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe failed to load");

      const { error } = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (err: any) {
      toast({
        title: "Purchase Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {TOKEN_PACKAGES.map((pkg) => (
        <Card key={pkg.id}>
          <CardHeader>
            <CardTitle>{pkg.name}</CardTitle>
            <CardDescription>{pkg.tokens} Tokens</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <span className="text-3xl font-bold">${pkg.price}</span>
            </div>
            <Button
              className="w-full"
              onClick={() => handlePurchase(pkg.id)}
              disabled={loading === pkg.id}
            >
              {loading === pkg.id && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Purchase
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
