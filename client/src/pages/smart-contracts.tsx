import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SmartContract } from "@shared/schema";
import { Loader2, Plus, ChevronDown, ArrowLeft, Trash2, Sparkles } from "lucide-react";
import { LegalDisclaimer } from "@/components/integrity/disclaimers";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { AIContractGenerator } from "@/components/ai-contract-generator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SmartContractsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [newContract, setNewContract] = useState({
    name: "",
    description: "",
    counterpartyId: "",
    terms: {
      agreement: "",
      conditions: [""],
      compensation: {
        amount: 0,
        currency: "USD",
        paymentSchedule: "milestone"
      }
    }
  });

  const { data: contracts = [], isLoading } = useQuery<SmartContract[]>({
    queryKey: ["/api/smart-contracts"],
    staleTime: 0, // Always fetch fresh data
  });

  // Add query for available users with error handling
  const { data: availableUsers = [], isLoading: isUsersLoading } = useQuery<{ id: number; name: string; username: string }[]>({
    queryKey: ["/api/users/available"],
  });

  // Add debug logging
  console.log("Available users:", availableUsers);

  const createMutation = useMutation({
    mutationFn: async (data: typeof newContract) => {
      if (!data.name || !data.description || !data.counterpartyId || !data.terms.agreement) {
        throw new Error("Please fill in all required fields");
      }

      if (data.counterpartyId === user?.id.toString()) {
        throw new Error("Cannot create a contract with yourself as the counterparty");
      }

      const contractData = {
        name: data.name,
        description: data.description,
        counterparty_id: parseInt(data.counterpartyId),
        terms: {
          agreement: data.terms.agreement,
          conditions: data.terms.conditions.filter(c => c.trim() !== ""),
          compensation: {
            amount: Number(data.terms.compensation.amount),
            currency: data.terms.compensation.currency,
            paymentSchedule: data.terms.compensation.paymentSchedule
          }
        }
      };

      console.log('Sending contract data:', contractData);
      const res = await apiRequest("POST", "/api/smart-contracts", contractData);

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Contract creation error:', errorData);
        throw new Error(errorData.error || "Failed to create smart contract");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-contracts"] });
      setShowForm(false);
      setNewContract({
        name: "",
        description: "",
        counterpartyId: "",
        terms: {
          agreement: "",
          conditions: [""],
          compensation: {
            amount: 0,
            currency: "USD",
            paymentSchedule: "milestone"
          }
        }
      });
      toast({
        title: "Success",
        description: "Contract created successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Contract creation error:", error);
      toast({
        title: "Error creating contract",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (contractId: number) => {
      const response = await fetch(`/api/smart-contracts/${contractId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete contract');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-contracts"] });
      toast({
        title: "Success",
        description: "Contract was successfully deleted",
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

  const activateMutation = useMutation({
    mutationFn: async (contractId: number) => {
      const res = await apiRequest("POST", `/api/smart-contracts/${contractId}/activate`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to activate contract");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smart-contracts"] });
      toast({
        title: "Success",
        description: "Contract activated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error activating contract",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newContract);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Smart Contracts</h1>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Contract
        </Button>
      </div>

      <LegalDisclaimer className="mb-6" />

      {showForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Contract</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Contract Name</label>
              <Input
                value={newContract.name}
                onChange={(e) => setNewContract({ ...newContract, name: e.target.value })}
                placeholder="Enter contract name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={newContract.description}
                onChange={(e) => setNewContract({ ...newContract, description: e.target.value })}
                placeholder="Describe the contract terms and conditions"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Counterparty</label>
              <select 
                className="w-full p-2 border rounded"
                value={newContract.counterpartyId}
                onChange={(e) => setNewContract({ ...newContract, counterpartyId: e.target.value })}
                required
              >
                <option value="">Select a counterparty</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id.toString()}>
                    {user.name} ({user.username})
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground mt-1">
                Select the counterparty for your contract
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Agreement Terms</label>
              <Textarea
                value={newContract.terms.agreement}
                onChange={(e) => setNewContract({
                  ...newContract,
                  terms: { ...newContract.terms, agreement: e.target.value }
                })}
                placeholder="Enter the agreement terms"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Compensation Amount (USD)</label>
              <Input
                type="number"
                value={newContract.terms.compensation.amount}
                onChange={(e) => setNewContract({
                  ...newContract,
                  terms: {
                    ...newContract.terms,
                    compensation: {
                      ...newContract.terms.compensation,
                      amount: Number(e.target.value)
                    }
                  }
                })}
                placeholder="Enter amount"
                required
              />
            </div>
            <div className="flex gap-4">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Create Contract
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}
      
      {/* AI Contract Generator */}
      <Card className="p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            AI-Powered Contract Generator
          </h2>
        </div>
        <AIContractGenerator 
          onSaveContract={(contractData) => {
            // Convert to the format expected by createMutation
            const formattedContract = {
              name: contractData.name,
              description: contractData.description,
              counterpartyId: availableUsers.length > 0 ? availableUsers[0].id.toString() : "",
              terms: {
                agreement: contractData.terms.agreement,
                conditions: [],
                compensation: {
                  amount: contractData.terms.compensation.amount,
                  currency: "USD",
                  paymentSchedule: "milestone"
                }
              }
            };
            
            // Set the contract data and submit it
            setNewContract(formattedContract);
            createMutation.mutate(formattedContract);
          }} 
        />
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Contracts</h2>
        {contracts.length === 0 ? (
          <p className="text-muted-foreground">No contracts found. Create your first contract to get started.</p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {contracts.map((contract) => (
              <AccordionItem key={contract.id} value={contract.id.toString()}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{contract.name}</span>
                      <span className="text-sm px-2 py-1 rounded-full bg-muted">
                        {contract.status}
                      </span>
                      {contract.creator_id === user?.id && (
                        <span className="text-xs text-muted-foreground">(Creator)</span>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">{contract.description}</p>
                    <div className="space-y-2">
                      <h4 className="font-medium">Terms</h4>
                      <pre className="text-sm bg-muted p-4 rounded-md whitespace-pre-wrap">{contract.terms?.agreement}</pre>
                      <div className="mt-4">
                        <h5 className="text-sm font-medium">Compensation</h5>
                        <p className="text-sm">
                          Amount: ${contract.terms?.compensation?.amount} ({contract.terms?.compensation?.currency})
                          <br />
                          Schedule: {contract.terms?.compensation?.paymentSchedule}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {contract.status === "draft" && contract.creator_id === user?.id && (
                        <Button
                          onClick={() => activateMutation.mutate(contract.id)}
                          disabled={activateMutation.isPending}
                        >
                          {activateMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Activate Contract
                        </Button>
                      )}
                      {contract.creator_id === user?.id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Contract</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this contract? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(contract.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {deleteMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Delete"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}