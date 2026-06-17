import { SmartContractDialog } from "@/components/smart-contract-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ManageContracts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['/api/smart-contracts'],
    queryFn: async () => {
      const response = await fetch('/api/smart-contracts');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch contracts');
      }
      return response.json();
    }
  });

  // Delete contract mutation
  const deleteContractMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['/api/smart-contracts'] });
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

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Smart Contracts</h1>
        <SmartContractDialog />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : contracts?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">No contracts created yet</p>
            <SmartContractDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contracts?.map((contract: any) => (
            <Card key={contract.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <CardTitle>{contract.name}</CardTitle>
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
                        onClick={() => deleteContractMutation.mutate(contract.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteContractMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Delete"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">Type: {contract.type}</p>
                <p className="text-sm text-muted-foreground mb-2">Status: {contract.status}</p>
                <p className="text-sm text-muted-foreground">
                  Created: {new Date(contract.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}