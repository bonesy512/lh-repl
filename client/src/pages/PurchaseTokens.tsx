import { TokenPurchase } from "@/components/TokenPurchase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export default function PurchaseTokens() {
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Purchase Tokens</CardTitle>
          <CardDescription>
            Add more tokens to your account for property analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              Current balance: {user?.credits || 0} tokens
            </p>
          </div>
          <TokenPurchase />
        </CardContent>
      </Card>
    </div>
  );
}
