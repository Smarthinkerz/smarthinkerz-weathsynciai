import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";

// Form schema with validation
const contractFormSchema = z.object({
  title: z.string().min(1, "Contract title is required"),
  contractType: z.enum(["service", "purchase", "partnership", "employment", "nda"]),
  counterpartyId: z.string().min(1, "Counterparty is required"),
  terms: z.string().min(10, "Terms must be at least 10 characters"),
  amount: z.string().min(1, "Amount is required"),
  deadline: z.string().min(1, "Deadline is required"),
  conditions: z.string().min(10, "Execution conditions are required"),
});

type ContractFormData = z.infer<typeof contractFormSchema>;

const CONTRACT_TYPES = [
  { value: "service", label: "Service Agreement" },
  { value: "purchase", label: "Purchase Agreement" },
  { value: "partnership", label: "Partnership Agreement" },
  { value: "employment", label: "Employment Contract" },
  { value: "nda", label: "Non-Disclosure Agreement" },
];

interface AvailableUser {
  id: string;
  name: string;
  username: string;
}

export function SmartContractForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Initialize form
  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      title: "",
      contractType: "service",
      terms: "",
      amount: "",
      deadline: "",
      conditions: "",
    },
  });

  // Create contract mutation
  const createContract = useMutation({
    mutationFn: async (data: ContractFormData) => {
      const response = await fetch("/api/smart-contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.title,
          description: data.contractType + " agreement",
          counterparty_id: parseInt(data.counterpartyId),
          terms: {
            agreement: data.terms,
            conditions: [data.conditions],
            compensation: {
              amount: parseFloat(data.amount),
              currency: "USD",
              paymentSchedule: "milestone"
            }
          },
          status: "draft",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create contract");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contract Created",
        description: "Your smart contract has been created successfully.",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Load available users for counterparty selection
  React.useEffect(() => {
    async function fetchUsers() {
      setIsLoadingUsers(true);
      try {
        const response = await fetch("/api/users/available");
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        setAvailableUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load users:", error);
        toast({
          title: "Error",
          description: "Failed to load available users",
          variant: "destructive",
        });
        setAvailableUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    }

    fetchUsers();
  }, [toast]);

  // Form submission handler
  function onSubmit(data: ContractFormData) {
    createContract.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contract Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter contract title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contractType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contract Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select contract type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CONTRACT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="counterpartyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Counterparty</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select counterparty"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contract Terms</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter the terms and conditions of the contract"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contract Amount</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Enter contract amount" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deadline</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="conditions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Execution Conditions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Specify the conditions that must be met for contract execution"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={createContract.isPending}>
          {createContract.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Contract...
            </>
          ) : (
            "Create Smart Contract"
          )}
        </Button>
      </form>
    </Form>
  );
}