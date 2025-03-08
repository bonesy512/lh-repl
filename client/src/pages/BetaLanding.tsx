import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Map, Brain, BarChart3, Check } from "lucide-react";

const betaSignupSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
});

type BetaSignupForm = z.infer<typeof betaSignupSchema>;

export default function BetaLanding() {
  const { toast } = useToast();
  const form = useForm<BetaSignupForm>({
    resolver: zodResolver(betaSignupSchema),
  });

  async function onSubmit(data: BetaSignupForm) {
    try {
      // TODO: Implement beta signup API
      console.log("Beta signup:", data);
      toast({
        title: "Success!",
        description: "Thanks for signing up for beta access. We'll be in touch soon!",
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Revolutionizing Texas Land Real Estate
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          AI-powered land valuation and analysis platform designed specifically for
          Texas real estate professionals. Get early access to transform your land
          investment strategy.
        </p>

        {/* Beta Signup Form */}
        <div className="max-w-md mx-auto bg-card p-6 rounded-lg shadow-lg border">
          <h2 className="text-2xl font-bold mb-4">Get Beta Access</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Join the Waitlist
              </Button>
            </form>
          </Form>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 rounded-lg bg-card">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Map className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Texas-Focused Analysis</h3>
            <p className="text-muted-foreground">
              Specialized insights and valuations for Texas land properties, leveraging
              local market data and trends.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-card">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Insights</h3>
            <p className="text-muted-foreground">
              Advanced AI technology analyzes property potential, market trends, and
              investment opportunities.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-card">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Market Intelligence</h3>
            <p className="text-muted-foreground">
              Real-time data and analytics to help you make informed investment
              decisions in the Texas land market.
            </p>
          </div>
        </div>
      </section>

      {/* Early Access Benefits */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Beta Access Benefits
        </h2>
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-start">
            <Check className="h-5 w-5 text-primary mr-2 mt-1" />
            <p>Early adopter pricing locked in for life</p>
          </div>
          <div className="flex items-start">
            <Check className="h-5 w-5 text-primary mr-2 mt-1" />
            <p>Priority access to new features and updates</p>
          </div>
          <div className="flex items-start">
            <Check className="h-5 w-5 text-primary mr-2 mt-1" />
            <p>Direct influence on product development</p>
          </div>
          <div className="flex items-start">
            <Check className="h-5 w-5 text-primary mr-2 mt-1" />
            <p>Exclusive Texas land market insights and reports</p>
          </div>
        </div>
      </section>

      {/* Texas Market Focus */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">
          Built for Texas Land Professionals
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Whether you're a realtor, investor, or developer, Landhacker provides the
          tools you need to succeed in the Texas land market. Join our beta program
          to get ahead of the competition.
        </p>
      </section>
    </div>
  );
}
