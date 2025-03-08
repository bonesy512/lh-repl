import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, CreditCard, Package } from "lucide-react";
import { useLocation } from "wouter";
import { TOKEN_PACKAGES } from "@/lib/stripe";

export default function Pricing() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Professional Plan */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-muted-foreground">
              Start with our professional plan and scale your team as needed
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Subscription Plan */}
            <Card className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Professional Plan</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Everything you need to get started
                    </p>
                  </div>
                  <CreditCard className="h-8 w-8 text-primary" />
                </div>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$20</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span>Unlimited Property Analysis</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span>AI-Powered Comp Generation</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span>Marketing Campaign Tools</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span>5 Tokens Included Monthly</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span>Add Team Members ($10/month each)</span>
                  </li>
                </ul>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => navigate("/login")}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Token Packages */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Additional Tokens</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Purchase tokens for additional analyses
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(TOKEN_PACKAGES).map(([id, pkg]) => (
                    <div
                      key={id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div>
                        <h3 className="font-medium">{pkg.tokens} Tokens</h3>
                        <p className="text-sm text-muted-foreground">
                          ${(pkg.price / 100).toFixed(2)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => navigate("/login")}
                      >
                        Purchase
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
