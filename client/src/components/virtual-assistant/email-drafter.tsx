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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

const emailSchema = z.object({
  recipient: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  purpose: z.string().min(1, "Purpose is required"),
  tone: z.string().min(1, "Tone is required"),
  keyPoints: z.string().min(1, "Key points are required"),
  additionalContext: z.string().optional(),
});

type EmailForm = z.infer<typeof emailSchema>;

export function EmailDrafter() {
  const { toast } = useToast();
  const [generatedEmail, setGeneratedEmail] = useState<string | null>(null);

  const form = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      recipient: "",
      subject: "",
      purpose: "",
      tone: "professional",
      keyPoints: "",
      additionalContext: "",
    },
  });

  const generateEmailMutation = useMutation({
    mutationFn: async (data: EmailForm) => {
      const response = await fetch("/api/virtual-assistant/generate-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate email");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedEmail(data.email);
      toast({
        title: "Success",
        description: "Email draft generated successfully!",
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

  function onSubmit(data: EmailForm) {
    generateEmailMutation.mutate(data);
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="recipient"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="recipient@example.com" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter email subject" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purpose</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="What is the main purpose of this email?" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tone</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., professional, friendly, formal" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Specify the tone you want for your email
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="keyPoints"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Key Points</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter the main points to cover in the email" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="additionalContext"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Context (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Any additional context or background information" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={generateEmailMutation.isPending}
            className="w-full"
          >
            {generateEmailMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Email...
              </>
            ) : (
              "Generate Email"
            )}
          </Button>
        </form>
      </Form>

      {generatedEmail && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Generated Email</h3>
          <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
            {generatedEmail}
          </div>
        </div>
      )}
    </div>
  );
}
