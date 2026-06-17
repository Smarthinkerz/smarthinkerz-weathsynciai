import { isHighTier } from '@shared/schema';
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Lock, Send, Clock } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const ticketSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  description: z.string().min(10, "Please provide more details"),
  priority: z.enum(["low", "medium", "high"]),
});

type TicketForm = z.infer<typeof ticketSchema>;

export function SupportTicket() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isPremium = isHighTier(user?.subscriptionTier);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: "",
      description: "",
      priority: isPremium ? "high" : "low",
    },
  });

  const onSubmit = async (data: TicketForm) => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/support/ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create ticket");

      toast({
        title: "Success",
        description: isPremium 
          ? "Your priority support ticket has been created. We'll respond within 2 hours."
          : "Your support ticket has been created. We'll respond within 24 hours.",
      });

      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create support ticket",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isPremium ? (
            <>
              Support Ticket
              <Badge variant="default">Priority Support</Badge>
            </>
          ) : (
            <>
              <Lock className="h-5 w-5" />
              Standard Support
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isPremium && (
          <div className="mb-4 text-muted-foreground">
            <p>Upgrade to Premium for priority support with:</p>
            <ul className="list-disc list-inside mt-2">
              <li>2-hour response time guarantee</li>
              <li>Priority ticket handling</li>
              <li>Direct access to senior support staff</li>
            </ul>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of your issue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please provide detailed information about your issue"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Expected response time: {isPremium ? "2 hours" : "24 hours"}
              </span>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Creating Ticket..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Ticket
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
