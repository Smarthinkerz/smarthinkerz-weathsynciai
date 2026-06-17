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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

const meetingSchema = z.object({
  title: z.string().min(1, "Meeting title is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  duration: z.string().min(1, "Duration is required"),
  attendees: z.string().min(1, "At least one attendee is required"),
  agenda: z.string().min(1, "Agenda is required"),
});

type MeetingForm = z.infer<typeof meetingSchema>;

export function MeetingScheduler() {
  const { toast } = useToast();
  const [scheduledMeeting, setScheduledMeeting] = useState<string | null>(null);

  const form = useForm<MeetingForm>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: "",
      date: "",
      time: "",
      duration: "60",
      attendees: "",
      agenda: "",
    },
  });

  const scheduleMeetingMutation = useMutation({
    mutationFn: async (data: MeetingForm) => {
      const response = await fetch("/api/virtual-assistant/schedule-meeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to schedule meeting");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setScheduledMeeting(data.details);
      toast({
        title: "Success",
        description: "Meeting scheduled successfully!",
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

  function onSubmit(data: MeetingForm) {
    scheduleMeetingMutation.mutate(data);
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meeting Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter meeting title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <FormControl>
                  <Input type="number" min="15" step="15" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="attendees"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Attendees</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter email addresses (comma-separated)" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Separate multiple email addresses with commas
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="agenda"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agenda</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Brief description of meeting agenda" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={scheduleMeetingMutation.isPending}
            className="w-full"
          >
            {scheduleMeetingMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scheduling Meeting...
              </>
            ) : (
              "Schedule Meeting"
            )}
          </Button>
        </form>
      </Form>

      {scheduledMeeting && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Meeting Scheduled</h3>
          <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
            {scheduledMeeting}
          </div>
        </div>
      )}
    </div>
  );
}
