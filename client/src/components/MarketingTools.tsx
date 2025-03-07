import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { type Parcel } from "@shared/schema";
import { generateMarketingDescription } from "@/lib/openai";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  targetAudience: z.string().min(1, "Target audience is required"),
  customMessage: z.string().optional(),
});

interface MarketingToolsProps {
  parcel: Parcel;
}

export function MarketingTools({ parcel }: MarketingToolsProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      targetAudience: "",
      customMessage: "",
    },
  });

  async function onSubmit(values: z.infer<typeof campaignSchema>) {
    try {
      setLoading(true);
      
      // Generate AI marketing description
      const description = await generateMarketingDescription(
        parcel,
        values.targetAudience
      );

      // Create campaign
      await apiRequest("POST", "/api/campaigns", {
        name: values.name,
        parcelId: parcel.id,
        templateData: {
          description,
          customMessage: values.customMessage,
          targetAudience: values.targetAudience,
        },
        active: true,
      });

      toast({
        title: "Campaign Created",
        description: "Your marketing campaign has been created successfully.",
      });

      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Marketing Campaign</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetAudience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Audience</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Real estate investors, developers"
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add any custom message to include in the campaign"
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Campaign
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
