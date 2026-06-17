import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

const businessPlanSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  industry: z.string().min(1, "Industry is required"),
  targetMarket: z.string().min(1, "Target market is required"),
  businessModel: z.string().min(1, "Business model is required"),
  uniqueSellingProposition: z.string().min(1, "USP is required"),
  competitorAnalysis: z.string().min(1, "Competitor analysis is required"),
  financialProjections: z.string().min(1, "Financial projections are required"),
  marketingStrategy: z.string().min(1, "Marketing strategy is required"),
});

type BusinessPlanForm = z.infer<typeof businessPlanSchema>;

export function BusinessPlanGenerator() {
  const { toast } = useToast();
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);

  const form = useForm<BusinessPlanForm>({
    resolver: zodResolver(businessPlanSchema),
    defaultValues: {
      businessName: "",
      industry: "",
      targetMarket: "",
      businessModel: "",
      uniqueSellingProposition: "",
      competitorAnalysis: "",
      financialProjections: "",
      marketingStrategy: "",
    },
  });

  const generatePlanMutation = useMutation({
    mutationFn: async (data: BusinessPlanForm) => {
      const response = await fetch("/api/virtual-assistant/generate-business-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate business plan");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedPlan(data.plan);
      toast({
        title: "Success",
        description: "Business plan generated successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: BusinessPlanForm) {
    generatePlanMutation.mutate(data);
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your business name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., Technology, Healthcare, Retail" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="targetMarket"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Market</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe your target market demographics and characteristics" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="businessModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Model</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe how your business will make money" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="uniqueSellingProposition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unique Selling Proposition</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="What makes your business unique?" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="competitorAnalysis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Competitor Analysis</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Who are your main competitors and how do you differentiate?" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="financialProjections"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Financial Projections</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Outline your expected revenue, costs, and profitability" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="marketingStrategy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marketing Strategy</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="How will you reach and acquire customers?" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={generatePlanMutation.isPending}
            className="w-full"
          >
            {generatePlanMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Plan...
              </>
            ) : (
              "Generate Business Plan"
            )}
          </Button>
        </form>
      </Form>

      {generatedPlan && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Generated Business Plan</h3>
          <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
            {generatedPlan}
          </div>
        </div>
      )}
    </div>
  );
}
