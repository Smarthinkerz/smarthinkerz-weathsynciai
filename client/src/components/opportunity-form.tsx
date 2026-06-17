import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsertOpportunity, insertOpportunitySchema } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OpportunityFormProps {
  onSubmit: (data: InsertOpportunity) => Promise<void>;
  isSubmitting?: boolean;
}

export function OpportunityForm({
  onSubmit,
  isSubmitting = false,
}: OpportunityFormProps) {
  const { toast } = useToast();
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const isFormSubmitting = isSubmitting || internalSubmitting;

  const form = useForm<InsertOpportunity>({
    resolver: zodResolver(insertOpportunitySchema),
    defaultValues: {
      name: "",
      description: "",
      earnings: 0,
      url: "",
      location: "",
      company: "",
    },
  });

  const handleSubmit = async (data: InsertOpportunity) => {
    setInternalSubmitting(true);
    try {
      const formattedData = {
        ...data,
        earnings: Number(data.earnings),
      };
      await onSubmit(formattedData);
      form.reset();
      toast({
        title: "Success",
        description: "Opportunity saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save opportunity",
        variant: "destructive",
      });
    } finally {
      setInternalSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title*</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter opportunity title" />
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
              <FormLabel>Description*</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describe the opportunity"
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="earnings"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budget ($)*</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  placeholder="Enter budget amount"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter company name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Remote, New York" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input {...field} type="url" placeholder="https://example.com/job" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isFormSubmitting}
        >
          {isFormSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Save Opportunity"
          )}
        </Button>
      </form>
    </Form>
  );
}

interface OpportunityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InsertOpportunity) => Promise<void>;
}

export function OpportunityFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: OpportunityFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: InsertOpportunity) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error("Form submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Opportunity</DialogTitle>
        </DialogHeader>
        <OpportunityForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}